import { randomBytes } from "node:crypto";
import { handleAccountRequest } from "@/lib/account-route";
import {
  checkRateLimit,
  clientIp,
  totpIsActive,
  accountSupabase,
  logActivity,
  recordAttempt,
} from "@/lib/account-auth";
import {
  ReauthRequiredError,
  encryptTotpSecret,
  generateTotpSecret,
  requireTotpReauthentication,
  totpMethod,
  totpProvisioningUri,
  totpQrDataUri,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/2fa/setup-start.php: re-authentication check, fresh
// encrypted TOTP secret + one-time totp_setup challenge, provisioning URI and
// QR for the authenticator app.

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const ip = clientIp(request);
    if (!(await checkRateLimit(ip, "totp_setup", 5, 10))) {
      return Response.json({ error: "Příliš mnoho pokusů. Zkuste to později." }, { status: 429 });
    }
    await recordAttempt(ip, "totp_setup");

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    try {
      await requireTotpReauthentication(session.user.id, body);
    } catch (error) {
      if (error instanceof ReauthRequiredError) {
        return Response.json({ error: error.message }, { status: 401 });
      }
      throw error;
    }

    if (await totpIsActive(session.user.id)) {
      return Response.json({ error: "Dvoufázové ověření je již aktivní." }, { status: 409 });
    }

    let secret = "";
    let cipher = "";
    try {
      secret = generateTotpSecret();
      cipher = encryptTotpSecret(secret);
    } catch {
      return Response.json({ error: "2FA není na serveru správně nakonfigurováno." }, { status: 503 });
    }

    const row = { secret_ciphertext: cipher, enabled_at: null, last_verified_step: null, updated_at: isoNow() };
    const existing = await totpMethod(session.user.id);
    const saveError = existing
      ? (await accountSupabase().from("user_totp_methods").update(row).eq("user_id", session.user.id)).error
      : (await accountSupabase().from("user_totp_methods").insert({ user_id: session.user.id, ...row })).error;
    if (saveError) return Response.json({ error: "Nastavení 2FA se nepodařilo uložit." }, { status: 500 });

    const id = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 600_000).toISOString().replace(/\.\d{3}Z$/, "Z");
    const { error: challengeError } = await accountSupabase()
      .from("auth_challenges")
      .insert({ id, user_id: session.user.id, kind: "totp_setup", payload: {}, expires_at: expiresAt });
    if (challengeError) return Response.json({ error: "Nastavení 2FA se nepodařilo zahájit." }, { status: 500 });

    const label = String(session.user.email ?? session.user.nickname ?? "uzivatel");
    const uri = totpProvisioningUri(secret, label);
    const qr = await totpQrDataUri(uri);

    await logActivity(session.user.id, "twofa_setup", "2FA setup zahájen");
    return Response.json(
      { challenge: id, secret, otpauth_uri: uri, qr_code: qr, issuer: "VEVIT" },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}