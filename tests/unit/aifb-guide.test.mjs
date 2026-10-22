import test from "node:test";
import assert from "node:assert/strict";
import { DATA_PROTECTION_ANCHOR, formatBytes, showsDataProtection } from "../../src/lib/edu/aifb/guide.ts";
import { validateAifb } from "../../scripts/aifb-validate.mjs";

test("upozornění na ochranu údajů se ukazuje jen u cvičení s AI", () => {
  assert.equal(showsDataProtection("zs1", "zs1-blok-a", "exercise"), false);
  assert.equal(showsDataProtection("zs1", "zs1-blok-b", "exercise"), false);
  assert.equal(showsDataProtection("zs1", "zs1-blok-c", "exercise"), true);
  assert.equal(showsDataProtection("zs1", "zs1-blok-d", "theory"), false);
  assert.equal(showsDataProtection("zs2", "zs2-level-1", "exercise"), true);
  assert.equal(showsDataProtection("ss", "ss-level-6", "exercise"), true);
  assert.deepEqual(Object.keys(DATA_PROTECTION_ANCHOR).sort(), ["ss", "zs1", "zs2"]);
});

test("velikost souboru se formátuje česky", () => {
  assert.equal(formatBytes(52253), "51 kB");
  assert.equal(formatBytes(2_500_000), "2,4 MB");
  assert.equal(formatBytes(10), "1 kB");
});

test("soubor ke stažení, který neexistuje nebo má jinou velikost, shodí validaci", () => {
  const { errors } = validateAifb(undefined, "/nonexistent-public-dir");
  assert.ok(errors.some((e) => e.includes("downloads.json") && e.includes("neexistuje")));
});
