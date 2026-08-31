import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import nacl from "tweetnacl";
import bcrypt from "bcryptjs";
import QRCode from "qrcode";

import { accountSupabase, verifyBcrypt } from "@/lib/account-auth";

/**
 * Next.js-side port of the TOTP 2FA verification used by the login flow
 * (account/lib/totp.php + account/lib/totp-endpoint.php + account/api/2fa/*).
 *
 * The login route (src/app/account/api/login.php/route.ts) creates a
 * `login_totp` challenge in `auth_challenges` and redirects to the verify
 * page. The two verify endpoints here consume that challenge and create the
 * real server-side session (sessions table + __Host-vvsession cookie).
 *
 * TOTP secrets are stored encrypted (libsodium secretbox, "v1." envelope) —
 * the same `TOTP_ENCRYPTION_KEY` the PHP side keeps in account/config.php must
 * be exposed to Next.js as the `TOTP_ENCRYPTION_KEY` environment variable.
 * TOTP codes are verified with the standard HMAC-SHA1 / 30s / 6-digit
 * construction and a ±1 step window, matching verifyTotpWindow() in totp.php.
 */

export interface ConsumedChallenge {
  user_id: string;
  payload: Record<string, unknown>;
}

// ── Challenge id validation (ported from totpChallengeId) ──────────────────────

export function totpChallengeId(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{48}$/.test(value) ? value : null;
}

// ── Challenge load + consume (ported from totp-endpoint.php) ───────────────────

export interface TotpChallenge {
  user_id: string;
  payload: Record<string, unknown>;
}

function decodePayload(raw: unknown): Record<string, unknown> {
  let payload = raw;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== "object") return {};
  return payload as Record<string, unknown>;
}

export async function loadTotpChallenge(id: string, kind: string): Promise<TotpChallenge | null> {
  const { data, error } = await accountSupabase()
    .from("auth_challenges")
    .select("id,user_id,kind,payload,expires_at,used_at,attempts")
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  if (row.kind !== kind) return null;
  if (row.used_at !== null && row.used_at !== undefined) return null;
  if (Number(row.attempts ?? 0) >= 5) return null;
  const expiresAt = row.expires_at;
  if (typeof expiresAt !== "string") return null;
  if (new Date(expiresAt).getTime() <= Date.now()) return null;
  return { user_id: String(row.user_id ?? ""), payload: decodePayload(row.payload) };
}

