import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * Next.js-side port of the VeVit account auth (account/lib/* + shared/auth/session.php).
 *
 * The account section is being migrated off the legacy Supabase `auth` Edge
 * Function onto Next.js routes that share one server-side session model:
 * the `sessions` table + the `__Host-vvsession` cookie (see src/lib/account-session.ts).
 * `me.php` was migrated first; this module provides the shared primitives the
 * remaining endpoints (login, register, verify-2fa, …) need so they can follow.
 *
 * The login endpoint lives in src/app/account/api/login.php/route.ts.
 */

export const ACCOUNT_SESSION_COOKIE = "__Host-vvsession";
const LOCALES = ["cs", "en", "de", "es", "uk", "fr", "sk"] as const;
type Locale = (typeof LOCALES)[number];
const SESSION_DAYS = 99;

// Equivalent-work dummy hash so a missing user still pays the bcrypt cost,
// preventing timing-based account enumeration. Ported from login.php.
const DUMMY_PASSWORD_HASH = "$2y$12$DzmTmvnGr67voF.jFaQkhupI0djuR7dlzsQpzxUTQP2AZkjoNbj4W";

// Safe, non-secret user columns to expose in login responses (ported from
// _login_safe_user_columns). Keep this a real array, not a join, so it can
// be intersected against whatever the lookup selected.
const SAFE_USER_KEYS = [
  "id", "email", "nickname", "full_name", "tier", "tier_expires",
  "role", "avatar_url", "level", "xp", "language", "two_factor_enabled",
] as const;

export class AccountBackendUnavailableError extends Error {}

function serverConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Supabase server configuration is missing");
  return { url, key };
}

let cachedClient: SupabaseClient | null = null;
export function accountSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const { url, key } = serverConfig();
  cachedClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

export function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=UTF-8", ...(headers as Record<string, string> | undefined) },
  });
}

// ── Identifier classification (ported from phone-identity.php) ──────────────────

type Identifier = { kind: "email" | "phone" | "nickname"; value: string };

function normalizeE164Phone(input: string): string | null {
  let value = input.replace(/[\s().-]+/g, "").trim();
  if (!/^[\d+]*$/.test(value)) return null;
  if (value.startsWith("00420")) value = "+420" + value.slice(5);
  if (/^\d{9}$/.test(value)) value = "+420" + value;
  if (!/^\+420\d{9}$/.test(value)) return null;
  return value;
}

function normalizeNickname(input: string): string | null {
  let nickname = input.trim().replace(/\s+/gu, " ");
  if (nickname === "" || /[\p{Cc}\p{Cf}]/u.test(nickname)) return null;
  nickname = nickname.normalize("NFC");
  return nickname || null;
}

