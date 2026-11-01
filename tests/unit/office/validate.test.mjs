import test from "node:test";
import assert from "node:assert/strict";
import { acmeValueOk, checkSubdomain, deviceNameFromRedirect, dnsNameAllowed } from "../../../src/lib/office/validate.ts";
import { humanCode, normalizeHumanCode, openSecret, pkceChallenge, sealSecret, validVerifier } from "../../../src/lib/office/crypto.ts";

test("sub-domain names: lower case, digits, single hyphens, 3-40 characters, nothing reserved", () => {
  for (const ok of ["dilna", "skola-3b", "abc", "a1b2c3", "x".repeat(40)]) assert.equal(checkSubdomain(ok).ok, true, ok);
  const bad = {
    format: ["Dilna", "dilna_x", "-dilna", "dilna-", "di--lna", "xn--abc", "dil na", "dilna.office", "příliš", "a/b", "dilna\n"],
    length: ["ab", "", "x".repeat(41)],
    reserved: ["www", "api", "admin", "relay", "mail", "office", "vevit"],
  };
  for (const [reason, names] of Object.entries(bad)) for (const n of names) assert.deepEqual(checkSubdomain(n), { ok: false, reason }, n);
  assert.equal(checkSubdomain(42).ok, false);
});

test("redirect URIs match only the exact device shape", () => {
  assert.equal(deviceNameFromRedirect("https://dilna.office.vevit.cz/api/oidc/callback"), "dilna");
  for (const evil of [
    "http://dilna.office.vevit.cz/api/oidc/callback",
    "https://dilna.office.vevit.cz/api/oidc/callback?x=1",
    "https://dilna.office.vevit.cz/api/oidc/callback/",
    "https://dilna.office.vevit.cz.evil.example/api/oidc/callback",
    "https://evil.example/https://dilna.office.vevit.cz/api/oidc/callback",
    "https://a.b.office.vevit.cz/api/oidc/callback",
    "https://www.office.vevit.cz/api/oidc/callback",
    "https://dilna.office.vevit.cz:8443/api/oidc/callback",
    "https://dilna.office.vevit.cz/api/oidc/callback#x",
    "https://DILNA.office.vevit.cz/api/oidc/callback",
  ]) assert.equal(deviceNameFromRedirect(evil), null, evil);
});

test("DNS: only the device's own _acme-challenge name, only a SHA-256 shaped value", () => {
  assert.equal(dnsNameAllowed("_acme-challenge.dilna.office.vevit.cz", "dilna"), true);
  assert.equal(dnsNameAllowed("_acme-challenge.dilna.office.vevit.cz.", "dilna"), true);
  for (const evil of ["_acme-challenge.skola.office.vevit.cz", "dilna.office.vevit.cz", "_acme-challenge.office.vevit.cz", "_acme-challenge.dilna.office.vevit.cz.evil.example",
    "x._acme-challenge.dilna.office.vevit.cz", "_ACME-challenge.dilna.office.vevit.cz", "vevit.cz", "*.office.vevit.cz", "", null, 7]) assert.equal(dnsNameAllowed(evil, "dilna"), false, String(evil));
  assert.equal(acmeValueOk("a".repeat(43)), true);
  for (const v of ["a".repeat(42), "a".repeat(44), "a b".padEnd(43, "a"), "", null]) assert.equal(acmeValueOk(v), false);
});

test("PKCE, human codes and sealed secrets", () => {
  // RFC 7636 appendix B
  assert.equal(pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.equal(validVerifier("short"), false);
  assert.equal(validVerifier("a".repeat(43)), true);
  const c = humanCode();
  assert.match(c, /^[BCDFGHJKLMNPQRSTVWXZ2-9]{4}-[BCDFGHJKLMNPQRSTVWXZ2-9]{4}$/);
  assert.equal(normalizeHumanCode(c.toLowerCase().replace("-", " ")), c);
  assert.equal(normalizeHumanCode("AAAA-AAAA"), null, "vowels are not in the alphabet");
  const key = Buffer.alloc(32, 7).toString("base64");
  const sealed = sealSecret("tajne", key);
  assert.equal(openSecret(sealed, key), "tajne");
  assert.equal(openSecret(sealed, Buffer.alloc(32, 8).toString("base64")), null, "a wrong key opens nothing");
  assert.equal(openSecret(sealed.slice(0, -2) + "xx", key), null, "tampering is detected");
});

import { isOidcProtocolPath } from "../../../src/lib/office/paths.ts";
test("the locale proxy leaves exactly the OIDC protocol paths alone", () => {
  for (const p of ["/account/.well-known/openid-configuration", "/account/oidc/jwks", "/account/oidc/token", "/account/oidc/device/approve"]) assert.equal(isOidcProtocolPath(p), true, p);
  for (const p of ["/account", "/account/login", "/cs/account/oidc/token", "/account/oidcx", "/account/.well-known", "/api/office/link/start"]) assert.equal(isOidcProtocolPath(p), false, p);
});
