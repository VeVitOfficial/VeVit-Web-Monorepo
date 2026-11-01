import { humanCode, normalizeHumanCode, pkceChallenge, randomToken, safeEqual, sha256Hex, validChallenge, validVerifier, ipFingerprint } from "./crypto.ts";
import {
  CLIENT_OFFICE, CODE_TTL_MS, DEVICE_CLIENTS, DEVICE_CODE_TTL_S, DEVICE_VERIFY_URL, ID_TOKEN_TTL_S, type OfficeDeps,
} from "./deps.ts";
import { json, readForm, readJson, redirect } from "./http.ts";
import { jwksFor, signJwt } from "./jwt.ts";
import type { Device, OfficeUser } from "./store.ts";
import { deviceHost, deviceNameFromRedirect } from "./validate.ts";

// The OIDC provider (RFC 6749 code flow with PKCE, OpenID Connect Core, RFC 8628 device flow) for VeVit Office.
// Contract: docs/office/OIDC-SPEC.md. All functions take plain Requests so they run under node --test and under Next.js.

const iso = (ms: number) => new Date(ms).toISOString();

async function rate(d: OfficeDeps, req: Request, ns: string, windowS: number, max: number, extraKey?: string): Promise<Response | null> {
  const key = extraKey ?? d.clientIp(req);
  const r = await d.rateLimit(key, ns, windowS, max);
  if (r === "limited") return json(429, { error: "too_many_requests" }, { "retry-after": String(windowS) });
  if (r === "unavailable") return json(503, { error: "temporarily_unavailable" });
  return null;
}

function claimsFor(user: OfficeUser) {
  return { email: user.email, email_verified: user.emailVerified, name: user.name, preferred_username: user.preferredUsername };
}

export function discovery(d: OfficeDeps): Response {
  const i = d.issuer;
  return json(200, {
    issuer: i,
    authorization_endpoint: `${i}/oidc/authorize`,
    token_endpoint: `${i}/oidc/token`,
    jwks_uri: `${i}/oidc/jwks`,
    device_authorization_endpoint: `${i}/oidc/device`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "urn:ietf:params:oauth:grant-type:device_code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["ES256"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "profile", "email"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "nonce", "email", "email_verified", "name", "preferred_username"],
  }, { "cache-control": "public, max-age=300" });
}

export function jwks(d: OfficeDeps): Response {
  if (!d.keys) return json(503, { error: "temporarily_unavailable" });
  return json(200, jwksFor(d.keys.published), { "cache-control": "public, max-age=300" });
}

type AuthParams = { redirectUri: string; state: string; nonce: string; scope: string; codeChallenge: string; device: Device | null };

async function resolveRedirect(d: OfficeDeps, redirectUri: string): Promise<{ ok: true; device: Device | null } | { ok: false }> {
  if (d.cloudRedirectUris.includes(redirectUri)) return { ok: true, device: null };
  const name = deviceNameFromRedirect(redirectUri);
  if (!name) return { ok: false };
  const device = await d.store.getDeviceByName(name);
  // Only a paired, not unlinked device is a valid target: the redirect URI is compared with the registered shape, never with the request.
  return device && !device.revokedAt ? { ok: true, device } : { ok: false };
}

function backToClient(redirectUri: string, state: string, error: string): Response {
  const u = new URL(redirectUri);
  u.searchParams.set("error", error);
  if (state) u.searchParams.set("state", state);
  return redirect(u.toString());
}

async function issueCode(d: OfficeDeps, user: OfficeUser, p: AuthParams): Promise<string> {
  const code = randomToken(32);
  await d.store.saveCode({
    codeHash: sha256Hex(code), clientId: CLIENT_OFFICE, userId: user.id, deviceId: p.device?.id ?? null, redirectUri: p.redirectUri,
    codeChallenge: p.codeChallenge, nonce: p.nonce, scope: p.scope, expiresAt: iso(d.now() + CODE_TTL_MS), usedAt: null,
  });
  const u = new URL(p.redirectUri);
  u.searchParams.set("code", code);
  if (p.state) u.searchParams.set("state", p.state);
  return u.toString();
}

