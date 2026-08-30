import "server-only";

import { cookies } from "next/headers";
import { createHash, createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

function serverConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Supabase server configuration is missing");
  return { url, key };
}

function isSessionToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value);
}

export async function loadAccountSession(rawToken: string | undefined) {
  if (!isSessionToken(rawToken)) return null;

  const { url, key } = serverConfig();
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("user_id,expires_at,revoked_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .limit(1)
    .maybeSingle();
  if (sessionError) throw new AccountBackendUnavailableError("Session lookup failed");
  if (!session?.user_id) return null;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", session.user_id)
    .limit(1)
    .maybeSingle();
  if (userError) throw new AccountBackendUnavailableError("User lookup failed");
  const user = userData as AccountUser | null;
  if (!user || user.status !== "active") return null;

  void supabase
    .from("sessions")
    .update({ last_seen_at: now })
    .eq("token_hash", tokenHash)
    .then(({ error }) => {
      if (error) console.warn("Account session touch failed", { code: error.code });
    });

  const csrfSecret = process.env.VEVIT_APP_SECRET?.trim() || key;
  const csrfToken = createHmac("sha256", csrfSecret)
    .update(`${rawToken}|csrf`)
    .digest("hex");

  return { user, csrfToken };
}
