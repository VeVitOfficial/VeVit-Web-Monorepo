import { accountSupabase } from "@/lib/account-auth";
import { AccountBackendUnavailableError, loadSessionFromCookies } from "@/lib/account-session";
import {
  OAUTH_STATE_TTL_SECONDS,
  authorizationUrl,
  oauthProviderAllowed,
  oauthProviderConfig,
  pkceChallenge,
  randomToken,
  redirectResponse,
  redirectToLogin,
  sha256Hex,
} from "@/lib/account-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/oauth/start.php: create a hashed state + PKCE verifier
// in oauth_attempts, then 302 to the provider. mode=connect / twofa_reauth
// require an existing session and bind the attempt to that user.

const TWOFA_ACTIONS = new Set(["setup", "regenerate", "disable"]);

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") ?? "").toLowerCase();
  if (!oauthProviderAllowed(provider)) return redirectToLogin(request, "oauth_configuration_error");
  const cfg = oauthProviderConfig(provider);
  if (cfg === null) return redirectToLogin(request, "oauth_configuration_error");

  const mode = url.searchParams.get("mode") ?? "login";
  const rawAction = url.searchParams.get("twofa_action") ?? "";
  const twofaAction = TWOFA_ACTIONS.has(rawAction) ? rawAction : "setup";

  let initiatedUserId: string | null = null;
  if (mode === "connect" || mode === "twofa_reauth") {
    try {
      const session = await loadSessionFromCookies();
      if (!session) return redirectToLogin(request, "oauth_invalid_state");
      initiatedUserId = session.user.id;
    } catch (error) {
      if (error instanceof AccountBackendUnavailableError) {
        return new Response("Služba je dočasně nedostupná. Zkuste to prosím za chvíli.", {
          status: 503,
          headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
        });
      }
      throw error;
    }
  }

  const state = randomToken(32);
  const verifier = randomToken(48);
  const now = Date.now();
  const { error } = await accountSupabase().from("oauth_attempts").insert({
    state_hash: sha256Hex(state),
    provider,
    code_verifier: verifier,
    destination: mode === "twofa_reauth" ? `twofa_reauth:${twofaAction}` : "/account",
    initiated_user_id: initiatedUserId,
    expires_at: new Date(now + OAUTH_STATE_TTL_SECONDS * 1000).toISOString(),
    created_at: new Date(now).toISOString(),
  });
  if (error) return redirectToLogin(request, "oauth_exchange_failed");

  return redirectResponse(authorizationUrl(provider, cfg, state, pkceChallenge(verifier)));
}
