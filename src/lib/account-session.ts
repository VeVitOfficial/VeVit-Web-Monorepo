import "server-only";

import { cookies } from "next/headers";
import { createHash, createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { appSecret } from "@/lib/app-secret";
import { SUPABASE_TIMEOUT_MS, timeoutFetch } from "@/lib/supabase-fetch";

export const ACCOUNT_SESSION_COOKIE = "__Host-vvsession";
export const ACCOUNT_LEGACY_SESSION_COOKIE = "__vvsession";

/** Authenticated account session (user row + derived CSRF token). */
export type AccountSession = NonNullable<Awaited<ReturnType<typeof loadAccountSession>>>;

/**
 * Load the account session from the request cookies. Returns null when no
 * valid session cookie is present; throws AccountBackendUnavailableError when
 * the backend cannot be reached.
 */
export async function loadSessionFromCookies(): Promise<AccountSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value
    ?? cookieStore.get(ACCOUNT_LEGACY_SESSION_COOKIE)?.value;
  return loadAccountSession(rawToken);
}

const USER_COLUMNS = [
  "id", "email", "nickname", "full_name", "tier", "tier_expires",
  "tier_billing", "tier_cancel_at", "role", "avatar_url", "phone",
  "location", "birth_date", "bio", "level", "xp", "created_at",
  "company_name", "ico", "dic", "billing_address", "language",
  "two_factor_enabled", "status"
].join(",");

export class AccountBackendUnavailableError extends Error {}

type AccountUser = Record<string, unknown> & {
  id: string;
  status: string;
};

type LoadedSession = { user: AccountUser; csrfToken: string };

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Supabase server configuration is missing");
  client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: timeoutFetch(SUPABASE_TIMEOUT_MS) },
  });
  return client;
}

function isSessionToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

// ── Krátká cache v paměti instance (jen pro opakované dotazy typu me.php) ──────────
// Platnost je záměrně krátká: zrušená session nebo změněný profil se projeví nejpozději
// po CACHE_TTL_MS i na jiné instanci. Na stejné instanci ji maže forgetCachedSessions().
const CACHE_TTL_MS = 15_000;
const CACHE_MAX = 500;
const sessionCache = new Map<string, { expires: number; value: LoadedSession }>();

/** Zapomene cachované session (všechny, nebo jen daného uživatele) — volat po odhlášení, revoke, změně hesla. */
export function forgetCachedSessions(userId?: string) {
  if (!userId) return sessionCache.clear();
  for (const [hash, entry] of sessionCache) if (entry.value.user.id === userId) sessionCache.delete(hash);
}

// ── last_seen_at stačí zapisovat jednou za pár minut ────────────────────────────
const TOUCH_INTERVAL_MS = 5 * 60_000;
const lastTouch = new Map<string, number>();

function touchSession(tokenHash: string, nowMs: number) {
  if (nowMs - (lastTouch.get(tokenHash) ?? 0) < TOUCH_INTERVAL_MS) return;
  lastTouch.set(tokenHash, nowMs);
  if (lastTouch.size > CACHE_MAX * 4) lastTouch.clear();
  void db()
    .from("sessions")
    .update({ last_seen_at: new Date(nowMs).toISOString() })
    .eq("token_hash", tokenHash)
    .then(({ error }) => {
      if (error) console.warn("Account session touch failed", { code: error.code });
    });
}

/**
 * Ověří session token. Session i uživatel se načtou jedním dotazem (embed přes FK
 * sessions.user_id → users). `cache: true` povolí krátkou cache — jen pro čtecí endpointy,
 * nikdy pro akce, které mění data.
 */
export async function loadAccountSession(rawToken: string | undefined, options: { cache?: boolean } = {}) {
  if (!isSessionToken(rawToken)) return null;

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const nowMs = Date.now();

  if (options.cache) {
    const hit = sessionCache.get(tokenHash);
    if (hit && hit.expires > nowMs) return hit.value;
    sessionCache.delete(tokenHash);
  }

  const { data, error } = await db()
    .from("sessions")
    .select(`user_id,user:users(${USER_COLUMNS})`)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date(nowMs).toISOString())
    .limit(1)
    .maybeSingle();
  if (error) throw new AccountBackendUnavailableError("Session lookup failed");

  const row = data as { user_id?: string; user?: AccountUser | null } | null;
  const user = row?.user ?? null;
  if (!row?.user_id || !user || user.id !== row.user_id || user.status !== "active") return null;

  touchSession(tokenHash, nowMs);

  const csrfToken = createHmac("sha256", appSecret("csrf"))
    .update(`${rawToken}|csrf`)
    .digest("hex");

  const value: LoadedSession = { user, csrfToken };
  if (options.cache) {
    if (sessionCache.size >= CACHE_MAX) sessionCache.delete(sessionCache.keys().next().value as string);
    sessionCache.set(tokenHash, { expires: nowMs + CACHE_TTL_MS, value });
  }
  return value;
}