function nicknameLookupKey(input: string): string | null {
  const normalized = normalizeNickname(input);
  if (normalized === null) return null;
  return normalized.toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function classifyIdentifier(raw: string): Identifier | null {
  const value = raw.trim();
  if (value === "") return null;
  if (EMAIL_RE.test(value)) return { kind: "email", value: value.toLowerCase() };
  const phone = normalizeE164Phone(value);
  if (phone !== null) return { kind: "phone", value: phone };
  const nickname = normalizeNickname(value);
  if (nickname !== null && nickname.length >= 2 && nickname.length <= 40) {
    return { kind: "nickname", value: nickname };
  }
  return null;
}

// ── Registration validation (ported from registration-validation.php) ──────────
// Keep the policy identical between the register endpoint and the availability
// lookup so the UI never promises an unusable nickname.

/** Port of registerNicknameIsValid: 2–30 characters from [\p{L}\p{M}\p{N} ._'’-]. */
export function registerNicknameIsValid(nickname: string): boolean {
  const normalized = normalizeNickname(nickname);
  if (normalized === null) return false;
  const length = Array.from(normalized).length;
  return length >= 2 && length <= 30 && /^[\p{L}\p{M}\p{N} ._'’-]+$/u.test(normalized);
}

/** Port of registerNormalizeNickname (trim, collapse whitespace, NFC, no control chars). */
export function registerNormalizeNickname(nickname: string): string | null {
  return normalizeNickname(nickname);
}

export function registerNicknameLookupKey(nickname: string): string | null {
  return nicknameLookupKey(nickname);
}

/**
 * Port of registerPasswordError. Buffer.byteLength is deliberate: bcrypt's
 * 72-byte input ceiling is byte-based, not character-based.
 */
export function registerPasswordError(password: string): string | null {
  const bytes = Buffer.byteLength(password, "utf8");
  if (bytes < 8) return "Heslo musí mít alespoň 8 znaků.";
  if (bytes > 72) return "Heslo je příliš dlouhé.";
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Heslo nesplňuje bezpečnostní požadavky.";
  }
  return null;
}

/** Port of logActivity in auth-helpers.php: append to account_activity. */
export async function logActivity(userId: string, kind: string, detail = ""): Promise<void> {
  const { error } = await accountSupabase().from("account_activity").insert({
    user_id: userId,
    kind,
    detail,
    created_at: new Date().toISOString(),
  });
  if (error) console.error("[auth] account_activity insert failed");
}

// ── Anti-bot honeypot + timing gate (ported from anti-bot.php) ──────────────────
// On failure we reuse the rate-limit status/message so a bot cannot tell
// "detected as a bot" apart from "throttled".

const HP_MIN_MILLIS = 800;
const HP_MAX_MILLIS = 6 * 3600 * 1000;

export function antiBotPassed(body: Record<string, unknown>): boolean {
  if (body.hp_confirm !== "") return false;
  const raw = body.hp_ts;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return false;
  const renderedAt = Math.floor(raw);
  if (renderedAt <= 0) return false;
  const elapsed = Date.now() - renderedAt;
  return elapsed >= HP_MIN_MILLIS && elapsed <= HP_MAX_MILLIS;
}

// ── IP rate limiting via login_attempts (ported from checkRateLimit) ───────────
// Note: the identifier_hash column from migration 013 is not present in
// production, so only the IP-scoped limit is ported here.

export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoFromMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export async function checkRateLimit(ip: string, action: string, maxAttempts = 10, minutes = 15): Promise<boolean> {
  const since = isoFromMs(-minutes * 60 * 1000);
  const { count, error } = await accountSupabase()
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("action", action)
    .gt("attempt_time", since);
  if (error) return true; // fail open, matching the edge function
  return (count ?? 0) < maxAttempts;
}

export async function recordAttempt(ip: string, action: string): Promise<void> {
  await accountSupabase().from("login_attempts").insert({ ip_address: ip, action });
}

// ── Password verification (ported from login.php) ──────────────────────────────

function usableBcryptHash(hash: unknown): string | null {
  if (typeof hash !== "string" || hash === "") return null;
  // PHP issues $2y$; bcryptjs only accepts $2a$/$2b$.
  return hash.replace(/^\$2y\$/, "$2a$");
}

export async function verifyPassword(user: Record<string, unknown> | null, password: string): Promise<boolean> {
  const hash = usableBcryptHash(user?.password) ?? DUMMY_PASSWORD_HASH.replace(/^\$2y\$/, "$2a$");
  const ok = await bcrypt.compare(password, hash);
  const hasUser = !!user && typeof user.id === "string" && user.id !== "";
  return hasUser && ok;
}

/** Verify a candidate against a PHP-issued bcrypt hash ($2y$ is rewritten to $2a$). */
export async function verifyBcrypt(candidate: string, hash: string): Promise<boolean> {
  const usable = usableBcryptHash(hash);
  if (!usable) return false;
  try {
    return await bcrypt.compare(candidate, usable);
  } catch {
    return false;
  }
}

export function isProviderOnlyAccount(user: Record<string, unknown> | null): boolean {
  return (
    !!user &&
    typeof user.id === "string" &&
    user.id !== "" &&
    (!("password" in user) || user.password === null || user.password === "")
  );
}

// ── User lookup ───────────────────────────────────────────────────────────────

const LOGIN_LOOKUP_COLUMNS = "id,password,email,phone_verified_at,nickname,language,two_factor_enabled,status";

export async function findUserForLogin(identifier: Identifier): Promise<Record<string, unknown> | null> {
  const sb = accountSupabase();
  let query;
  if (identifier.kind === "email") {
    query = sb.from("users").select(LOGIN_LOOKUP_COLUMNS).eq("email", identifier.value);
  } else if (identifier.kind === "phone") {
    query = sb.from("users").select(LOGIN_LOOKUP_COLUMNS).eq("phone_e164", identifier.value);
  } else {
    const key = nicknameLookupKey(identifier.value);
    if (key === null) return null;
    query = sb.from("users").select(LOGIN_LOOKUP_COLUMNS).eq("nickname_normalized", key);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new AccountBackendUnavailableError("User lookup failed");
  return (data as Record<string, unknown> | null) ?? null;
}

// ── TOTP 2FA (ported from totp.php) ────────────────────────────────────────────

export async function totpIsActive(userId: string): Promise<boolean> {
  const { data, error } = await accountSupabase()
    .from("user_totp_methods")
    .select("user_id")
    .eq("user_id", userId)
    .not("enabled_at", "is", null)
    .limit(1);
  if (error) return false; // fail safe: treat as no 2FA rather than block everyone
  return Array.isArray(data) && data.length === 1;
}

export async function createTotpLoginChallenge(userId: string, remember: boolean, destination = "/account"): Promise<string | null> {
  const id = randomBytes(24).toString("hex");
  const safeDestination = destination.startsWith("/") && !destination.startsWith("//") ? destination : "/account";
  const { error } = await accountSupabase().from("auth_challenges").insert({
    id,
    user_id: userId,
    kind: "login_totp",
    payload: { remember, destination: safeDestination },
    expires_at: isoFromMs(5 * 60 * 1000),
  });
  return error ? null : id;
}

// ── Session creation (ported from createSession in auth-helpers.php) ──────────

function sessionExpiresAt(remember: boolean): string {
  const seconds = remember ? SESSION_DAYS * 86400 : 24 * 3600;
  return isoFromMs(seconds * 1000);
}

export async function createSession(
  request: Request,
  userId: string,
  remember: boolean,
): Promise<{ token: string; tokenHash: string } | null> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 240);
  const { data, error } = await accountSupabase()
    .from("sessions")
    .insert({
      token_hash: tokenHash,
      user_id: userId,
      remember,
      expires_at: sessionExpiresAt(remember),
      created_at: isoNow(),
      last_seen_at: isoNow(),
      ip_address: clientIp(request),
      user_agent: userAgent,
    })
    .select("token_hash")
    .single();
  if (error || !data || data.token_hash !== tokenHash) return null;
  return { token, tokenHash };
}

