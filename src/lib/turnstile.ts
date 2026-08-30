import "server-only";

/**
 * Cloudflare Turnstile verification, ported from the legacy `auth` Edge
 * Function's verifyTurnstile with one deliberate hardening: when the secret is
 * configured, a missing/empty/failed token is rejected (the old edge function
 * skipped verification whenever the token was absent, which made the widget
 * removable by editing the payload). When no secret is configured the check
 * is disabled and always passes, so the flow works before the keys are set.
 */
export async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || token === "") return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Verification service unreachable — fail open rather than lock everyone out.
    console.error("Turnstile verification request failed", error);
    return true;
  }
}

/** Public site key for the frontend widget (empty string when CAPTCHA is disabled). */
export function turnstileSiteKey(): string {
  return process.env.TURNSTILE_SITE_KEY?.trim() ?? "";
}