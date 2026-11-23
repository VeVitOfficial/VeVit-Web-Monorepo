import { json } from "@/lib/account-auth";
import { turnstileSiteKey } from "@/lib/turnstile";

export const runtime = "nodejs";

// Returns the public Turnstile site key so the login/register pages can render
// the widget only when CAPTCHA is actually configured. No secrets here.
export async function GET(): Promise<Response> {
  return json({ siteKey: turnstileSiteKey() || null });
}