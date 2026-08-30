import tls from "node:tls";
import dns from "node:dns";
import net from "node:net";

/**
 * Port of tools/includes/ssl-checker.php — public TLS certificate inspection
 * with DNS-rebinding-safe direct-IP transport. DNS is resolved once and the
 * TLS stream is opened directly to an approved public address, with the
 * original hostname retained exclusively for SNI and TLS name verification.
 */

const SSL_CHECK_EXPIRES_SOON_DAYS = 14;
const CONNECT_TIMEOUT_MS = 10_000;

export type SslStatus =
  | "verified"
  | "expires_soon"
  | "invalid_hostname"
  | "dns_rejected"
  | "hostname_mismatch"
  | "untrusted_chain"
  | "expired"
  | "unreachable"
  | "verification_unavailable";

export interface SslCertificateInfo {
  subject: { CN: string; O: string; OU: string; C: string };
  issuer: { CN: string; O: string; C: string };
  validFrom: string;
  validTo: string;
  validToTime: number;
  serialNumber: string;
  version: number | null;
  signatureType: string;
  san: string[];
}

// ── Hostname policy (ssl_normalize_hostname) ─────────────────────────────────

export function sslNormalizeHostname(value: string): string | null {
  let v = value.trim();
  if (v === "" || v.length > 253) return null;
  if (/[/:?#@[\]]/.test(v)) return null;
  if (net.isIP(v)) return null;
  v = v.toLowerCase().replace(/\.+$/, "");
  if (v === "" || !v.includes(".")) return null;
  for (const label of v.split(".")) {
    if (label === "" || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return null;
  }
  return v;
}

// ── Public IP policy (ssl_ip_in_cidr / ssl_is_public_ip) ─────────────────────

function ip4ToLong(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

const PRIVATE_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24],
  ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
];

const PRIVATE_V6: Array<[string, number]> = [
  ["::", 128], ["::1", 128], ["::ffff:0:0", 96], ["64:ff9b::", 96],
  ["100::", 64], ["2001::", 32], ["2001:2::", 48], ["2001:10::", 28],
  ["2001:db8::", 32], ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
];

function bigToBits(ip: string): { bits: bigint; length: number } | null {
  try {
    const buf = new Uint8Array(net.isIPv4(ip) ? 4 : 16);
    // Node stores IPv4-mapped IPv6 canonically; parse via a temporary IPv6 form
    // so ::ffff:a.b.c.d ends up in the same number space as its networks.
    const normalized = net.isIPv4(ip) ? `::ffff:${ip}` : ip;
    if (!net.isIPv6(normalized)) return null;
    const expandGroup = (group: string): string[] => {
      if (!group.includes(".")) return [group];
      const bytes = group.split(".").map(Number);
      if (bytes.length !== 4 || bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return [group];
      return [((bytes[0]! << 8) | bytes[1]!).toString(16), ((bytes[2]! << 8) | bytes[3]!).toString(16)];
    };
    const groups = normalized.split("::");
    let left: string[]; let right: string[];
    if (groups.length === 2) {
      left = groups[0] ? groups[0].split(":").flatMap(expandGroup) : [];
      right = groups[1] ? groups[1].split(":").flatMap(expandGroup) : [];
    } else if (groups.length === 1) {
      left = groups[0]!.split(":").flatMap(expandGroup); right = [];
    } else {
      return null;
    }
    const middle = Array(Math.max(0, 8 - left.length - right.length)).fill("0");
    const all = [...left, ...middle, ...right];
    if (all.length !== 8) return null;
    let bits = 0n;
    for (const g of all) {
      const value = parseInt(g || "0", 16);
      if (!Number.isInteger(value) || value < 0 || value > 0xffff) return null;
      bits = (bits << 16n) | BigInt(value);
    }
    for (let i = 0; i < 16; i++) buf[i] = Number((bits >> BigInt((15 - i) * 8)) & 0xffn);
    return { bits, length: 128 };
  } catch {
    return null;
  }
}

function v6InCidr(ipBits: bigint, network: string, prefix: number): boolean {
  const parsed = bigToBits(network);
  if (!parsed) return false;
  if (prefix === 0) return true;
  return (ipBits >> BigInt(128 - prefix)) === (parsed.bits >> BigInt(128 - prefix));
}

export function sslIsPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const value = ip4ToLong(ip);
    if (value === null) return false;
    for (const [network, prefix] of PRIVATE_V4) {
      const base = ip4ToLong(network)!;
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      if ((value & mask) === (base & mask)) return false;
    }
    return true;
  }
  const parsed = bigToBits(ip);
  if (!parsed) return false;
  for (const [network, prefix] of PRIVATE_V6) {
    if (v6InCidr(parsed.bits, network, prefix)) return false;
  }
  return true;
}

// ── Resolver (ssl_default_resolver) ──────────────────────────────────────────

async function sslResolve(hostname: string): Promise<string[]> {
  const [v4, v6] = await Promise.allSettled([
    dns.promises.resolve4(hostname),
    dns.promises.resolve6(hostname),
  ]);
  const ips: string[] = [];
  for (const result of [v4, v6]) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      for (const ip of result.value) {
        if (typeof ip === "string" && (net.isIPv4(ip) || net.isIPv6(ip))) ips.push(ip);
      }
    }
  }
  return [...new Set(ips)];
}

