import { createHash } from "node:crypto";
import { storeRest } from "@/lib/store-config";
import "server-only";

/**
 * Port of store/lib/RateLimiter.php over the store_security_rate_limits
 * table (key_hash is the primary key, so PostgREST upsert carries the
 * semantics). PostgREST cannot run the PHP CASE expressions atomically, so
 * consume() reads the current bucket first and upserts merged values —
 * concurrent bumps may under-count by one, which is acceptable for a limiter
 * whose failure mode is a single extra request inside the window. When the
 * bucket is still live only the counter is upserted (window fields are
 * omitted from the payload, so merge-duplicates does not reset them).
 */

export class StoreRateLimitExceededError extends Error {
  constructor(readonly retryAfter: number) {
    super("Rate limit exceeded.");
  }
}

interface RateLimitRow {
  request_count: number;
  expires_at: string | null;
}

export async function storeRateLimitConsume(scope: string, identity: string, limit: number, windowSeconds: number): Promise<void> {
  if (!/^[a-z0-9_-]{1,64}$/.test(scope) || identity === "" || limit < 1 || windowSeconds < 1 || windowSeconds > 86400) {
    throw new Error("Invalid rate limit configuration.");
  }
  const keyHash = createHash("sha256").update(`${scope}\0${identity}`).digest("hex");
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  let current: RateLimitRow | null = null;
  try {
    const rows = await storeRest<RateLimitRow[]>(
      "GET",
      "store_security_rate_limits",
      { query: `select=request_count,expires_at&key_hash=eq.${keyHash}&limit=1` },
    );
    current = rows.json[0] ?? null;
  } catch {
    // A missing bucket reads as an empty array; any hard database outage
    // propagates to the handler, which fails closed with 5xx.
    current = null;
  }

  const expired = current === null || current.expires_at === null || new Date(current.expires_at) <= now;
  const requestCount = expired || current === null ? 1 : Math.max(1, Math.floor(current.request_count)) + 1;

  await storeRest(
    "POST",
    "store_security_rate_limits",
    {
      prefer: "resolution=merge-duplicates,return=minimal",
      // Expired buckets reset the window; live buckets bump only the count.
      body: expired
        ? { key_hash: keyHash, scope, request_count: requestCount, window_started_at: now.toISOString(), expires_at: windowEnd.toISOString(), updated_at: now.toISOString() }
        : { key_hash: keyHash, scope, request_count: requestCount, updated_at: now.toISOString() },
    },
  );

  if (requestCount > limit) {
    const retryAfter = !expired && current !== null && current.expires_at !== null
      ? Math.max(1, Math.ceil((new Date(current.expires_at).getTime() - now.getTime()) / 1000))
      : windowSeconds;
    throw new StoreRateLimitExceededError(retryAfter);
  }
}