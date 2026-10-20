import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BRAND_LOGOS, CARD_BANKS, bankForDigits, prefixesOf } from "../../src/lib/payments/card-banks.ts";

test("known czech prefixes", () => {
  assert.equal(bankForDigits("4140920000000002")?.key, "cs");
  assert.equal(bankForDigits("5428124210069366")?.key, "uc");
  assert.equal(bankForDigits("5168440000000005")?.key, "airbank");
  assert.equal(bankForDigits("41409"), null);
  assert.equal(bankForDigits("4000000000000002"), null);
});

test("no prefix belongs to two banks", () => {
  const seen = new Map();
  for (const bank of Object.values(CARD_BANKS)) for (const p of prefixesOf(bank.key)) {
    assert.equal(seen.has(p), false, `${p} in ${seen.get(p)} and ${bank.key}`);
    seen.set(p, bank.key);
  }
});

test("prefixes disputed between sources are not in the table", () => {
  assert.equal(bankForDigits("4188090000000000"), null);
  assert.equal(bankForDigits("4084750000000000"), null);
});

test("every logo file exists", () => {
  const logos = [...Object.values(CARD_BANKS).map((b) => b.logo), ...Object.values(BRAND_LOGOS)];
  for (const logo of logos) {
    const file = path.join("public", logo);
    assert.ok(fs.existsSync(file), logo);
    assert.match(fs.readFileSync(file, "utf8"), /^<svg[\s\S]*<\/svg>\s*$/, `${logo} is not a complete svg`);
  }
});