// ── Connector (ssl_default_connector): direct-IP TLS with SNI = hostname ─────

function transportErrorClass(message: string): SslStatus {
  const e = message.toLowerCase();
  if (e.includes("peer certificate") || e.includes("peer name") || e.includes("hostname")) return "hostname_mismatch";
  if (e.includes("expired")) return "expired";
  if (e.includes("certificate") || e.includes("verify") || e.includes("ca ")) return "untrusted_chain";
  return "unreachable";
}

async function sslConnect(ip: string, hostname: string): Promise<{ ok: true; cert: tls.PeerCertificate } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: ip,
      port: 443,
      servername: hostname, // SNI + name verification against the real name
      rejectUnauthorized: true,
      timeout: CONNECT_TIMEOUT_MS,
    });
    const done = (result: { ok: true; cert: tls.PeerCertificate } | { ok: false; error: string }) => {
      socket.removeAllListeners();
      try { socket.destroy(); } catch { /* already closed */ }
      resolve(result);
    };
    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate(false);
      if (!cert || Object.keys(cert).length === 0) {
        done({ ok: false, error: "certificate unavailable" });
        return;
      }
      done({ ok: true, cert });
    });
    socket.once("timeout", () => done({ ok: false, error: "connection timeout" }));
    socket.once("error", (err) => done({ ok: false, error: err?.message ?? String(err) }));
  });
}

// ── Minimal DER reader — SAN, version, signature OID (Node exposes neither) ──

interface DerNode {
  tag: number;
  contentStart: number;
  contentEnd: number;
}

function derRead(buf: Buffer, pos: number): DerNode {
  let p = pos + 1;
  let len = buf[p]!;
  p += 1;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n > 4) throw new Error("DER length too long");
    len = buf.readUIntBE(p, n);
    p += n;
  }
  return { contentStart: p, contentEnd: p + len, tag: buf[pos]! };
}

function derChildren(buf: Buffer, start: number, end: number): DerNode[] {
  const nodes: DerNode[] = [];
  let pos = start;
  while (pos < end) {
    if (buf[pos] === 0) break; // indefinite length terminator
    const node = derRead(buf, pos);
    nodes.push(node);
    pos = node.contentEnd;
  }
  return nodes;
}

function derOid(buf: Buffer, node: DerNode): string {
  const bytes = buf.subarray(node.contentStart, node.contentEnd);
  if (bytes.length === 0) return "";
  const first = bytes[0]!;
  const parts = [String(Math.floor(first / 40)), String(first % 40)];
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    const b = bytes[i]!;
    value = (value << 7) | (b & 0x7f);
    if (!(b & 0x80)) {
      parts.push(String(value));
      value = 0;
    }
  }
  return parts.join(".");
}

const SIGNATURE_NAMES: Record<string, string> = {
  "1.2.840.113549.1.1.2": "RSA-MD2",
  "1.2.840.113549.1.1.4": "RSA-MD5",
  "1.2.840.113549.1.1.5": "RSA-SHA1",
  "1.2.840.113549.1.1.11": "RSA-SHA256",
  "1.2.840.113549.1.1.12": "RSA-SHA384",
  "1.2.840.113549.1.1.13": "RSA-SHA512",
  "1.2.840.113549.1.1.10": "RSASSA-PSS",
  "1.2.840.10045.4.1": "ECDSA-SHA1",
  "1.2.840.10045.4.3.1": "ECDSA-SHA224",
  "1.2.840.10045.4.3.2": "ECDSA-SHA256",
  "1.2.840.10045.4.3.3": "ECDSA-SHA384",
  "1.2.840.10045.4.3.4": "ECDSA-SHA512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
};

