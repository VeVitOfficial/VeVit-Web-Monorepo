import test from "node:test";
import assert from "node:assert/strict";
import * as oidc from "../../../src/lib/office/oidc.ts";
import * as api from "../../../src/lib/office/office-api.ts";
import { verifyJwt } from "../../../src/lib/office/jwt.ts";
import { sha256Hex } from "../../../src/lib/office/crypto.ts";
import { ISSUER, authed, makeDeps, pair, req, verifierPair } from "./helpers.mjs";

const REDIRECT = "https://dilna.office.vevit.cz/api/oidc/callback";

function authorizeUrl(o = {}) {
  const { challenge } = o.pkce ?? verifierPair();
  const q = new URLSearchParams({
    response_type: "code", client_id: "vevit-office", redirect_uri: REDIRECT, scope: "openid profile email", state: "st-123",
    nonce: "nonce-abcdef", code_challenge: challenge, code_challenge_method: "S256", ...(o.q ?? {}),
  });
  for (const k of o.drop ?? []) q.delete(k);
  return `${ISSUER}/oidc/authorize?${q}`;
}

async function codeFrom(res) {
  assert.equal(res.status, 302, `expected a redirect, got ${res.status}`);
  const loc = new URL(res.headers.get("location"));
  return { loc, code: loc.searchParams.get("code"), state: loc.searchParams.get("state"), error: loc.searchParams.get("error") };
}

const exchange = (deps, p) => oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { form: { grant_type: "authorization_code", client_id: "vevit-office", redirect_uri: REDIRECT, ...p } }));

test("discovery and JWKS follow the specification, all on the issuer's origin, with two keys during a rotation", async () => {
  const { deps } = makeDeps();
  const d = await oidc.discovery(deps).json();
  assert.equal(d.issuer, "https://vevit.cz/account");
  for (const k of ["authorization_endpoint", "token_endpoint", "jwks_uri", "device_authorization_endpoint"]) assert.ok(d[k].startsWith("https://vevit.cz/account/"), k);
  assert.deepEqual(d.code_challenge_methods_supported, ["S256"]);
  assert.deepEqual(d.id_token_signing_alg_values_supported, ["ES256"]);
  const jwks = await oidc.jwks(deps).json();
  assert.equal(jwks.keys.length, 2);
  for (const k of jwks.keys) { assert.deepEqual([k.kty, k.crv, k.alg, k.use], ["EC", "P-256", "ES256", "sig"]); assert.match(k.kid, /^[0-9a-f]{16}$/); assert.equal(k.d, undefined, "no private material"); }
  assert.notEqual(jwks.keys[0].kid, jwks.keys[1].kid);
  assert.equal(oidc.jwks(makeDeps({ keys: null }).deps).status, 503, "no key configured: the provider says so instead of guessing");
});

