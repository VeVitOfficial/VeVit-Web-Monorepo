import { handleAccountRequest } from "@/lib/account-route";
import {
  checkRateLimit,
  clientIp,
  recordAttempt,
  accountSupabase,
  logActivity,
} from "@/lib/account-auth";
import {
  ReauthRequiredError,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCodes,
  lastVerifiedStepOf,
  requireTotpReauthentication,
  totpMethod,
  verifyTotpWindow,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/2fa/recovery-regenerate.php: TOTP code verification,
// replace the 10 recovery codes via the replace_recovery_codes RPC.

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const ip = clientIp(request);
    if (!(await checkRateLimit(ip, "totp_regenerate", 5, 10))) {
      return Response.json({ error: "Příliš mnoho pokusů. Zkuste to později." }, { status: 429 });
    }
    await recordAttempt(ip, "totp_regenerate");

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

    const step = verifyTotpWindow(
      secret,
      typeof body.code === "string" ? body.code : "",
      lastVerifiedStepOf(method),
    );
    if (step === null) {
      return Response.json({ error: "Ověřovací kód není platný." }, { status: 422 });
    }

    await accountSupabase()
      .from("user_totp_methods")
      .update({ last_verified_step: step, updated_at: isoNow() })
      .eq("user_id", session.user.id);

    const codes = generateRecoveryCodes();
    const hashes = await hashRecoveryCodes(codes);
    const { data, error } = await accountSupabase().rpc("replace_recovery_codes", {
      p_user_id: session.user.id,
      p_hashes: hashes,
    });
    const n = Array.isArray(data) ? Number(data[0]) : Number(data);
    if (error || n !== 10) {
      return Response.json({ error: "Kódy se nepodařilo obnovit." }, { status: 500 });
    }

    await logActivity(session.user.id, "recovery_regenerated", "Recovery kódy obnoveny");
    return Response.json(
      { recovery_codes: codes },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}