/** TOTP method row (secret + last verified step) for a user. */
export async function totpMethod(userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await accountSupabase()
    .from("user_totp_methods")
    .select("user_id,secret_ciphertext,enabled_at,last_verified_step,updated_at")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

function lastVerifiedStep(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ── Secret decryption (ported from decryptTotpSecret — sodium secretbox) ──────

let cachedKey: Uint8Array | null = null;
function totpEncryptionKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const encoded = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error("TOTP_ENCRYPTION_KEY is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("TOTP_ENCRYPTION_KEY must decode to 32 bytes");
  cachedKey = new Uint8Array(key);
  return cachedKey;
}

function base64urlToBytes(s: string): Buffer {
  let str = s.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

export function decryptTotpSecret(stored: string): string {
  if (typeof stored !== "string" || !stored.startsWith("v1.")) {
    throw new Error("totp_ciphertext");
  }
  const key = totpEncryptionKey();
  const bytes = base64urlToBytes(stored.slice(3));
  if (bytes.length <= 24) throw new Error("totp_ciphertext");
  const nonce = new Uint8Array(bytes.subarray(0, 24));
  const box = new Uint8Array(bytes.subarray(24));
  const plain = nacl.secretbox.open(box, nonce, key);
  if (!plain) throw new Error("totp_ciphertext");
  return Buffer.from(plain).toString("utf8");
}

// ── TOTP code verification (ported from verifyTotpWindow — HMAC-SHA1) ──────────

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32ToBytes(secret: string): Uint8Array {
  const cleaned = secret.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

function hotp(key: Uint8Array, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", Buffer.from(key)).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!;
  return String(binary % 1_000_000).padStart(6, "0");
}

/**
 * Verify a 6-digit TOTP code against the secret with a ±1 step window,
 * rejecting steps already used (<= lastStep). Returns the accepted step or null.
 */
export function verifyTotpWindow(secret: string, code: string, lastStep: number | null): number | null {
  if (!/^[0-9]{6}$/.test(code)) return null;
  const key = base32ToBytes(secret);
  if (key.length === 0) return null;
  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (const offset of [-1, 0, 1]) {
    const step = currentStep + offset;
    if (step < 0) continue;
    if (lastStep !== null && step <= lastStep) continue;
    const candidate = Buffer.from(hotp(key, step));
    const provided = Buffer.from(code);
    if (candidate.length === provided.length && timingSafeEqual(candidate, provided)) {
      return step;
    }
  }
  return null;
}

export function lastVerifiedStepOf(method: Record<string, unknown> | null): number | null {
  if (!method) return null;
  return lastVerifiedStep(method.last_verified_step);
}

// ── Recovery codes (ported from findUnusedRecoveryCode) ────────────────────────

export async function findUnusedRecoveryCode(userId: string, candidate: string): Promise<number | null> {
  if (!candidate) return null;
  const { data, error } = await accountSupabase()
    .from("user_recovery_codes")
    .select("id,code_hash")
    .eq("user_id", userId)
    .is("used_at", null)
    .limit(20);
  if (error || !Array.isArray(data)) return null;
  for (const row of data) {
    const r = row as Record<string, unknown>;
    const hash = r.code_hash;
    if (typeof hash !== "string" || hash === "") continue;
    if (await verifyBcrypt(candidate, hash)) return Number(r.id);
  }
  return null;
}

// ── Postgres RPC wrappers (consume_totp_login / consume_recovery_login /
//    record_2fa_failure live in the production database; called via .rpc) ──────

function rpcScalar<T>(data: unknown): T | null {
  if (Array.isArray(data)) return data.length === 1 ? (data[0] as T) : null;
  if (data && typeof data === "object") return data as T;
  return null;
}

function consumedFromRow(row: Record<string, unknown> | null): ConsumedChallenge | null {
  if (!row) return null;
  const userId = String(row.user_id ?? "");
  if (!userId) return null;
  return { user_id: userId, payload: decodePayload(row.payload) };
}

export async function record2faFailure(challengeId: string): Promise<void> {
  await accountSupabase().rpc("record_2fa_failure", { p_challenge_id: challengeId });
}

export async function consumeTotpLogin(challengeId: string, step: number): Promise<ConsumedChallenge | null> {
  const { data, error } = await accountSupabase().rpc("consume_totp_login", {
    p_challenge_id: challengeId,
    p_step: step,
  });
  if (error || !data) return null;
  return consumedFromRow(rpcScalar<Record<string, unknown>>(data));
}

export async function consumeRecoveryLogin(challengeId: string, codeId: number): Promise<ConsumedChallenge | null> {
  const { data, error } = await accountSupabase().rpc("consume_recovery_login", {
    p_challenge_id: challengeId,
    p_code_id: codeId,
  });
  if (error || !data) return null;
  return consumedFromRow(rpcScalar<Record<string, unknown>>(data));
}
// ── 2FA management helpers (ports from totp.php / totp-endpoint.php used by
//    setup-start / setup-confirm / disable / recovery-regenerate) ─────────────

/** Port of encryptTotpSecret — libsodium secretbox with a random nonce, "v1." envelope. */
export function encryptTotpSecret(secret: string): string {
  const key = totpEncryptionKey();
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(new Uint8Array(Buffer.from(secret, "utf8")), nonce, key);
  const combined = new Uint8Array(nonce.length + box.length);
  combined.set(nonce);
  combined.set(box, nonce.length);
  return "v1." + Buffer.from(combined).toString("base64url");
}

/** Port of generateTotpSecret — 20 random bytes as base32 (RFC 4648, no padding). */
export function generateTotpSecret(): string {
  const bytes = nacl.randomBytes(20);
  const alphabet = BASE32_ALPHABET;
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

/** Port of totpProvisioningUri — otpauth:// URI with issuer included as parameter. */
export function totpProvisioningUri(secret: string, rawLabel: string): string {
  const label = rawLabel.trim().slice(0, 80);
  const params = new URLSearchParams({
    secret,
    issuer: "VEVIT",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/VEVIT:${encodeURIComponent(label)}?${params.toString()}`;
}

/** Port of totpQrDataUri — QR of the provisioning URI as an SVG data URI. */
export async function totpQrDataUri(uri: string): Promise<string> {
  const svg = await QRCode.toString(uri, { type: "svg", width: 240, margin: 1, errorCorrectionLevel: "M" });
  return "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
}

/** Port of generateRecoveryCodes — 10 codes XXXX-XXXX-XXXX from an unambiguous alphabet. */
export function generateRecoveryCodes(count = 10): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes = new Set<string>();
  while (codes.size < count) {
    let raw = "";
    for (let i = 0; i < 12; i++) raw += alphabet[Math.floor(Math.random() * alphabet.length)];
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
  }
  return [...codes];
}

/** Port of hashRecoveryCodes — bcrypt each plaintext code. */
export async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

/**
 * Port of requireTotpReauthentication: password accounts must re-confirm with
 * their password; OAuth-only accounts pass a one-time totp_setup challenge
 * issued by the OAuth reauth flow. Throws ReauthRequiredError on failure.
 */
export class ReauthRequiredError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function requireTotpReauthentication(userId: string, body: Record<string, unknown>): Promise<void> {
  const { data } = await accountSupabase().from("users").select("password").eq("id", userId).limit(1).maybeSingle();
  const hash = (data as { password?: string } | null)?.password;
  if (typeof hash === "string" && hash !== "") {
    if (!(await verifyBcrypt(String(body.password ?? ""), hash))) {
      throw new ReauthRequiredError("Současné heslo je nesprávné.");
    }
    return;
  }
  const id = totpChallengeId(body.reauth_challenge);
  const challenge = id ? await loadTotpChallenge(id, "totp_setup") : null;
  const payload = challenge?.payload ?? {};
  if (!challenge || challenge.user_id !== userId || payload.purpose !== "oauth_reauth") {
    throw new ReauthRequiredError("Je nutné nové ověření přes připojenou službu.");
  }
  await accountSupabase().from("auth_challenges").update({ used_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z") }).eq("id", id);
}
