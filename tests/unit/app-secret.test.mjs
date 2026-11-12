import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveAppSecret } from "../../src/lib/app-secret-core.ts";

const SERVICE_KEY = "sb_secret_unit_test_value_0123456789";

test("nastavený VEVIT_APP_SECRET má přednost", () => {
  const r = resolveAppSecret({ VEVIT_APP_SECRET: "a".repeat(40), SUPABASE_SECRET_KEY: SERVICE_KEY }, "csrf");
  assert.equal(r.source, "VEVIT_APP_SECRET");
  assert.equal(r.weak, false);
});

test("krátký VEVIT_APP_SECRET je označen jako slabý", () => {
  assert.equal(resolveAppSecret({ VEVIT_APP_SECRET: "short" }, "csrf").weak, true);
});

test("bez VEVIT_APP_SECRET se klíč odvodí a service klíč se nikdy nepoužije přímo", () => {
  const csrf = resolveAppSecret({ SUPABASE_SECRET_KEY: SERVICE_KEY }, "csrf");
  const grant = resolveAppSecret({ SUPABASE_SECRET_KEY: SERVICE_KEY }, "store-grant");
  assert.equal(csrf.source, "derived");
  assert.notEqual(csrf.secret, SERVICE_KEY);
  assert.ok(!csrf.secret.includes(SERVICE_KEY));
  assert.notEqual(csrf.secret, grant.secret, "účely se nesmí dát zaměnit");
  assert.equal(csrf.secret, resolveAppSecret({ SUPABASE_SECRET_KEY: SERVICE_KEY }, "csrf").secret, "odvození je deterministické");
  assert.notEqual(csrf.secret, resolveAppSecret({ SUPABASE_SECRET_KEY: SERVICE_KEY + "x" }, "csrf").secret);
});

test("bez jakéhokoli tajemství se podepisování odmítne (žádný pevný fallback)", () => {
  assert.throws(() => resolveAppSecret({}, "csrf"), /not configured/);
  assert.throws(() => resolveAppSecret({ VEVIT_APP_SECRET: "  ", SUPABASE_SECRET_KEY: " " }, "csrf"));
});

test("kód už nepoužívá service klíč přímo ani pevný řetězec jako podpisový klíč", () => {
  const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
  assert.doesNotMatch(read("src/lib/account-session.ts"), /VEVIT_APP_SECRET\?\.trim\(\) \|\| key/);
  assert.doesNotMatch(read("src/lib/office/runtime.ts"), /\|\| "unset"/);
  assert.match(read("src/lib/store-guest-grants.ts"), /appSecret\("store-grant"\)/);
});
