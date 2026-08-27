import {
  AccountBackendUnavailableError,
  checkRateLimit,
  clientIp,
  json,
  recordAttempt,
} from "@/lib/account-auth";
import { completeTotpSession } from "@/lib/account-auth";
import {
  consumeRecoveryLogin,
  findUnusedRecoveryCode,
  loadTotpChallenge,
  record2faFailure,
  totpChallengeId,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recovery-code login-verify endpoint, migrated off the legacy Supabase `auth`
// Edge Function. Ports account/api/2fa/recovery-verify.php: IP rate limit,
// challenge load (same login_totp kind), recovery-code bcrypt match, atomic
// consume via the consume_recovery_login RPC, then session creation + redirect.

const RATE_LIMIT_MESSAGE = "Příliš mnoho pokusů. Zkuste to později.";

async function verify(request: Request): Promise<Response> {
  const ip = clientIp(request);

  const allowed = await checkRateLimit(ip, "totp_recovery", 8, 10);
  await recordAttempt(ip, "totp_recovery");
  if (!allowed) return json({ success: false, error: RATE_LIMIT_MESSAGE }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const id = totpChallengeId(body.challenge);
  if (!id) return json({ success: false, error: "Ověření vypršelo." }, 410);
  const challenge = await loadTotpChallenge(id, "login_totp");
  if (!challenge) return json({ success: false, error: "Ověření vypršelo." }, 410);

  const rawCode = typeof body.code === "string" ? body.code : "";
  const candidate = rawCode.trim().toUpperCase();
  const codeId = await findUnusedRecoveryCode(challenge.user_id, candidate);
  if (codeId === null) {
    await record2faFailure(id);
    return json({ success: false, error: "Obnovovací kód není platný." }, 422);
  }

  const consumed = await consumeRecoveryLogin(id, codeId);
  if (!consumed) return json({ success: false, error: "Ověření již není platné." }, 409);
  return completeTotpSession(request, consumed);
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await verify(request);
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return json({ success: false, error: "Service temporarily unavailable" }, 503);
    }
    console.error("2FA recovery-verify endpoint failed", error);
    return json({ success: false, error: "Chyba serveru." }, 500);
  }
}

export async function GET(): Promise<Response> {
  return json({ success: false, error: "Method not allowed" }, 405, { Allow: "POST" });
}