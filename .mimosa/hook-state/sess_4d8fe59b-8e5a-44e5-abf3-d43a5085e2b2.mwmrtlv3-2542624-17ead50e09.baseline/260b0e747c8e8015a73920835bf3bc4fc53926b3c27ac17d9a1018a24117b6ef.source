import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Store/services limiter. Delegates to the atomic database counter in
 * src/lib/rate-limit.ts, so concurrent requests cannot exceed the limit.
 * Throws StoreRateLimitExceededError when over the limit and a plain Error
 * (handlers answer 5xx, i.e. fail closed) when the counter is unreachable.
 */

export class StoreRateLimitExceededError extends Error {
  constructor(readonly retryAfter: number) {
    super("Rate limit exceeded.");
  }
}

export async function storeRateLimitConsume(scope: string, identity: string, limit: number, windowSeconds: number): Promise<void> {
  if (!/^[a-z0-9_-]{1,64}$/.test(scope) || identity === "" || limit < 1 || windowSeconds < 1 || windowSeconds > 86400) {
    throw new Error("Invalid rate limit configuration.");
  }
  const verdict = await consumeRateLimit(`store:${scope}`, identity, limit, windowSeconds);
  if (verdict === "unavailable") throw new Error("Rate limit storage unavailable.");
  if (verdict === "limited") throw new StoreRateLimitExceededError(windowSeconds);
}
