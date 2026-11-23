import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Per-IP (or per-user) limiter for tools, AI and e-mail endpoints. Atomic in the
 * database, so parallel requests cannot bypass it. Fail-closed semantics: those
 * callers send e-mail or AI requests with direct operating cost, so an
 * unavailable counter must disable the endpoint (available:false) rather than
 * open it.
 */
export async function toolsRateLimit(
  ip: string,
  namespace: string,
  windowSeconds: number,
  maximum: number,
): Promise<{ available: boolean; allowed: boolean }> {
  if (namespace === "" || ip === "" || ip === "unknown") return { available: false, allowed: false };
  const verdict = await consumeRateLimit(`tools:${namespace}`, ip, maximum, windowSeconds);
  if (verdict === "unavailable") return { available: false, allowed: false };
  return { available: true, allowed: verdict === "ok" };
}
