import { NextResponse } from "next/server";
import {
  AccountBackendUnavailableError,
  accountSupabase,
  antiBotPassed,
  checkRateLimit,
  classifyIdentifier,
  clientIp,
  createSession,
  createTotpLoginChallenge,
  findUserForLogin,
  isProviderOnlyAccount,
  json,
  localeRedirectTarget,
  recordAttempt,
  safeReturnTo,
  safeUser,
  setLocaleCookie,
  setSessionCookie,
  totpIsActive,
  verifyPassword,
} from "@/lib/account-auth";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Login endpoint, migrated off the legacy Supabase `auth` Edge Function to a
// Next.js route so it shares the `sessions` + `__Host-vvsession` model that
// /account/api/me.php (src/lib/account-session.ts) already authenticates with.
// Ports account/api/login.php faithfully: identifier (email/phone/nickname),
// honeypot+timing anti-bot, IP rate limit, bcrypt verify with timing
// equalization, TOTP 2FA challenge, server-side session, locale redirect.

const RATE_LIMIT_MESSAGE = "Příliš mnoho pokusů. Zkuste to za chvíli.";

async function login(request: Request): Promise<Response> {
  const ip = clientIp(request);

  // IP rate limit — checked before parsing the body, matching login.php.
  const allowed = await checkRateLimit(ip, "login", 10, 15);
  await recordAttempt(ip, "login");
  if (!allowed) return json({ success: false, error: RATE_LIMIT_MESSAGE }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // Honeypot + timing gate. Reuses the rate-limit response so a bot cannot
  // distinguish "detected" from "throttled".
  if (!antiBotPassed(body)) return json({ success: false, error: RATE_LIMIT_MESSAGE }, 429);

  // Cloudflare Turnstile — enforced only while TURNSTILE_SECRET is configured.
  if (!(await verifyTurnstile(body.cf_turnstile, ip))) {
    return json({ success: false, error: "CAPTCHA ověření selhalo." }, 400);
  }

  const usesUnifiedIdentifier = "identifier" in body;
  const rawIdentifier = typeof body.identifier === "string"
    ? body.identifier
    : typeof body.email === "string"
      ? body.email
      : "";
  const identifier = classifyIdentifier(rawIdentifier);

  const password = typeof body.password === "string" ? body.password : "";
  const remember = body.remember ?? false;
  if (typeof remember !== "boolean") {
    return json({ success: false, error: "Neplatná volba zapamatování." }, 400);
  }

  if (identifier === null || password === "") {
    return json(
      { success: false, error: usesUnifiedIdentifier ? "Neplatné přihlašovací údaje." : "Vyplňte e-mail a heslo." },
      usesUnifiedIdentifier ? 401 : 400,
    );
  }

  const user = await findUserForLogin(identifier);

  // Phone login requires a verified phone; still run bcrypt to avoid an
  // enumeration oracle, then fail.
  if (
    identifier.kind === "phone"
    && (!user || typeof user.phone_verified_at !== "string" || user.phone_verified_at === "")
  ) {
    await verifyPassword(user, password);
    return json({ success: false, error: "Neplatné přihlašovací údaje." }, 401);
  }

  if (isProviderOnlyAccount(user) || !(await verifyPassword(user, password))) {
    return json({ success: false, error: "Neplatné přihlašovací údaje." }, 401);
  }

  // verifyPassword only returns true for a real, non-empty user.id, so reaching
  // here means the lookup found an account. Guard keeps the type checker honest.
  if (!user) {
    return json({ success: false, error: "Neplatné přihlašovací údaje." }, 401);
  }

  const userId = user.id as string;
  if (user.status && user.status !== "active") {
    return json({ success: false, error: "Neplatné přihlašovací údaje." }, 401);
  }

  // TOTP 2FA: create a challenge and redirect to the verify page; no session yet.
  if (await totpIsActive(userId)) {
    const challenge = await createTotpLoginChallenge(userId, remember, "/account");
    if (challenge === null) {
      return json({ success: false, error: "Dvoufázové ověření se nepodařilo zahájit." }, 500);
    }
    const redirect = `${localeRedirectTarget("/account/verify-2fa.php", resolveRequestLocale(request))}?challenge=${encodeURIComponent(challenge)}`;
    return json({ success: true, requires_2fa: true, redirect });
  }

  const session = await createSession(request, userId, remember);
  if (session === null) {
    return json({ success: false, error: "Chyba serveru." }, 500);
  }

  // Load the profile with safe columns for the response.
  const { data: profile, error } = await accountSupabase()
    .from("users")
    .select("id,email,nickname,full_name,tier,tier_expires,role,avatar_url,level,xp,language,two_factor_enabled")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !profile || (profile as Record<string, unknown>).id !== userId) {
    return json({ success: false, error: "Chyba serveru." }, 500);
  }

  const lang = (profile as Record<string, unknown>).language ?? "cs";
  const returnTo = safeReturnTo(body.return_to, "/account");
  const redirect = localeRedirectTarget(returnTo, lang);

  const response = NextResponse.json(
    { success: true, user: safeUser(profile as Record<string, unknown>), redirect },
    { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=UTF-8" } },
  );
  setSessionCookie(response, session.token, remember);
  setLocaleCookie(response, String(lang));
  return response;
}

function resolveRequestLocale(request: Request): string {
  const url = new URL(request.url);
  const m = url.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  if (m && ["cs", "en", "de", "es", "uk", "fr", "sk"].includes(m[1])) return m[1];
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|; )vevit-lang=([a-z]{2})/);
  if (match && ["cs", "en", "de", "es", "uk", "fr", "sk"].includes(match[1])) return match[1];
  return "cs";
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await login(request);
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return json({ success: false, error: "Service temporarily unavailable" }, 503);
    }
    console.error("Login endpoint failed", error);
    return json({ success: false, error: "Chyba serveru." }, 500);
  }
}

export async function GET(): Promise<Response> {
  return json({ success: false, error: "Method not allowed" }, 405, { Allow: "POST" });
}