test("a foreign person signs in to somebody's server: consent once, a single-use code, PKCE, a verifiable ID token", async () => {
  const { deps, store } = makeDeps();
  await pair(deps, "u1", "dilna", api);
  const pkce = verifierPair();
  // Not signed in: sent to the login page with a way back.
  const anon = await oidc.authorize(deps, req("GET", authorizeUrl({ pkce })));
  assert.equal(anon.status, 302);
  assert.match(anon.headers.get("location"), /^\/cs\/account\/login\?return_to=%2Faccount%2Foidc%2Fauthorize%3F/);
  // Jana is not the owner: the consent screen first.
  const first = await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u2") }));
  assert.equal(first.status, 302);
  const consentUrl = new URL(first.headers.get("location"), "https://vevit.cz");
  assert.equal(consentUrl.pathname, "/office/consent");
  const reqId = consentUrl.searchParams.get("req");
  const info = await oidc.consentInfo(deps, req("GET", `https://vevit.cz/account/oidc/consent?req=${reqId}`, { headers: authed("u2") })).then((r) => r.json());
  assert.deepEqual([info.host, info.owner, info.shares], ["dilna.office.vevit.cz", "Eva Nováková", ["name", "email"]]);
  // Somebody else cannot read or decide Jana's request.
  assert.equal((await oidc.consentInfo(deps, req("GET", `https://vevit.cz/account/oidc/consent?req=${reqId}`, { headers: authed("u1") }))).status, 404);
  assert.equal((await oidc.consentDecision(deps, req("POST", "https://vevit.cz/account/oidc/consent", { headers: authed("u1"), json: { req: reqId, decision: "allow" } }))).status, 404);
  // CSRF is required.
  assert.equal((await oidc.consentDecision(deps, req("POST", "https://vevit.cz/account/oidc/consent", { headers: { "x-test-user": "u2" }, json: { req: reqId, decision: "allow" } }))).status, 403);
  const decided = await oidc.consentDecision(deps, req("POST", "https://vevit.cz/account/oidc/consent", { headers: authed("u2"), json: { req: reqId, decision: "allow" } }));
  assert.equal(decided.status, 200);
  const back = new URL((await decided.json()).redirect);
  assert.equal(`${back.origin}${back.pathname}`, REDIRECT);
  assert.equal(back.searchParams.get("state"), "st-123");
  const code = back.searchParams.get("code");
  assert.ok(![...store.codes.keys()].includes(code), "the database holds only the hash of the code");
  assert.ok(store.codes.has(sha256Hex(code)));
  // A request is decided once.
  assert.equal((await oidc.consentDecision(deps, req("POST", "https://vevit.cz/account/oidc/consent", { headers: authed("u2"), json: { req: reqId, decision: "allow" } }))).status, 404);

  const ok = await exchange(deps, { code, code_verifier: pkce.verifier });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  const t = await ok.json();
  assert.equal(t.token_type, "Bearer");
  const claims = verifyJwt(t.id_token, deps.keys.published);
  assert.ok(claims, "the signature verifies against the published keys");
  assert.deepEqual(
    { iss: claims.iss, sub: claims.sub, aud: claims.aud, nonce: claims.nonce, email: claims.email, email_verified: claims.email_verified, name: claims.name, preferred_username: claims.preferred_username },
    { iss: ISSUER, sub: "u2", aud: "vevit-office", nonce: "nonce-abcdef", email: "jana@example.test", email_verified: false, name: "Jana Svobodová", preferred_username: "jana" },
  );
  assert.ok(claims.exp > claims.iat && claims.exp - claims.iat <= 600);
  // Replaying the code fails, and is logged.
  const again = await exchange(deps, { code, code_verifier: pkce.verifier });
  assert.deepEqual([again.status, (await again.json()).error], [400, "invalid_grant"]);
  assert.ok(store.auditLog.some((e) => e.kind === "oidc_code_reuse"));
  // The second login of Jana needs no consent; the owner never needed one.
  const second = await codeFrom(await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u2") })));
  assert.ok(second.code);
  const owner = await codeFrom(await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u1") })));
  assert.ok(owner.code);
  // Taking the consent back brings the screen back.
  const listed = await api.consentsList(deps, req("GET", "https://vevit.cz/api/office/consents", { headers: authed("u2") })).then((r) => r.json());
  assert.equal(listed.consents.length, 1);
  assert.equal((await api.consentRevoke(deps, req("DELETE", "https://vevit.cz/api/office/consents/x", { headers: authed("u1") }), listed.consents[0].id)).status, 404, "somebody else's consent");
  assert.equal((await api.consentRevoke(deps, req("DELETE", "https://vevit.cz/api/office/consents/x", { headers: authed("u2") }), listed.consents[0].id)).status, 204);
  const third = await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u2") }));
  assert.match(third.headers.get("location"), /^\/office\/consent\?req=/);
});

test("a denied consent goes back to the app as access_denied", async () => {
  const { deps } = makeDeps();
  await pair(deps, "u1", "dilna", api);
  const first = await oidc.authorize(deps, req("GET", authorizeUrl(), { headers: authed("u2") }));
  const reqId = new URL(first.headers.get("location"), "https://vevit.cz").searchParams.get("req");
  const r = await oidc.consentDecision(deps, req("POST", "https://vevit.cz/account/oidc/consent", { headers: authed("u2"), json: { req: reqId, decision: "deny" } }));
  const to = new URL((await r.json()).redirect);
  assert.deepEqual([to.searchParams.get("error"), to.searchParams.get("state"), to.searchParams.get("code")], ["access_denied", "st-123", null]);
});

test("forged or unregistered redirect URIs are never redirected to", async () => {
  const { deps } = makeDeps();
  await pair(deps, "u1", "dilna", api);
  for (const evil of [
    "https://evil.example/cb", "https://dilna.office.vevit.cz/api/oidc/callback?next=https://evil.example", "https://skola.office.vevit.cz/api/oidc/callback",
    "http://dilna.office.vevit.cz/api/oidc/callback", "https://dilna.office.vevit.cz.evil.example/api/oidc/callback", "javascript:alert(1)", "", "https://www.office.vevit.cz/api/oidc/callback",
  ]) {
    const r = await oidc.authorize(deps, req("GET", authorizeUrl({ q: { redirect_uri: evil } }), { headers: authed("u1") }));
    assert.equal(r.status, 400, evil);
    assert.equal(r.headers.get("location"), null, evil);
  }
  assert.equal((await oidc.authorize(deps, req("GET", authorizeUrl({ q: { client_id: "someone-else" } }), { headers: authed("u1") }))).status, 400);
  // The Cloud address is configuration, exact match too.
  const cloud = await oidc.authorize(deps, req("GET", authorizeUrl({ q: { redirect_uri: "https://cloud.invalid/api/oidc/callback" } }), { headers: authed("u2") }));
  assert.equal((await codeFrom(cloud)).loc.origin, "https://cloud.invalid", "first-party: no consent screen");
  assert.equal((await oidc.authorize(deps, req("GET", authorizeUrl({ q: { redirect_uri: "https://cloud.invalid/api/oidc/callback/" } }), { headers: authed("u2") }))).status, 400);
});

test("authorization requests without PKCE S256, nonce, openid scope or with other response types are refused, back to the app", async () => {
  const { deps } = makeDeps();
  await pair(deps, "u1", "dilna", api);
  const cases = [
    [{ drop: ["code_challenge", "code_challenge_method"] }, "invalid_request"],
    [{ q: { code_challenge_method: "plain" } }, "invalid_request"],
    [{ q: { code_challenge: "short" } }, "invalid_request"],
    [{ drop: ["nonce"] }, "invalid_request"],
    [{ q: { scope: "profile" } }, "invalid_scope"],
    [{ q: { scope: "openid admin" } }, "invalid_scope"],
    [{ q: { response_type: "token" } }, "unsupported_response_type"],
  ];
  for (const [o, error] of cases) {
    const c = await codeFrom(await oidc.authorize(deps, req("GET", authorizeUrl(o), { headers: authed("u1") })));
    assert.equal(c.error, error, JSON.stringify(o));
    assert.equal(c.state, "st-123");
    assert.equal(c.code, null);
  }
});

test("token endpoint: wrong verifier, wrong redirect_uri, expired code, unknown code, wrong client, malformed requests", async () => {
  const { deps, clock } = makeDeps();
  await pair(deps, "u1", "dilna", api);
  const pkce = verifierPair();
  const fresh = async () => (await codeFrom(await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u1") })))).code;
  const err = async (res) => { const b = await res.json(); return [res.status, b.error]; };
  assert.deepEqual(await err(await exchange(deps, { code: await fresh(), code_verifier: verifierPair().verifier })), [400, "invalid_grant"]);
  assert.deepEqual(await err(await exchange(deps, { code: await fresh(), code_verifier: pkce.verifier, redirect_uri: "https://skola.office.vevit.cz/api/oidc/callback" })), [400, "invalid_grant"]);
  assert.deepEqual(await err(await exchange(deps, { code: await fresh(), code_verifier: "short" })), [400, "invalid_grant"]);
  assert.deepEqual(await err(await exchange(deps, { code: "x".repeat(43), code_verifier: pkce.verifier })), [400, "invalid_grant"]);
  assert.deepEqual(await err(await exchange(deps, { code: await fresh(), code_verifier: pkce.verifier, client_id: "vevit-office-device" })), [401, "invalid_client"]);
  const stale = await fresh();
  clock.t += 61_000;
  assert.deepEqual(await err(await exchange(deps, { code: stale, code_verifier: pkce.verifier })), [400, "invalid_grant"], "codes live at most 60 s");
  assert.deepEqual(await err(await oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { json: { grant_type: "authorization_code" } }))), [400, "invalid_request"]);
  assert.deepEqual(await err(await oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { form: { grant_type: "password" } }))), [400, "unsupported_grant_type"]);
  // A good exchange still works after all that, and a code died by a failed attempt stays dead.
  const code = await fresh();
  assert.equal((await exchange(deps, { code, code_verifier: verifierPair().verifier })).status, 400);
  assert.equal((await exchange(deps, { code, code_verifier: pkce.verifier })).status, 400, "a failed verifier burns the code");
});

