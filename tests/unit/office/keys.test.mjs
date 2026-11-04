import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { jwksFor, loadOfficeKeys, signJwt, verifyJwt } from "../../../src/lib/office/jwt.ts";

const priv = (k) => Buffer.from(k.privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64");
const pub = (k) => Buffer.from(k.publicKey.export({ type: "spki", format: "pem" })).toString("base64");
const gen = () => generateKeyPairSync("ec", { namedCurve: "P-256" });

test("keys: the active key must be private, the secondary may be public; no keys means no provider", () => {
  assert.equal(loadOfficeKeys({}), null);
  const a = gen();
  assert.throws(() => loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: pub(a) }), /private/);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.throws(() => loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: Buffer.from(rsa.privateKey.export({ type: "pkcs8", format: "pem" })).toString("base64") }), /P-256/);
  const same = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: priv(a), OFFICE_OIDC_KEY_SECONDARY: pub(a) });
  assert.equal(same.published.length, 1, "the same key twice is published once");
});

test("rotation: publish the new key first, swap, then retire the old one; tokens stay verifiable throughout", () => {
  const [oldK, newK] = [gen(), gen()];
  const claims = { sub: "u1", iss: "https://vevit.cz/account" };
  // Step 1: old signs, new is already published (relying parties can cache it).
  const s1 = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: priv(oldK), OFFICE_OIDC_KEY_SECONDARY: pub(newK) });
  const tokenOld = signJwt(claims, s1.active);
  assert.equal(jwksFor(s1.published).keys.length, 2);
  // Step 2: swap. The new key signs, the old one stays published for tokens in flight.
  const s2 = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: priv(newK), OFFICE_OIDC_KEY_SECONDARY: pub(oldK) });
  const tokenNew = signJwt(claims, s2.active);
  assert.notEqual(s1.active.kid, s2.active.kid);
  assert.ok(verifyJwt(tokenOld, s2.published), "a token signed before the swap still verifies");
  assert.ok(verifyJwt(tokenNew, s1.published), "relying parties that cached the old JWKS from step 1 already know the new key");
  // Step 3: retire the old key.
  const s3 = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: priv(newK) });
  assert.equal(verifyJwt(tokenOld, s3.published), null, "after retirement the old key verifies nothing");
  assert.ok(verifyJwt(tokenNew, s3.published));
});

test("JWT checks: wrong algorithm, wrong kid, tampered payload", () => {
  const k = loadOfficeKeys({ OFFICE_OIDC_KEY_ACTIVE: priv(gen()) });
  const t = signJwt({ sub: "u1" }, k.active);
  const [h, p, s] = t.split(".");
  const evilPayload = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
  assert.equal(verifyJwt(`${h}.${evilPayload}.${s}`, k.published), null);
  const noneHeader = Buffer.from(JSON.stringify({ alg: "none", kid: k.active.kid })).toString("base64url");
  assert.equal(verifyJwt(`${noneHeader}.${p}.${s}`, k.published), null);
  const otherKid = Buffer.from(JSON.stringify({ alg: "ES256", kid: "0000000000000000" })).toString("base64url");
  assert.equal(verifyJwt(`${otherKid}.${p}.${s}`, k.published), null);
  assert.equal(verifyJwt("a.b", k.published), null);
});
