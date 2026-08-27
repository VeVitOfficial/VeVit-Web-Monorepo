import {
  AccountBackendUnavailableError,
  checkRateLimit,
  clientIp,
  json,
  recordAttempt,
} from "@/lib/account-auth";
import { completeTotpSession } from "@/lib/account-auth";
import {
  consumeTotpLogin,
  decryptTotpSecret,
  lastVerifiedStepOf,
  loadTotpChallenge,
  record2faFailure,
  totpChallengeId,
  totpMethod,
  verifyTotpWindow,
} from "@/lib/account-totp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TOTP login-verify endpoint, migrated off the legacy Supabase `auth` Edge
// Function to a Next.js route so 2FA logins land in the same sessions +
// __Host-vvsession model as login.php / me.php. Ports
// account/api/2fa/login-verify.php faithfully: IP rate limit, challenge load,
// TOTP code verify with ±1 window + last-step replay guard, atomic consume
// via the consume_totp_login RPC, then session creation + redirect.

const RATE_LIMIT_MESSAGE = "Příliš mnoho pokusů. Zkuste to později.";

async function verify(request: Request): Promise<Response> {
  const ip = clientIp(request);

  const allowed = await checkRateLimit(ip, "totp_login", 10, 10);
  await recordAttempt(ip, "totp_login");
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

  const userId = challenge.user_id;
  const method = await totpMethod(userId);
  let secret: string;
  try {
    secret = decryptTotpSecret(String(method?.secret_ciphertext ?? ""));
  } catch {
    return json({ success: false, error: "2FA není dostupné." }, 503);
  }

  const code = typeof body.code === "string" ? body.code : "";
  const step = verifyTotpWindow(secret, code, lastVerifiedStepOf(method));
  if (step === null) {
    await record2faFailure(id);
    return json({ success: false, error: "Ověřovací kód není platný." }, 422);
  }

  const consumed = await consumeTotpLogin(id, step);
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
    console.error("2FA login-verify endpoint failed", error);
    return json({ success: false, error: "Chyba serveru." }, 500);
  }
}

export async function GET(): Promise<Response> {
  return json({ success: false, error: "Method not allowed" }, 405, { Allow: "POST" });
}