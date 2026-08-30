import { handleAccountRequest } from "@/lib/account-route";
import {
  checkRateLimit,
  clientIp,
  recordAttempt,
  accountSupabase,
  logActivity,
} from "@/lib/account-auth";
import {
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  loadTotpChallenge,
  record2faFailure,
  totpChallengeId,
  totpMethod,
  verifyTotpWindow,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/2fa/setup-confirm.php: verify the authenticator code
// against the pending totp_setup challenge, generate 10 recovery codes and
// commit with the confirm_totp_setup atomic RPC.

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const ip = clientIp(request);
    if (!(await checkRateLimit(ip, "totp_confirm", 8, 10))) {
      return Response.json({ error: "Příliš mnoho pokusů. Zkuste to později." }, { status: 429 });
    }
    await recordAttempt(ip, "totp_confirm");

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const id = totpChallengeId(body.challenge);
    const code = typeof body.code === "string" ? body.code : "";

    const challenge = id ? await loadTotpChallenge(id, "totp_setup") : null;
    if (!challenge || challenge.user_id !== session.user.id) {
      return Response.json({ error: "Nastavení vypršelo." }, { status: 410 });
    }

    const method = await totpMethod(session.user.id);
    let secret = "";
    try {
      secret = decryptTotpSecret(String(method?.secret_ciphertext ?? ""));
    } catch {
      return Response.json({ error: "2FA není dostupné." }, { status: 503 });
    }

    const step = verifyTotpWindow(secret, code, null);
    if (step === null) {
      if (id) await record2faFailure(id);
      await logActivity(session.user.id, "twofa_failed", "Neúspěšné nastavení 2FA");
      return Response.json({ error: "Ověřovací kód není platný." }, { status: 422 });
    }

    const codes = generateRecoveryCodes();
    const hashes = await hashRecoveryCodes(codes);
    const { data, error } = await accountSupabase().rpc("confirm_totp_setup", {
      p_challenge_id: id,
      p_user_id: session.user.id,
      p_step: step,
      p_hashes: hashes,
    });
    const ok = Array.isArray(data) ? data.length === 1 && data[0] === true : data === true;
    if (error || ok !== true) {
      return Response.json({ error: "Nastavení se nepodařilo dokončit." }, { status: 409 });
    }

    await logActivity(session.user.id, "twofa_enabled", "2FA zapnuto");
    return Response.json(
      { recovery_codes: codes },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}