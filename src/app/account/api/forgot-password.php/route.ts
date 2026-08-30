import { createHash, randomBytes } from "node:crypto";
import { AccountBackendUnavailableError } from "@/lib/account-session";
import { accountSupabase, antiBotPassed, checkRateLimit, clientIp, recordAttempt } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of account/api/forgot-password.php.
 *
 * Semantics that must not change: a request for an address that does not
 * exist is indistinguishable from one that does — both get the same generic
 * response and the same cost. Delivery goes through Resend (HTTP API, no
 * dependency); without RESEND_API_KEY configured the endpoint still returns
 * ok:true but logs the send failure instead of silently pretending mail works.
 *
 * NOT yet ported from the PHP version: per-identifier progressive backoff
 * (identifier-backoff.php) — it needs the `login_attempts.identifier_hash`
 * column (repo migration 013), which is not applied to production yet.
 */

function jsonErr(error: string, status: number, field?: string): Response {
  return Response.json({ error, ...(field ? { field } : {}) }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Reconstruct the site origin the request came in on (APP_URL equivalent). */
function appOrigin(request: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) return `${proto}://${host}`;
  return "https://www.vevit.cz";
}

function emailTemplate(fullName: unknown, link: string): { subject: string; text: string } {
  const name = typeof fullName === "string" && fullName !== "" ? fullName : "uživateli";
  return {
    subject: "Obnova hesla · vevit",
    text:
      `Dobrý den, ${name},\n\n` +
      `Pro obnovu hesla klikněte na odkaz níže (platný 1 hodinu):\n` +
      `${link}\n\n` +
      `Pokud jste o obnovu hesla nežádali, tento e-mail ignorujte.\n\n` +
      `— Tým vevit`,
  };
}

async function sendResetEmail(to: string, fullName: unknown, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[forgot-password] RESEND_API_KEY is not configured — reset e-mail NOT sent");
    return;
  }
  const { subject, text } = emailTemplate(fullName, link);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.MAIL_FROM?.trim() || "vevit <noreply@vevit.cz>",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) console.error("[forgot-password] Resend delivery failed", res.status);
  } catch (error) {
    console.error("[forgot-password] Resend request failed", error);
  }
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!(await checkRateLimit(ip, "forgot_password", 3, 60))) {
      await recordAttempt(ip, "forgot_password");
      return jsonErr("Příliš mnoho pokusů. Zkuste to za hodinu.", 429);
    }
    await recordAttempt(ip, "forgot_password");

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    // Honeypot + timing gate: on failure reuse the rate-limit message so a bot
    // cannot tell "detected" apart from "throttled" (hpRequireAntiBotPassed).
    if (!antiBotPassed(body)) {
      return jsonErr("Příliš mnoho pokusů. Zkuste to za chvíli.", 429);
    }

    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } }); // don't reveal validation errors
    }

    const { data: user, error } = await accountSupabase()
      .from("users")
      .select("id,email,full_name")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (error) throw new AccountBackendUnavailableError("User lookup failed");

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 3600_000).toISOString();

      const { error: updateError } = await accountSupabase()
        .from("users")
        .update({ reset_token_hash: tokenHash, reset_token_expires_at: expires })
        .eq("id", user.id);
      if (updateError) throw updateError;

      const link = `${appOrigin(request)}/account/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendResetEmail(
        String(user.email ?? email),
        (user as Record<string, unknown>).full_name,
        link,
      );
    }

    // Always return success — never reveal whether the email exists.
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return Response.json({ error: "Service temporarily unavailable", code: "ACCOUNT_BACKEND_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Account route failed", { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "Chyba serveru." }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}