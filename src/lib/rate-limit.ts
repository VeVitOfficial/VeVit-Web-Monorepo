import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { rateLimitArgsValid, rateLimitKey, type RateVerdict } from "@/lib/rate-limit-core";

export { rateLimitKey, type RateVerdict };

/**
 * Atomic fixed-window rate limiter shared by login, registration, password
 * reset, 2FA, store, services, tools and AI endpoints.
 *
 * The count is bumped by ONE statement in the database (office_rate_consume:
 * INSERT .. ON CONFLICT DO UPDATE .. RETURNING), so N concurrent requests are
 * serialised on the row and exactly `limit` of them pass. The earlier
 * read-then-write limiters let a burst of parallel requests all read the old
 * count and slip through. Fail closed: when the counter cannot be reached the
 * caller gets "unavailable" and must refuse the request.
 */

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new Error("Supabase server configuration is missing");
  client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

export async function consumeRateLimit(scope: string, identity: string, limit: number, windowSeconds: number): Promise<RateVerdict> {
  if (!rateLimitArgsValid(scope, identity, limit, windowSeconds)) return "unavailable";
  try {
    const { data, error } = await db().rpc("office_rate_consume", {
      p_key: rateLimitKey(scope, identity),
      p_window_seconds: Math.floor(windowSeconds),
      p_max: limit,
    });
    if (error) return "unavailable";
    return data === true ? "ok" : "limited";
  } catch {
    return "unavailable";
  }
}