test("a device unlinked while its code is in flight gets no token", async () => {
  const { deps } = makeDeps();
  const dev = await pair(deps, "u1", "dilna", api);
  const pkce = verifierPair();
  const { code } = await codeFrom(await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u1") })));
  assert.equal((await api.deviceUnlink(deps, req("DELETE", "https://vevit.cz/api/office/devices/x", { headers: authed("u1") }), dev.id)).status, 204);
  assert.equal((await exchange(deps, { code, code_verifier: pkce.verifier })).status, 400);
  assert.equal((await oidc.authorize(deps, req("GET", authorizeUrl({ pkce }), { headers: authed("u1") }))).status, 400, "and the redirect URI is no longer registered");
});

test("device flow (RFC 8628): pending, slow_down, approval, single use, denial, expiry", async () => {
  const { deps, clock, store } = makeDeps();
  const start = () => oidc.deviceAuthorization(deps, req("POST", `${ISSUER}/oidc/device`, { form: { client_id: "vevit-office-device", scope: "openid profile email" } })).then((r) => r.json());
  const poll = (dc, cid = "vevit-office-device") => oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { form: { grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: dc, client_id: cid } }));
  const err = async (r) => (await r.json()).error;
  const d = await start();
  assert.match(d.user_code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.deepEqual([d.verification_uri, d.expires_in, d.interval], ["https://vevit.cz/office/device", 600, 5]);
  assert.ok(!store.deviceCodes.has(d.device_code), "only hashes are stored");
  assert.equal(await err(await poll(d.device_code)), "authorization_pending");
  assert.equal(await err(await poll(d.device_code)), "slow_down", "polling again at once");
  clock.t += 11_000;
  assert.equal(await err(await poll(d.device_code)), "authorization_pending");
  assert.equal(await err(await poll("z".repeat(43), "someone-else")), "invalid_client");
  // Approval needs a session and CSRF, and a code that exists.
  const approve = (headers, user_code, decision = "allow") => oidc.deviceApprove(deps, req("POST", "https://vevit.cz/account/oidc/device/approve", { headers, json: { user_code, decision } }));
  assert.equal((await approve({}, d.user_code)).status, 401);
  assert.equal((await approve({ "x-test-user": "u2" }, d.user_code)).status, 403);
  assert.equal((await approve(authed("u2"), "BBBB-BBBB")).status, 404);
  assert.equal((await approve(authed("u2"), d.user_code.toLowerCase().replace("-", " "))).status, 200, "a typed code is forgiving about case and spacing");
  clock.t += 11_000;
  const ok = await poll(d.device_code);
  assert.equal(ok.status, 200);
  const claims = verifyJwt((await ok.json()).id_token, deps.keys.published);
  assert.deepEqual([claims.sub, claims.aud, claims.nonce], ["u2", "vevit-office-device", undefined]);
  clock.t += 11_000;
  assert.equal(await err(await poll(d.device_code)), "invalid_grant", "a device code is used once");
  // Denied
  const d2 = await start();
  assert.equal((await approve(authed("u1"), d2.user_code, "deny")).status, 200);
  clock.t += 6_000;
  assert.equal(await err(await poll(d2.device_code)), "access_denied");
  // Expired
  const d3 = await start();
  clock.t += 601_000;
  assert.equal(await err(await poll(d3.device_code)), "expired_token");
  assert.equal((await approve(authed("u1"), d3.user_code)).status, 404);
  assert.equal((await oidc.deviceAuthorization(deps, req("POST", `${ISSUER}/oidc/device`, { form: { client_id: "someone-else" } }))).status, 400, "unknown clients are refused");
  // The code-flow client has no business on the device endpoints.
  assert.equal((await oidc.deviceAuthorization(deps, req("POST", `${ISSUER}/oidc/device`, { form: { client_id: "vevit-office" } }))).status, 400);
  assert.equal(await err(await poll(d.device_code, "vevit-office")), "invalid_client");
});