/** GET /account/oidc/authorize */
export async function authorize(d: OfficeDeps, req: Request): Promise<Response> {
  if (!d.keys) return json(503, { error: "temporarily_unavailable" });
  const limited = await rate(d, req, "office_authorize", 60, 60);
  if (limited) return limited;
  const q = new URL(req.url).searchParams;
  const get = (k: string) => q.get(k) ?? "";
  // Errors about the client or the redirect URI are never redirected (RFC 6749 4.1.2.1): the browser stays here.
  if (get("client_id") !== CLIENT_OFFICE) return json(400, { error: "invalid_client" });
  const redirectUri = get("redirect_uri");
  const target = await resolveRedirect(d, redirectUri);
  if (!target.ok) {
    await d.store.audit({ kind: "oidc_bad_redirect", ipHash: ipFingerprint(d.clientIp(req), d.ipSecret), detail: { redirect_uri: redirectUri.slice(0, 200) } });
    return json(400, { error: "invalid_request", error_description: "redirect_uri is not registered" });
  }
  const state = get("state").slice(0, 512);
  if (get("response_type") !== "code") return backToClient(redirectUri, state, "unsupported_response_type");
  const scopes = get("scope").split(" ").filter(Boolean);
  if (!scopes.includes("openid") || scopes.some((s) => !["openid", "profile", "email"].includes(s))) return backToClient(redirectUri, state, "invalid_scope");
  const nonce = get("nonce");
  if (nonce.length < 8 || nonce.length > 256) return backToClient(redirectUri, state, "invalid_request");
  if (get("code_challenge_method") !== "S256" || !validChallenge(get("code_challenge"))) return backToClient(redirectUri, state, "invalid_request");

  const session = await d.session(req);
  if (!session) {
    const back = `${new URL(req.url).pathname}${new URL(req.url).search}`;
    return redirect(`/cs/account/login?return_to=${encodeURIComponent(back)}`);
  }
  const user = await d.store.getUser(session.userId);
  if (!user) return backToClient(redirectUri, state, "access_denied");
  const p: AuthParams = { redirectUri, state, nonce, scope: scopes.join(" "), codeChallenge: get("code_challenge"), device: target.device };

  // Somebody else's server: the person decides once, and can take the decision back in the account.
  if (p.device && p.device.ownerId !== user.id && !(await d.store.getConsent(user.id, p.device.id))) {
    const id = randomToken(24);
    await d.store.savePending({
      id, userId: user.id, clientId: CLIENT_OFFICE, deviceId: p.device.id, redirectUri, state, nonce, scope: p.scope,
      codeChallenge: p.codeChallenge, expiresAt: iso(d.now() + 10 * 60_000),
    });
    return redirect(`/office/consent?req=${encodeURIComponent(id)}`);
  }
  await d.store.audit({ kind: "oidc_authorize", userId: user.id, deviceId: p.device?.id ?? null, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return redirect(await issueCode(d, user, p));
}

/** GET /account/oidc/consent?req=…: what the consent screen shows. */
export async function consentInfo(d: OfficeDeps, req: Request): Promise<Response> {
  const session = await d.session(req);
  if (!session) return json(401, { error: "unauthorized" });
  const id = new URL(req.url).searchParams.get("req") ?? "";
  const p = await d.store.getPending(id, session.userId);
  if (!p || Date.parse(p.expiresAt) <= d.now()) return json(404, { error: "not_found" });
  const device = await d.store.getDevice(p.deviceId);
  const owner = device ? await d.store.getUser(device.ownerId) : null;
  if (!device || device.revokedAt) return json(404, { error: "not_found" });
  return json(200, { server: device.displayName, host: deviceHost(device.name), owner: owner?.name ?? "", shares: ["name", "email"] });
}

/** POST /account/oidc/consent {req, decision} */
export async function consentDecision(d: OfficeDeps, req: Request): Promise<Response> {
  const session = await d.session(req);
  if (!session) return json(401, { error: "unauthorized" });
  if (!safeEqual(req.headers.get("x-csrf-token") ?? "", session.csrf)) return json(403, { error: "csrf" });
  const limited = await rate(d, req, "office_consent", 600, 30, session.userId);
  if (limited) return limited;
  const body = await readJson(req);
  if (!body || typeof body.req !== "string" || (body.decision !== "allow" && body.decision !== "deny")) return json(400, { error: "invalid_request" });
  const p = await d.store.takePending(body.req, session.userId);
  if (!p || Date.parse(p.expiresAt) <= d.now()) return json(404, { error: "not_found" });
  const user = await d.store.getUser(session.userId);
  const device = await d.store.getDevice(p.deviceId);
  if (!user || !device || device.revokedAt) return json(404, { error: "not_found" });
  if (body.decision === "deny") {
    await d.store.audit({ kind: "oidc_consent_denied", userId: user.id, deviceId: device.id });
    return json(200, { redirect: backToClient(p.redirectUri, p.state, "access_denied").headers.get("location") });
  }
  await d.store.saveConsent(user.id, device.id);
  await d.store.audit({ kind: "oidc_consent_granted", userId: user.id, deviceId: device.id, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  const to = await issueCode(d, user, { redirectUri: p.redirectUri, state: p.state, nonce: p.nonce, scope: p.scope, codeChallenge: p.codeChallenge, device });
  return json(200, { redirect: to });
}

function oauthError(status: number, error: string, description?: string): Response {
  return json(status, description ? { error, error_description: description } : { error });
}

async function idTokenFor(d: OfficeDeps, user: OfficeUser, clientId: string, nonce: string | null): Promise<string> {
  const iat = Math.floor(d.now() / 1000);
  return signJwt({ iss: d.issuer, sub: user.id, aud: clientId, iat, exp: iat + ID_TOKEN_TTL_S, ...(nonce ? { nonce } : {}), ...claimsFor(user) }, d.keys!.active);
}

/** POST /account/oidc/token (application/x-www-form-urlencoded) */
export async function token(d: OfficeDeps, req: Request): Promise<Response> {
  if (!d.keys) return json(503, { error: "temporarily_unavailable" });
  const limited = await rate(d, req, "office_token", 60, 60);
  if (limited) return limited;
  const f = await readForm(req);
  if (!f) return oauthError(400, "invalid_request", "form body required");
  const grant = f.get("grant_type");
  if (grant === "authorization_code") return codeGrant(d, req, f);
  if (grant === "urn:ietf:params:oauth:grant-type:device_code") return deviceGrant(d, f);
  return oauthError(400, "unsupported_grant_type");
}

async function codeGrant(d: OfficeDeps, req: Request, f: URLSearchParams): Promise<Response> {
  if (f.get("client_id") !== CLIENT_OFFICE) return oauthError(401, "invalid_client");
  const code = f.get("code") ?? "";
  const verifier = f.get("code_verifier");
  if (!/^[A-Za-z0-9_-]{43}$/.test(code) || !validVerifier(verifier)) return oauthError(400, "invalid_grant");
  const used = await d.store.useCode(sha256Hex(code));
  if (!used) return oauthError(400, "invalid_grant");
  if (used.reused) {
    await d.store.audit({ kind: "oidc_code_reuse", userId: used.code.userId, deviceId: used.code.deviceId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
    return oauthError(400, "invalid_grant");
  }
  const c = used.code;
  if (Date.parse(c.expiresAt) <= d.now() || c.clientId !== CLIENT_OFFICE) return oauthError(400, "invalid_grant");
  // The redirect URI of the exchange must be the one the code was issued for, byte for byte.
  if (!safeEqual(f.get("redirect_uri") ?? "", c.redirectUri)) return oauthError(400, "invalid_grant");
  if (!safeEqual(pkceChallenge(verifier), c.codeChallenge)) {
    await d.store.audit({ kind: "oidc_bad_verifier", userId: c.userId, deviceId: c.deviceId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
    return oauthError(400, "invalid_grant");
  }
  const user = await d.store.getUser(c.userId);
  if (!user) return oauthError(400, "invalid_grant");
  // A device unlinked while the code was in flight no longer gets a login.
  if (c.deviceId) {
    const dev = await d.store.getDevice(c.deviceId);
    if (!dev || dev.revokedAt) return oauthError(400, "invalid_grant");
  }
  await d.store.audit({ kind: "oidc_login", userId: user.id, deviceId: c.deviceId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return json(200, { token_type: "Bearer", expires_in: ID_TOKEN_TTL_S, id_token: await idTokenFor(d, user, CLIENT_OFFICE, c.nonce) });
}

async function deviceGrant(d: OfficeDeps, f: URLSearchParams): Promise<Response> {
  const clientId = f.get("client_id") ?? "";
  if (!DEVICE_CLIENTS.includes(clientId)) return oauthError(401, "invalid_client");
  const dc = f.get("device_code") ?? "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(dc)) return oauthError(400, "invalid_grant");
  const hash = sha256Hex(dc);
  const row = await d.store.getDeviceCode(hash);
  if (!row || row.clientId !== clientId || row.status === "consumed") return oauthError(400, "invalid_grant");
  if (Date.parse(row.expiresAt) <= d.now()) return oauthError(400, "expired_token");
  // RFC 8628 3.5: polling faster than the interval earns slow_down and a longer interval.
  const last = row.lastPollAt ? Date.parse(row.lastPollAt) : 0;
  if (last && d.now() - last < row.intervalSeconds * 1000) {
    await d.store.updateDeviceCode(hash, { lastPollAt: iso(d.now()), intervalSeconds: row.intervalSeconds + 5 });
    return oauthError(400, "slow_down");
  }
  await d.store.updateDeviceCode(hash, { lastPollAt: iso(d.now()) });
  if (row.status === "denied") return oauthError(400, "access_denied");
  if (row.status === "pending" || !row.userId) return oauthError(400, "authorization_pending");
  await d.store.updateDeviceCode(hash, { status: "consumed" });
  const user = await d.store.getUser(row.userId);
  if (!user) return oauthError(400, "invalid_grant");
  await d.store.audit({ kind: "oidc_device_login", userId: user.id });
  return json(200, { token_type: "Bearer", expires_in: ID_TOKEN_TTL_S, id_token: await idTokenFor(d, user, clientId, null) });
}

/** POST /account/oidc/device (RFC 8628 3.1) */
export async function deviceAuthorization(d: OfficeDeps, req: Request): Promise<Response> {
  if (!d.keys) return json(503, { error: "temporarily_unavailable" });
  const limited = await rate(d, req, "office_device_start", 600, 20);
  if (limited) return limited;
  const f = await readForm(req);
  const clientId = f?.get("client_id") ?? "";
  if (!f || !DEVICE_CLIENTS.includes(clientId)) return oauthError(400, "invalid_client");
  const scopes = (f.get("scope") ?? "openid").split(" ").filter(Boolean);
  if (!scopes.includes("openid") || scopes.some((s) => !["openid", "profile", "email"].includes(s))) return oauthError(400, "invalid_scope");
  const deviceCode = randomToken(32);
  const userCode = humanCode();
  await d.store.saveDeviceCode({
    deviceCodeHash: sha256Hex(deviceCode), userCodeHash: sha256Hex(userCode), clientId, userId: null, status: "pending",
    intervalSeconds: 5, lastPollAt: null, expiresAt: iso(d.now() + DEVICE_CODE_TTL_S * 1000),
  });
  return json(200, {
    device_code: deviceCode, user_code: userCode, verification_uri: DEVICE_VERIFY_URL,
    verification_uri_complete: `${DEVICE_VERIFY_URL}?code=${encodeURIComponent(userCode)}`, expires_in: DEVICE_CODE_TTL_S, interval: 5,
  });
}

/** POST /account/oidc/device/approve {user_code, decision}: the person at the keyboard answers the code shown by the app. */
export async function deviceApprove(d: OfficeDeps, req: Request): Promise<Response> {
  const session = await d.session(req);
  if (!session) return json(401, { error: "unauthorized" });
  if (!safeEqual(req.headers.get("x-csrf-token") ?? "", session.csrf)) return json(403, { error: "csrf" });
  // Guessing codes is the attack here: few tries per person and per address.
  const byUser = await rate(d, req, "office_device_approve_user", 600, 10, session.userId);
  if (byUser) return byUser;
  const byIp = await rate(d, req, "office_device_approve_ip", 600, 20);
  if (byIp) return byIp;
  const body = await readJson(req);
  const code = normalizeHumanCode(body?.user_code);
  if (!body || !code || (body.decision !== "allow" && body.decision !== "deny")) return json(400, { error: "invalid_request" });
  const row = await d.store.getDeviceCodeByUserCode(sha256Hex(code));
  if (!row || row.status !== "pending" || Date.parse(row.expiresAt) <= d.now()) return json(404, { error: "not_found" });
  await d.store.updateDeviceCode(row.deviceCodeHash, body.decision === "allow" ? { status: "approved", userId: session.userId } : { status: "denied" });
  await d.store.audit({ kind: body.decision === "allow" ? "oidc_device_approved" : "oidc_device_denied", userId: session.userId, ipHash: ipFingerprint(d.clientIp(req), d.ipSecret) });
  return json(200, { ok: true });
}
