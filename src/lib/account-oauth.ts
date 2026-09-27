import "server-only";

import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { accountSupabase, localeRedirectTarget, setLocaleCookie } from "@/lib/account-auth";

// Port of account/lib/oauth.php. Google, GitHub and Discord authorization-code
// flow with PKCE; state lives hashed in `oauth_attempts` and is consumed
// atomically by the `consume_oauth_attempt` RPC.

export const OAUTH_PROVIDERS = ["google", "github", "discord"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const OAUTH_STATE_TTL_SECONDS = 600;

const ERROR_CODES = new Set([
  "oauth_cancelled", "oauth_invalid_state", "oauth_exchange_failed",
  "oauth_profile_failed", "oauth_email_missing", "oauth_email_unverified",
  "account_already_exists", "oauth_configuration_error",
]);

export function oauthProviderAllowed(provider: string): provider is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(provider);
}

export function base64url(bytes: Buffer): string {
  return bytes.toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes: number): string {
  return base64url(randomBytes(bytes));
}

/**
 * Public base of the account API, e.g. https://www.vevit.cz/account. The
 * provider consoles must list `<base>/api/oauth/<provider>/callback.php`.
 */
function appBaseUrl(): string {
  return (process.env.APP_BASE_URL?.trim() || "https://www.vevit.cz/account").replace(/\/+$/, "");
}

export function oauthCallbackUrl(provider: OAuthProvider): string {
  return `${appBaseUrl()}/api/oauth/${provider}/callback.php`;
}

type ProviderConfig = { clientId: string; clientSecret: string; callback: string };

export function oauthProviderConfig(provider: OAuthProvider): ProviderConfig | null {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, callback: oauthCallbackUrl(provider) };
}

export function requestLocale(request: Request): string {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|; )vevit-lang=([a-z]{2})/);
  return match?.[1] ?? "cs";
}

export function redirectResponse(location: string, lang?: string): NextResponse {
  const response = new NextResponse(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
  if (lang) setLocaleCookie(response, lang);
  return response;
}

/** 302 to the login page with a whitelisted ?error= code (port of oauth_redirect_to_login). */
export function redirectToLogin(request: Request, error: string): NextResponse {
  const lang = requestLocale(request);
  const code = ERROR_CODES.has(error) ? error : "oauth_failed";
  const target = `${localeRedirectTarget("/account/login", lang)}?error=${encodeURIComponent(code)}`;
  return redirectResponse(new URL(target, request.url).toString(), lang);
}

export function authorizationUrl(provider: OAuthProvider, cfg: ProviderConfig, state: string, challenge: string): string {
  const common = {
    client_id: cfg.clientId,
    redirect_uri: cfg.callback,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  };
  const [base, params] = provider === "google"
    ? ["https://accounts.google.com/o/oauth2/v2/auth", { ...common, response_type: "code", scope: "openid email profile", prompt: "select_account" }]
    : provider === "github"
      ? ["https://github.com/login/oauth/authorize", { ...common, scope: "read:user user:email" }]
      : ["https://discord.com/oauth2/authorize", { ...common, response_type: "code", scope: "identify email" }];
  return `${base}?${new URLSearchParams(params).toString()}`;
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function exchangeCode(provider: OAuthProvider, cfg: ProviderConfig, code: string, verifier: string): Promise<string | null> {
  const url = provider === "google"
    ? "https://oauth2.googleapis.com/token"
    : provider === "github"
      ? "https://github.com/login/oauth/access_token"
      : "https://discord.com/api/oauth2/token";
  const data = await fetchJson(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.callback,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  const token = isRecord(data) ? data.access_token : null;
  return typeof token === "string" && token !== "" ? token : null;
}

export type OAuthProfile = { id: string; email: string; name: string; avatarUrl: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function profileValues(id: unknown, email: unknown, name: unknown, avatar: unknown): OAuthProfile | null {
  if (typeof id !== "string" || id === "" || typeof email !== "string" || !EMAIL_RE.test(email)) return null;
  let avatarUrl = "";
  if (typeof avatar === "string") {
    try {
      avatarUrl = new URL(avatar).protocol === "https:" ? avatar : "";
    } catch {
      avatarUrl = "";
    }
  }
  return { id, email: email.toLowerCase(), name: typeof name === "string" ? name.trim() : "", avatarUrl };
}

export async function providerProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile | null> {
  const headers = { Accept: "application/json", Authorization: `Bearer ${accessToken}` };
  if (provider === "google") {
    const data = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", { headers });
    if (!isRecord(data) || data.email_verified !== true) return null;
    return profileValues(data.sub, data.email, data.name, data.picture);
  }
  if (provider === "github") {
    const ghHeaders = { ...headers, "User-Agent": "VEVIT OAuth" };
    const user = await fetchJson("https://api.github.com/user", { headers: ghHeaders });
    if (!isRecord(user) || (typeof user.id !== "number" && typeof user.id !== "string")) return null;
    const emails = await fetchJson("https://api.github.com/user/emails", { headers: ghHeaders });
    let email: string | null = null;
    if (Array.isArray(emails)) {
      for (const item of emails) {
        if (isRecord(item) && item.primary === true && item.verified === true && typeof item.email === "string") {
          email = item.email;
          break;
        }
      }
    }
    return profileValues(String(user.id), email, user.name ?? user.login, user.avatar_url);
  }
  const data = await fetchJson("https://discord.com/api/users/@me", { headers });
  if (!isRecord(data) || data.verified !== true) return null;
  // Discord returns an avatar hash, not a URL — build the CDN URL from it.
  const avatar = typeof data.avatar === "string" && typeof data.id === "string"
    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
    : null;
  return profileValues(data.id, data.email, data.global_name ?? data.username, avatar);
}

export type OAuthAttempt = {
  provider: string;
  code_verifier: string;
  destination: string;
  initiated_user_id: string | null;
};

export async function consumeAttempt(state: string): Promise<OAuthAttempt | null> {
  if (state.length < 32 || state.length > 256) return null;
  const { data, error } = await accountSupabase().rpc("consume_oauth_attempt", { p_state_hash: sha256Hex(state) });
  if (error || !Array.isArray(data) || !isRecord(data[0])) return null;
  return data[0] as OAuthAttempt;
}

export function profileIsComplete(user: Record<string, unknown>): boolean {
  return typeof user.full_name === "string" && user.full_name.trim() !== ""
    && typeof user.nickname === "string" && user.nickname.trim() !== "";
}
