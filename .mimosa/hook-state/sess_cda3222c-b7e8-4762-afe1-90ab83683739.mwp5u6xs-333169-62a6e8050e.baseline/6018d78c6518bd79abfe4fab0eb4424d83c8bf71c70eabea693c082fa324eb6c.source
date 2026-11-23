// Names, hosts and redirect URIs. Everything here is a whitelist: when in doubt, refuse.

export const OFFICE_BASE_DOMAIN = "office.vevit.cz";

const RESERVED = new Set([
  "www", "api", "app", "apps", "admin", "root", "mail", "smtp", "imap", "pop", "ftp", "ns", "ns1", "ns2", "dns", "relay", "relays",
  "office", "cloud", "vevit", "account", "auth", "login", "sso", "oidc", "id", "static", "assets", "cdn", "status", "support", "help",
  "billing", "pay", "payments", "store", "shop", "edu", "services", "tools", "home", "test", "dev", "staging", "prod", "localhost",
  "autodiscover", "autoconfig", "_acme-challenge", "acme", "security", "abuse", "postmaster", "hostmaster", "webmaster", "noreply",
]);

export type NameCheck = { ok: true; name: string } | { ok: false; reason: "format" | "length" | "reserved" };

/**
 * A device sub-domain label: lower-case letters, digits and single hyphens, 3 to 40 characters, no hyphen at either end and no "--"
 * (which would admit punycode "xn--" labels), not on the reserved list.
 */
export function checkSubdomain(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, reason: "format" };
  const name = raw;
  if (name.length < 3 || name.length > 40) return { ok: false, reason: "length" };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return { ok: false, reason: "format" };
  if (RESERVED.has(name)) return { ok: false, reason: "reserved" };
  return { ok: true, name };
}

export function deviceHost(name: string): string {
  return `${name}.${OFFICE_BASE_DOMAIN}`;
}

export function deviceRedirectUri(name: string): string {
  return `https://${deviceHost(name)}/api/oidc/callback`;
}

/** The device name in `https://<name>.office.vevit.cz/api/oidc/callback`, or null when it is any other URI (exact shape, no query). */
export function deviceNameFromRedirect(uri: string): string | null {
  const m = /^https:\/\/([a-z0-9-]{3,40})\.office\.vevit\.cz\/api\/oidc\/callback$/.exec(uri);
  if (!m) return null;
  const check = checkSubdomain(m[1]);
  return check.ok ? check.name : null;
}

/** The only TXT name a device may set: `_acme-challenge.<its name>.office.vevit.cz` (a trailing dot is tolerated, nothing else). */
export function acmeRecordName(deviceName: string): string {
  return `_acme-challenge.${deviceHost(deviceName)}`;
}

export function dnsNameAllowed(requested: unknown, deviceName: string): boolean {
  if (typeof requested !== "string") return false;
  const name = requested.endsWith(".") ? requested.slice(0, -1) : requested;
  return name === acmeRecordName(deviceName);
}

/** ACME DNS-01 TXT values are base64url SHA-256 digests (43 characters); anything else is refused. */
export function acmeValueOk(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function cleanDisplayName(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const s = raw.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 60);
  return s || fallback;
}
