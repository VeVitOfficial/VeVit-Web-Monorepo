import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rateLimitArgsValid, rateLimitKey } from "../../src/lib/rate-limit-core.ts";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("klíč limitu je stabilní hash a odděluje scope i identitu", () => {
  assert.equal(rateLimitKey("login", "1.2.3.4"), rateLimitKey("login", "1.2.3.4"));
  assert.notEqual(rateLimitKey("login", "1.2.3.4"), rateLimitKey("register", "1.2.3.4"));
  assert.notEqual(rateLimitKey("login", "1.2.3.4"), rateLimitKey("login", "1.2.3.5"));
  assert.match(rateLimitKey("a", "b"), /^[0-9a-f]{64}$/);
  // scope a identita se nesmí dát sloučit (a|bc vs ab|c)
  assert.notEqual(rateLimitKey("ab", "c"), rateLimitKey("a", "bc"));
});

test("neplatná konfigurace limitu se k databázi nedostane (fail closed)", () => {
  assert.equal(rateLimitArgsValid("login", "1.2.3.4", 10, 900), true);
  assert.equal(rateLimitArgsValid("BAD SCOPE", "x", 10, 900), false);
  assert.equal(rateLimitArgsValid("", "x", 10, 900), false);
  assert.equal(rateLimitArgsValid("login", "", 10, 900), false);
  assert.equal(rateLimitArgsValid("login", "x", 0, 900), false);
  assert.equal(rateLimitArgsValid("login", "x", 1.5, 900), false);
  assert.equal(rateLimitArgsValid("login", "x", 10, 0), false);
  assert.equal(rateLimitArgsValid("login", "x", 10, 86401), false);
});

test("všechny limitery jdou přes atomický čítač, žádné čtení-pak-zápis", () => {
  for (const file of ["src/lib/account-auth.ts", "src/lib/store-ratelimit.ts", "src/lib/tools-rate-limit.ts"]) {
    assert.match(read(file), /consumeRateLimit/, file);
  }
  const auth = read("src/lib/account-auth.ts");
  const check = auth.slice(auth.indexOf("export async function checkRateLimit"), auth.indexOf("export async function recordAttempt"));
  assert.doesNotMatch(check, /count: "exact"/, "checkRateLimit nesmí počítat řádky (race)");
  assert.doesNotMatch(check, /fail open|return true; \/\//i, "checkRateLimit nesmí selhat otevřeně");
  const ident = auth.slice(auth.indexOf("export async function identifierAllowed"), auth.indexOf("export async function recordIdentifierFailure"));
  assert.doesNotMatch(ident, /count: "exact"/);
  assert.doesNotMatch(ident, /return true;/, "identifierAllowed nesmí selhat otevřeně");
  assert.doesNotMatch(read("src/lib/store-ratelimit.ts"), /storeRest|merge-duplicates/);
});

test("drahé a citlivé endpointy mají sdílený limit", () => {
  const needs = {
    "src/app/account/api/login.php/route.ts": /checkRateLimit/,
    "src/app/account/api/register.php/route.ts": /checkRateLimit/,
    "src/app/account/api/forgot-password.php/route.ts": /checkRateLimit/,
    "src/app/account/api/reset-password.php/route.ts": /checkRateLimit/,
    "src/app/account/api/change-password.php/route.ts": /consumeRateLimit/,
    "src/app/account/api/delete-account.php/route.ts": /consumeRateLimit/,
    "src/app/account/api/oauth/start.php/route.ts": /consumeRateLimit/,
    "src/app/edu/php/ai-proxy.php/route.ts": /toolsRateLimit/,
    "src/app/tools/api/ai/[tool]/route.ts": /toolsRateLimit/,
    "src/app/tools/api/screenshot/route.ts": /toolsRateLimit/,
    "src/app/tools/api/ssl-check.php/route.ts": /toolsRateLimit/,
    "src/app/api/tools/html-to-pdf/route.ts": /toolsRateLimit/,
  };
  for (const [file, re] of Object.entries(needs)) assert.match(read(file), re, file);
  assert.doesNotMatch(read("src/app/api/tools/html-to-pdf/route.ts"), /new Map<string, number\[\]>/, "limit v paměti jedné instance jde obejít");
});
