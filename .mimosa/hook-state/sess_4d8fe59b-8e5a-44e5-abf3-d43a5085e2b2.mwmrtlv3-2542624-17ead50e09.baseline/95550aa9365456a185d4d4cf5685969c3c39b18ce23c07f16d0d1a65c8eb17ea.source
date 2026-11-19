import {
  createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual,
} from "node:crypto";

// Pure helpers for the Office OIDC provider and the Office API. No I/O, no framework imports,
// so they are unit-testable with `node --test`.

export function b64url(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString("base64url");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** n random bytes as base64url (256 bits = 32 bytes for tokens). */
export function randomToken(bytes = 32): string {
  return b64url(randomBytes(bytes));
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** RFC 7636 S256: BASE64URL(SHA256(verifier)). The verifier must be 43-128 unreserved characters. */
export function pkceChallenge(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

export function validVerifier(verifier: unknown): verifier is string {
  return typeof verifier === "string" && /^[A-Za-z0-9\-._~]{43,128}$/.test(verifier);
}

export function validChallenge(challenge: unknown): challenge is string {
  return typeof challenge === "string" && /^[A-Za-z0-9_-]{43}$/.test(challenge);
}

// No vowels and no look-alikes: codes read aloud or typed from a screen stay unambiguous.
const CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ23456789";

/** `XXXX-XXXX` (about 38 bits): user codes for pairing and the device flow. */
export function humanCode(): string {
  let out = "";
  for (let i = 0; i < 8; i += 1) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/** Accepts what a person types: case, spaces and a missing dash are forgiven. null when it cannot be a code. */
export function normalizeHumanCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const compact = raw.toUpperCase().replace(/[\s-]/g, "");
  if (!new RegExp(`^[${CODE_ALPHABET}]{8}$`).test(compact)) return null;
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

/**
 * AES-256-GCM for the one secret the database must hold briefly in a recoverable form: the device
 * token between "owner confirmed" and "server collected it". Key: 32 bytes (base64) from the environment.
 */
export function sealSecret(plain: string, keyB64: string): string {
  const key = Buffer.from(keyB64, "base64");
  if (key.length !== 32) throw new Error("sealing key must be 32 bytes");
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [b64url(iv), b64url(ct), b64url(c.getAuthTag())].join(".");
}

export function openSecret(sealed: string, keyB64: string): string | null {
  try {
    const key = Buffer.from(keyB64, "base64");
    const [iv, ct, tag] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
    if (key.length !== 32 || !iv || !ct || !tag) return null;
    const d = createDecipheriv("aes-256-gcm", key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Stable, non-reversible fingerprint of an IP for the audit log (no raw addresses stored). */
export function ipFingerprint(ip: string, secret: string): string {
  return createHmac("sha256", secret).update(`ip|${ip}`).digest("hex").slice(0, 32);
}