export function setSessionCookie(response: NextResponse, token: string, remember: boolean): void {
  // __Host- prefix requires: Secure, Path=/, no Domain. Vercel serves HTTPS.
  response.cookies.set(ACCOUNT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: SESSION_DAYS * 86400 } : {}),
  });
}

/**
 * Finish a 2FA login: create the server-side session from a consumed challenge
 * (payload carries remember + destination), set the session + locale cookies,
 * and return { redirect } the frontend location.replace()s to.
 *
 * Ported from completeTotpSession in account/lib/totp-endpoint.php: the
 * verify-2fa endpoints call this once the challenge is atomically consumed.
 */
export async function completeTotpSession(
  request: Request,
  consumed: { user_id: string; payload?: Record<string, unknown> },
): Promise<Response> {
  const userId = consumed.user_id;
  if (!userId) return json({ success: false, error: "Ověření se nepodařilo dokončit." }, 409);

  const payload = consumed.payload ?? {};
  const remember = payload.remember === true;
  const session = await createSession(request, userId, remember);
  if (session === null) return json({ success: false, error: "Chyba serveru." }, 500);

  const rawDestination = typeof payload.destination === "string" ? payload.destination : "/account";
  const destination = rawDestination.startsWith("/") && !rawDestination.startsWith("//") ? rawDestination : "/account";

  const { data: langRow } = await accountSupabase()
    .from("users")
    .select("language")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  const lang = (langRow as Record<string, unknown> | null)?.language ?? "cs";

  const redirect = localeRedirectTarget(destination, lang);
  const response = NextResponse.json(
    { success: true, redirect },
    { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=UTF-8" } },
  );
  setSessionCookie(response, session.token, remember);
  setLocaleCookie(response, String(lang));
  return response;
}

// ── Locale + redirect helpers (ported from shared/i18n/locale.php) ─────────────

function localeValid(code: unknown): Locale {
  return (LOCALES as readonly string[]).includes(code as string) ? (code as Locale) : "cs";
}

/** Sanitize a same-origin return path (ported from vv_safe_return_to). */
export function safeReturnTo(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string" || raw === "") return fallback;
  let parsed: URL;
  try {
    // Parse against a placeholder origin so relative paths ("/account") yield a
    // pathname while scheme/host-bearing inputs are detectable via .origin.
    parsed = new URL(raw, "https://placeholder.invalid");
  } catch {
    return fallback;
  }
  // Reject anything that carried its own scheme or host (incl. protocol-relative //host).
  if (parsed.origin !== "https://placeholder.invalid") return fallback;
  const path = parsed.pathname;
  if (!path || !path.startsWith("/")) return fallback;
  // One rawurldecode reveals /%2F%2F → // and /%5C → \ without triple-encode escape.
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    decodedPath = path;
  }
  if (decodedPath.startsWith("//") || decodedPath.includes("\\")) return fallback;
  let url = path.slice(0, 300);
  if (parsed.search) url += parsed.search.slice(0, 300);
  if (parsed.hash) url += parsed.hash.slice(0, 300);
  return url;
}

function stripLocalePrefix(path: string): string {
  const m = path.match(/^\/([a-z]{2})(\/|$)/);
  if (m && (LOCALES as readonly string[]).includes(m[1])) {
    const rest = path.slice(3);
    return rest === "" ? "/" : rest;
  }
  return path;
}

export function localeRedirectTarget(path: string, lang: unknown): string {
  const stripped = stripLocalePrefix(path);
  const locale = localeValid(lang);
  if (stripped === "/" || stripped === "") return `/${locale}/home`;
  return `/${locale}${stripped}`;
}

export function setLocaleCookie(response: NextResponse, lang: string): void {
  response.cookies.set("vevit-lang", localeValid(lang), {
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function safeUser(user: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set<string>(SAFE_USER_KEYS);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(user)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}