function parseDerExtras(raw: Buffer): { version: number | null; signatureType: string; san: string[] } {
  try {
    const root = derChildren(raw, 0, raw.length)[0]; // Certificate SEQUENCE
    if (!root) throw new Error("no root");
    const certChildren = derChildren(raw, root.contentStart, root.contentEnd);
    if (certChildren.length < 2) throw new Error("short cert");
    const tbs = certChildren[0]!;
    const sigNode = certChildren[1]!;
    const sigOid = derChildren(raw, sigNode.contentStart, sigNode.contentEnd)[0];
    const signatureType = sigOid ? SIGNATURE_NAMES[derOid(raw, sigOid)] ?? "—" : "—";

    const tbsChildren = derChildren(raw, tbs.contentStart, tbs.contentEnd);
    let version: number | null = null;
    if (tbsChildren.length > 0 && (tbsChildren[0]!.tag & 0xa0) === 0xa0) {
      const intNode = derChildren(raw, tbsChildren[0]!.contentStart, tbsChildren[0]!.contentEnd)[0];
      if (intNode && intNode.tag === 0x02) {
        const bytes = raw.subarray(intNode.contentStart, intNode.contentEnd);
        version = bytes.length === 1 ? bytes[0]! + 1 : null;
      }
    }

    const san: string[] = [];
    // Extensions live in the optional [3] (0xA3) element of tbsCertificate.
    const extContainer = tbsChildren.find((n) => n.tag === 0xa3);
    if (extContainer) {
      const extList = derChildren(raw, extContainer.contentStart, extContainer.contentEnd)[0];
      if (extList) {
        for (const ext of derChildren(raw, extList.contentStart, extList.contentEnd)) {
          const fields = derChildren(raw, ext.contentStart, ext.contentEnd);
          const oidNode = fields[0];
          if (!oidNode || derOid(raw, oidNode) !== "2.5.29.17") continue;
          const valueNode = fields[fields.length - 1]!; // OCTET STRING
          // Content of the OCTET STRING is the DER of GeneralNames.
          const generalNames = derChildren(raw, valueNode.contentStart, valueNode.contentEnd)[0];
          if (!generalNames) continue;
          for (const name of derChildren(raw, generalNames.contentStart, generalNames.contentEnd)) {
            if (name.tag === 0x82) san.push(raw.subarray(name.contentStart, name.contentEnd).toString("latin1"));
          }
        }
      }
    }
    return { version, signatureType, san };
  } catch {
    return { version: null, signatureType: "—", san: [] };
  }
}

// ── ssl_check_host ───────────────────────────────────────────────────────────

function dateField(ms: number | null): string {
  if (ms === null || Number.isNaN(ms)) return "—";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

function certField(value: unknown): string {
  return typeof value === "string" && value.length > 0 ? value : "—";
}

export type SslCheckResult =
  | { status: SslStatus }
  | { status: "verified" | "expires_soon"; certificate: SslCertificateInfo; days_left: number };

export async function sslCheckHost(input: string): Promise<SslCheckResult> {
  const hostname = sslNormalizeHostname(input);
  if (hostname === null) return { status: "dns_rejected" };

  let ips: string[];
  try {
    ips = await sslResolve(hostname);
  } catch {
    ips = [];
  }
  if (ips.length === 0) return { status: "unreachable" };
  for (const ip of ips) {
    if (!sslIsPublicIp(ip)) return { status: "dns_rejected" };
  }

  const transport = await sslConnect(ips[0]!, hostname);
  if (!transport.ok) return { status: transportErrorClass(transport.error) };

  const cert = transport.cert;
  const validFromMs = Date.parse(cert.valid_from);
  const validToMs = Date.parse(cert.valid_to);
  if (!Number.isFinite(validToMs) || validToMs <= 0) return { status: "verification_unavailable" };
  if (validToMs < Date.now()) return { status: "expired" };

  const extras = parseDerExtras(cert.raw!);
  const subject = (cert.subject ?? {}) as Record<string, string | undefined>;
  const issuer = (cert.issuer ?? {}) as Record<string, string | undefined>;
  return {
    status: Math.floor((validToMs - Date.now()) / 86_400_000) < SSL_CHECK_EXPIRES_SOON_DAYS
      ? "expires_soon"
      : "verified",
    days_left: Math.floor((validToMs - Date.now()) / 86_400_000),
    certificate: {
      subject: { CN: certField(subject.CN), O: certField(subject.O), OU: certField(subject.OU), C: certField(subject.C) },
      issuer: { CN: certField(issuer.CN), O: certField(issuer.O), C: certField(issuer.C) },
      validFrom: dateField(Number.isFinite(validFromMs) ? validFromMs : null),
      validTo: dateField(validToMs),
      validToTime: Math.floor(validToMs / 1000),
      serialNumber: typeof cert.serialNumber === "string" ? cert.serialNumber : "—",
      version: extras.version,
      signatureType: extras.signatureType,
      san: extras.san,
    },
  };
}