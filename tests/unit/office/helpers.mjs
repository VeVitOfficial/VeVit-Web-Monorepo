import { generateKeyPairSync, createHash, randomBytes } from "node:crypto";
import { MemoryStore } from "../../../src/lib/office/memory-store.ts";
import { MockDns } from "../../../src/lib/office/dns.ts";
import { loadOfficeKeys } from "../../../src/lib/office/jwt.ts";
import { pkceChallenge } from "../../../src/lib/office/crypto.ts";

export const ISSUER = "https://vevit.cz/account";

export function keyEnv() {
  const pem = (k) => Buffer.from(k.export({ type: "pkcs8", format: "pem" })).toString("base64");
  const a = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const b = generateKeyPairSync("ec", { namedCurve: "P-256" });
  return { a, b, env: { OFFICE_OIDC_KEY_ACTIVE: pem(a.privateKey), OFFICE_OIDC_KEY_SECONDARY: Buffer.from(b.publicKey.export({ type: "spki", format: "pem" })).toString("base64") } };
}

/** Deps with an in-memory store, mock DNS, a controllable clock and a counting rate limiter. Users: u1 (Eva, owner), u2 (Jana). */
export function makeDeps(overrides = {}) {
  const store = new MemoryStore();
  store.users.set("u1", { id: "u1", email: "eva@example.test", name: "Eva Nováková", preferredUsername: "eva", emailVerified: true });
  store.users.set("u2", { id: "u2", email: "jana@example.test", name: "Jana Svobodová", preferredUsername: "jana", emailVerified: false });
  const { env } = keyEnv();
  const clock = { t: Date.parse("2026-11-01T10:00:00Z") };
  const counts = new Map();
  const deps = {
    store,
    dns: new MockDns(),
    keys: loadOfficeKeys(env),
    now: () => clock.t,
    issuer: ISSUER,
    cloudRedirectUris: ["https://cloud.invalid/api/oidc/callback"],
    sealKey: randomBytes(32).toString("base64"),
    ipSecret: "test-secret",
    // Tests authenticate with "x-test-user: u1"; the CSRF token of a session is "csrf-<id>".
    session: async (req) => { const u = req.headers.get("x-test-user"); return u ? { userId: u, csrf: `csrf-${u}` } : null; },
    rateLimit: async (key, ns, _w, max) => { const k = `${ns}|${key}`; const n = (counts.get(k) ?? 0) + 1; counts.set(k, n); return n > max ? "limited" : "ok"; },
    clientIp: (req) => req.headers.get("x-forwarded-for") ?? "203.0.113.7",
    stripe: null,
    ...overrides,
  };
  return { deps, store, clock, counts };
}

export const authed = (user, extra = {}) => ({ "x-test-user": user, "x-csrf-token": `csrf-${user}`, ...extra });

export function req(method, url, { headers = {}, json, form } = {}) {
  const init = { method, headers: { ...headers } };
  if (json !== undefined) { init.body = JSON.stringify(json); init.headers["content-type"] = "application/json"; }
  if (form !== undefined) { init.body = new URLSearchParams(form).toString(); init.headers["content-type"] = "application/x-www-form-urlencoded"; }
  return new Request(url, init);
}

/** Pairs a device for `owner` through the real handlers and returns { name, token, id }. */
export async function pair(deps, owner, name, api) {
  const start = await (await api.linkStart(deps, req("POST", "https://vevit.cz/api/office/link/start"))).json();
  const ok = await api.linkConfirm(deps, req("POST", "https://vevit.cz/api/office/link/confirm", { headers: authed(owner), json: { code: start.code, name } }));
  if (ok.status !== 200) throw new Error(`pair failed ${ok.status}`);
  const polled = await (await api.linkPoll(deps, req("POST", "https://vevit.cz/api/office/link/poll", { json: { poll_token: start.poll_token } }))).json();
  return { name, token: polled.device_token, id: polled.device_id };
}

export const verifierPair = () => {
  const verifier = randomBytes(48).toString("base64url");
  return { verifier, challenge: pkceChallenge(verifier) };
};
export { createHash };
