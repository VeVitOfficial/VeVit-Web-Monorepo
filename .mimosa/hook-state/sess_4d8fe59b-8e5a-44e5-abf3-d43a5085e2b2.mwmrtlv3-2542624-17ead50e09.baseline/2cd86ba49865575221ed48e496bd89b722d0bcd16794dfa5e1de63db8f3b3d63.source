import { createHash } from "node:crypto";

// Pure parts of the rate limiter (no server-only / no database), unit-testable under node:test.

export type RateVerdict = "ok" | "limited" | "unavailable";

const SCOPE_RE = /^[a-z0-9_:-]{1,64}$/;

export function rateLimitKey(scope: string, identity: string): string {
  return createHash("sha256").update(`rl|${scope}\0${identity}`).digest("hex");
}

/** False for anything that must not reach the database (bad scope, empty identity, non-integer or absurd limits). */
export function rateLimitArgsValid(scope: string, identity: string, limit: number, windowSeconds: number): boolean {
  return SCOPE_RE.test(scope) && identity !== "" && Number.isInteger(limit) && limit >= 1 && windowSeconds >= 1 && windowSeconds <= 86400;
}
