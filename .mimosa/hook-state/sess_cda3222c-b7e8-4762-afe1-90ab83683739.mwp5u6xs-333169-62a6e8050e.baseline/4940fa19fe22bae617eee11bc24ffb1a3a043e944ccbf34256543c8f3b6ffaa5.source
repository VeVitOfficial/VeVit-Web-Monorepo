import { cookies } from "next/headers";
import { handleAccountRequest } from "@/lib/account-route";
import {
  ACCOUNT_LEGACY_SESSION_COOKIE,
  ACCOUNT_SESSION_COOKIE,
} from "@/lib/account-session";
import {
  checkRateLimit,
  clientIp,
  logActivity,
  recordAttempt,
  accountSupabase,
} from "@/lib/account-auth";
import {
  ReauthRequiredError,
  decryptTotpSecret,
  findUnusedRecoveryCode,
  lastVerifiedStepOf,
  requireTotpReauthentication,
  totpMethod,
  verifyTotpWindow,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/2fa/disable.php: re-authentication, then TOTP or
// recovery-code verification, then atomic disable_totp_2fa RPC (clears codes,
// method, flag and the user's other sessions besides the current one).

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const ip = clientIp(request);
    if (!(await checkRateLimit(ip, "totp_disable", 5, 10))) {
      return Response.json({ error: "Příliš mnoho pokusů. Zkuste to později." }, { status: 429 });
    }
    await recordAttempt(ip, "totp_disable");

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

    const method = await totpMethod(session.user.id);
    if (!method || !method.enabled_at) {
      return Response.json({ error: "2FA není aktivní." }, { status: 409 });
    }

    let secret = "";
    try {
      secret = decryptTotpSecret(String(method.secret_ciphertext));
    } catch {
      return Response.json({ error: "2FA není dostupné." }, { status: 503 });
    }

    const candidate = typeof body.code === "string" ? body.code : "";
    let valid = verifyTotpWindow(secret, candidate, lastVerifiedStepOf(method)) !== null;
    if (!valid) {
      valid = (await findUnusedRecoveryCode(session.user.id, candidate.trim().toUpperCase())) !== null;
    }
    if (!valid) {
      return Response.json({ error: "Ověřovací kód není platný." }, { status: 422 });
    }

    const store = await cookies();
    const currentToken = store.get(ACCOUNT_SESSION_COOKIE)?.value ?? store.get(ACCOUNT_LEGACY_SESSION_COOKIE)?.value ?? "";
    const { data, error } = await accountSupabase().rpc("disable_totp_2fa", {
      p_user_id: session.user.id,
      p_current_token: currentToken,
    });
    const ok = Array.isArray(data) ? data.length === 1 && data[0] === true : data === true;
    if (error || ok !== true) {
      return Response.json({ error: "2FA se nepodařilo vypnout." }, { status: 500 });
    }

    await logActivity(session.user.id, "twofa_disabled", "2FA vypnuto");
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}