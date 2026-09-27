import "server-only";

/** Actions the frontend widgets render with; siteverify must echo the same one. */
export type TurnstileAction = "login" | "register" | "skoly_interest";

/**
 * Cloudflare Turnstile verification. When TURNSTILE_SECRET is configured, the
 * token must be present, siteverify must succeed, and the returned action and
 * hostname must match what this surface expects (TURNSTILE_HOSTNAMES, comma
 * separated — never include localhost in production). Siteverify outages and
 * a missing hostname allowlist fail closed. When no secret is configured the
 * check is disabled and always passes, so the flow works before keys are set.
 */
export async function verifyTurnstile(token: unknown, ip: string, expectedAction: TurnstileAction): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  if (!secret) return true;

  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (expectedHostnames.size === 0) {
    console.error("Turnstile: TURNSTILE_HOSTNAMES is not configured");
    return false;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  let result: { success?: boolean; action?: string; hostname?: string; "error-codes"?: string[] };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
    });
    if (!res.ok) throw new Error(`siteverify ${res.status}`);
    result = (await res.json()) as typeof result;
  } catch (error) {
    console.error("Turnstile verification request failed", error);
    return false;
  }

  if (
    result.success !== true
    || result.action !== expectedAction
    || typeof result.hostname !== "string"
    || !expectedHostnames.has(result.hostname)
  ) {
    // Error codes only (no token/secret) — "invalid-input-secret" means the
    // Vercel env doesn't match the widget.
    console.warn("Turnstile rejected", {
      errors: result["error-codes"],
      action: result.action,
      hostname: result.hostname,
    });
    return false;
  }
  return true;
}

/** Public site key for the frontend widget (empty string when CAPTCHA is disabled). */
export function turnstileSiteKey(): string {
  return process.env.TURNSTILE_SITE_KEY?.trim() ?? "";
}
