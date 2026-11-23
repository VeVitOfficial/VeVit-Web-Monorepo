import { randomBytes } from "node:crypto";
import {
  accountSupabase,
  createSession,
  createTotpLoginChallenge,
  localeRedirectTarget,
  logActivity,
  setSessionCookie,
  totpIsActive,
} from "@/lib/account-auth";
import {
  consumeAttempt,
  exchangeCode,
  oauthProviderAllowed,
  oauthProviderConfig,
  profileIsComplete,
  providerProfile,
  redirectResponse,
  redirectToLogin,
  requestLocale,
  type OAuthProfile,
  type OAuthProvider,
} from "@/lib/account-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/oauth/callback-common.php (google/github/discord
// callback.php). Three outcomes: link to the signed-in user (mode=connect),
// issue a 2FA re-auth challenge (mode=twofa_reauth), or log in / sign up.

type Context = { params: Promise<{ provider: string }> };

const TWOFA_ACTIONS = new Set(["setup", "regenerate", "disable"]);

function absolute(request: Request, path: string): string {
  return new URL(path, request.url).toString();
}

async function findIdentity(provider: OAuthProvider, providerUserId: string) {
  return accountSupabase()
    .from("oauth_identities")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .limit(1)
    .maybeSingle();
}

async function linkOrReauth(
  request: Request,
  provider: OAuthProvider,
  profile: OAuthProfile,
  initiatedUserId: string,
  destination: string,
): Promise<Response> {
  const { data: identity, error } = await findIdentity(provider, profile.id);
  if (error) return redirectToLogin(request, "oauth_profile_failed");
  // The provider account is already linked to someone else.
  if (identity && identity.user_id !== initiatedUserId) return redirectToLogin(request, "oauth_profile_failed");
  const lang = requestLocale(request);

  if (destination.startsWith("twofa_reauth:")) {
    if (!identity) return redirectToLogin(request, "oauth_profile_failed");
    const action = destination.slice("twofa_reauth:".length);
    if (!TWOFA_ACTIONS.has(action)) return redirectToLogin(request, "oauth_invalid_state");
    const reauthId = randomBytes(24).toString("hex");
    const { error: insertError } = await accountSupabase().from("auth_challenges").insert({
      id: reauthId,
      user_id: initiatedUserId,
      kind: "totp_setup",
      payload: { purpose: "oauth_reauth", action },
      expires_at: new Date(Date.now() + 300_000).toISOString(),
    });
    if (insertError) return redirectToLogin(request, "oauth_profile_failed");
    const target = `${localeRedirectTarget("/account/security", lang)}?twofa_reauth=${encodeURIComponent(reauthId)}&twofa_action=${encodeURIComponent(action)}`;
    return redirectResponse(absolute(request, target), lang);
  }

  if (!identity) {
    const { error: linkError } = await accountSupabase().from("oauth_identities").insert({
      user_id: initiatedUserId,
      provider,
      provider_user_id: profile.id,
      provider_email: profile.email,
    });
    if (linkError) return redirectToLogin(request, "oauth_profile_failed");
    await logActivity(initiatedUserId, "oauth_connect", `OAuth ${provider}`);
  }
  return redirectResponse(absolute(request, localeRedirectTarget("/account/connections", lang)), lang);
}

async function loginOrSignup(request: Request, provider: OAuthProvider, profile: OAuthProfile): Promise<Response> {
  const sb = accountSupabase();
  const { data: identity, error } = await findIdentity(provider, profile.id);
  if (error) return redirectToLogin(request, "oauth_profile_failed");
  let userId = typeof identity?.user_id === "string" && identity.user_id !== "" ? identity.user_id : null;

  if (userId === null) {
    // Never auto-link by e-mail: an existing account must connect the provider
    // from its settings, otherwise a provider account could take it over.
    const { data: existing, error: existingError } = await sb
      .from("users").select("id").eq("email", profile.email).limit(1).maybeSingle();
    if (existingError) return redirectToLogin(request, "oauth_profile_failed");
    if (existing) return redirectToLogin(request, "account_already_exists");

    const { data: createdId, error: createError } = await sb.rpc("create_oauth_user_and_identity", {
      p_user_id: randomBytes(16).toString("hex"),
      p_email: profile.email,
      p_full_name: profile.name,
      p_avatar_url: profile.avatarUrl,
      p_provider: provider,
      p_provider_user_id: profile.id,
      p_provider_email: profile.email,
    });
    const id = Array.isArray(createdId) ? createdId[0] : createdId;
    if (createError || typeof id !== "string" || id === "") return redirectToLogin(request, "oauth_profile_failed");
    userId = id;
  }

  const { data: user } = await sb
    .from("users").select("id,email,full_name,nickname,language,status").eq("id", userId).limit(1).maybeSingle();
  if (!user || (user.status && user.status !== "active")) return redirectToLogin(request, "oauth_profile_failed");
  const lang = typeof user.language === "string" ? user.language : "cs";
  const destination = profileIsComplete(user) ? "/account" : "/onboarding";

  if (await totpIsActive(userId)) {
    const challenge = await createTotpLoginChallenge(userId, false, destination);
    if (challenge === null) return redirectToLogin(request, "oauth_profile_failed");
    const target = `${localeRedirectTarget("/account/verify-2fa.php", lang)}?challenge=${encodeURIComponent(challenge)}`;
    return redirectResponse(absolute(request, target), lang);
  }

  const session = await createSession(request, userId, false);
  if (session === null) return redirectToLogin(request, "oauth_profile_failed");
  await logActivity(userId, "login", `OAuth ${provider}`);

  const response = redirectResponse(absolute(request, localeRedirectTarget(destination, lang)), lang);
  setSessionCookie(response, session.token, false);
  return response;
}

export async function GET(request: Request, context: Context): Promise<Response> {
  const provider = (await context.params).provider;
  if (!oauthProviderAllowed(provider)) return redirectToLogin(request, "oauth_configuration_error");
  const cfg = oauthProviderConfig(provider);
  if (cfg === null) return redirectToLogin(request, "oauth_configuration_error");

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state") ?? "";
    if (url.searchParams.has("error")) {
      if (state) await consumeAttempt(state);
      return redirectToLogin(request, "oauth_cancelled");
    }
    const code = url.searchParams.get("code") ?? "";
    if (code === "" || code.length > 4096) return redirectToLogin(request, "oauth_invalid_state");

    const attempt = await consumeAttempt(state);
    if (!attempt || attempt.provider !== provider || !attempt.code_verifier) {
      return redirectToLogin(request, "oauth_invalid_state");
    }

    const accessToken = await exchangeCode(provider, cfg, code, attempt.code_verifier);
    if (accessToken === null) return redirectToLogin(request, "oauth_exchange_failed");
    const profile = await providerProfile(provider, accessToken);
    if (profile === null) return redirectToLogin(request, "oauth_email_unverified");

    if (attempt.initiated_user_id) {
      return await linkOrReauth(request, provider, profile, attempt.initiated_user_id, attempt.destination ?? "");
    }
    return await loginOrSignup(request, provider, profile);
  } catch (error) {
    console.error("OAuth callback failed", { provider, error: error instanceof Error ? error.message : "unknown" });
    return redirectToLogin(request, "oauth_profile_failed");
  }
}
