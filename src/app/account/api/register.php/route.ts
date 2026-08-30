import { NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  AccountBackendUnavailableError,
  accountSupabase,
  antiBotPassed,
  checkRateLimit,
  clientIp,
  createSession,
  json,
  logActivity,
  recordAttempt,
  registerNormalizeNickname,
  registerNicknameLookupKey,
  registerNicknameIsValid,
  registerPasswordError,
  setSessionCookie,
} from "@/lib/account-auth";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Registration endpoint, migrated off the legacy Supabase `auth` Edge Function
// to a Next.js route sharing the `sessions` + `__Host-vvsession` model. Ports
// account/api/register.php faithfully: IP rate limit, honeypot+timing anti-bot,
// validation, bcrypt hash, duplicate handling via the 23505 Unique violation,
// session creation with cookie, activity log, safe user payload.

const RATE_LIMIT_MESSAGE = "Příliš mnoho pokusů. Zkuste to za chvíli.";

// hash_equals equivalent: constant-time byte comparison (false on length mismatch).
function hashesEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(request: Request): Promise<Response> {
  const ip = clientIp(request);

  // IP rate limit — checked before parsing the body, matching register.php.
  const allowed = await checkRateLimit(ip, "register", 5, 60);
  await recordAttempt(ip, "register");
  if (!allowed) return json({ error: RATE_LIMIT_MESSAGE }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // Honeypot + timing gate. Reuses the rate-limit response so a bot cannot
  // distinguish "detected" from "throttled".
  if (!antiBotPassed(body)) return json({ error: RATE_LIMIT_MESSAGE }, 429);

  // Cloudflare Turnstile — enforced only while TURNSTILE_SECRET is configured.
  if (!(await verifyTurnstile(body.cf_turnstile, ip))) {
    return json({ error: "CAPTCHA ověření selhalo." }, 400);
  }

  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const nickname = registerNormalizeNickname(typeof body.nickname === "string" ? body.nickname : "");
  const fullName = (typeof body.full_name === "string" ? body.full_name : "").trim();
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirm = typeof body.password_confirmation === "string" ? body.password_confirmation : "";

  // Validation — error shape matches the PHP jsonErr(msg, code, field).
  if (!EMAIL_RE.test(email)) return json({ error: "Neplatný formát e-mailu.", field: "email" }, 422);
  if (nickname === null || !registerNicknameIsValid(nickname)) {
    return json({ error: "Přezdívka musí mít 2–30 povolených znaků.", field: "nickname" }, 422);
  }
  const nicknameNormalized = registerNicknameLookupKey(nickname);
  if (nicknameNormalized === null) {
    return json({ error: "Server nepodporuje bezpečné zpracování přezdívky.", field: "nickname" }, 503);
  }
  if (Buffer.byteLength(fullName, "utf8") < 2) {
    return json({ error: "Jméno je příliš krátké.", field: "full_name" }, 422);
  }
  const passwordError = registerPasswordError(password);
  if (passwordError !== null) return json({ error: passwordError, field: "password" }, 422);
  if (!hashesEqual(password, passwordConfirm)) {
    return json({ error: "Hesla se neshodují.", field: "password_confirmation" }, 422);
  }

  const id = randomBytes(16).toString("hex");
  const hash = await bcrypt.hash(password, 10);

  const { error: insertError } = await accountSupabase().from("users").insert({
    id,
    email,
    nickname: nickname ?? "",
    nickname_normalized: nicknameNormalized,
    full_name: fullName,
    password: hash,
    tier: "free",
    role: "User",
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      const detail = (insertError.message ?? "").toLowerCase();
      if (detail.includes("email")) return json({ error: "E-mail je již registrován.", field: "email" }, 409);
      if (detail.includes("nickname")) return json({ error: "Přezdívka je již obsazena.", field: "nickname" }, 409);
      return json({ error: "Účet s tímto e-mailem nebo přezdívkou již existuje." }, 409);
    }
    if (insertError.code === "23502") return json({ error: "Registrace selhala." }, 500);
    console.error("Register insert failed", insertError);
    return json({ error: "Registrace selhala." }, 500);
  }

  const session = await createSession(request, id, false);
  if (session === null) return json({ error: "Chyba serveru." }, 500);

  await logActivity(id, "login", `Registrace z IP: ${ip}`);

  const { data: profile, error: profileError } = await accountSupabase()
    .from("users")
    .select("id,email,nickname,full_name,tier,role,avatar_url,level,xp,language")
    .eq("id", id)
    .limit(1)
    .maybeSingle();
  if (profileError || !profile || (profile as Record<string, unknown>).id !== id) {
    return json({ error: "Chyba serveru." }, 500);
  }

  const response = NextResponse.json(
    { user: profile },
    { status: 201, headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=UTF-8" } },
  );
  setSessionCookie(response, session.token, false);
  return response;
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await register(request);
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return json({ error: "Service temporarily unavailable" }, 503);
    }
    console.error("Register endpoint failed", error);
    return json({ error: "Chyba serveru." }, 500);
  }
}

export async function GET(): Promise<Response> {
  return json({ error: "Method not allowed" }, 405, { Allow: "POST" });
}