test("device flow: parallel polls of an approved code yield exactly one token", async () => {
  const { deps, clock } = makeDeps();
  const d = await oidc.deviceAuthorization(deps, req("POST", `${ISSUER}/oidc/device`, { form: { client_id: "vevit-office-device" } })).then((r) => r.json());
  const ok = await oidc.deviceApprove(deps, req("POST", "https://vevit.cz/account/oidc/device/approve", { headers: authed("u2"), json: { user_code: d.user_code, decision: "allow" } }));
  assert.equal(ok.status, 200);
  clock.t += 11_000;
  const poll = () => oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { form: { grant_type: "urn:ietf:params:oauth:grant-type:device_code", device_code: d.device_code, client_id: "vevit-office-device" } }));
  const results = await Promise.all([poll(), poll(), poll()]);
  // Concurrent polls beyond the first also trip slow_down; whichever pass the interval check race for the single consume.
  assert.ok(results.filter((r) => r.status === 200).length <= 1, "never more than one token");
  clock.t += 11_000;
  const again = await poll();
  assert.equal(again.status, 400, "and none afterwards");
});

test("guessing user codes is rate limited per person", async () => {
  const { deps } = makeDeps();
  let limited = 0;
  for (let i = 0; i < 14; i += 1) {
    const r = await oidc.deviceApprove(deps, req("POST", "https://vevit.cz/account/oidc/device/approve", { headers: authed("u2"), json: { user_code: "BBBB-BBBB", decision: "allow" } }));
    if (r.status === 429) limited += 1;
  }
  assert.ok(limited >= 4, `limited ${limited}`);
});

test("rate limiter outages fail closed", async () => {
  const { deps } = makeDeps({ rateLimit: async () => "unavailable" });
  assert.equal((await oidc.token(deps, req("POST", `${ISSUER}/oidc/token`, { form: { grant_type: "authorization_code" } }))).status, 503);
  assert.equal((await oidc.authorize(deps, req("GET", authorizeUrl(), { headers: authed("u1") }))).status, 503);
});
