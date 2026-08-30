import { accountSupabase } from "@/lib/account-auth";

/**
 * Port of tools/includes/request-rate-limit.php onto Supabase. The legacy PHP
 * limiter used a temp-dir file, which does not exist on Vercel's ephemeral
 * filesystem — attempts are counted in `login_attempts` (same place the account
 * limiter stores them), keyed by IP + namespace.
 *
 * Fail-closed semantics preserved: the tools callers send e-mail or AI requests
 * with direct operating cost, so an unavailable limiter storage must disable
 * the endpoint (available:false) rather than open it.
 */

function isoFromMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export async function toolsRateLimit(
  ip: string,
  namespace: string,
  windowSeconds: number,
  maximum: number,
): Promise<{ available: boolean; allowed: boolean }> {
  if (namespace === "" || ip === "" || ip === "unknown" || windowSeconds < 1 || maximum < 1) {
    return { available: false, allowed: false };
  }
  const { count, error } = await accountSupabase()
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("action", namespace)
    .gt("attempt_time", isoFromMs(-windowSeconds * 1000));
  if (error) return { available: false, allowed: false };
  if ((count ?? 0) >= maximum) return { available: true, allowed: false };
  const { error: insertError } = await accountSupabase()
    .from("login_attempts")
    .insert({ ip_address: ip, action: namespace });
  if (insertError) return { available: false, allowed: false };
  return { available: true, allowed: true };
}