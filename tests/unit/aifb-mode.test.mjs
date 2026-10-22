import test from "node:test";
import assert from "node:assert/strict";
import { parseMode, pupilVisible, withMode } from "../../src/lib/edu/aifb/mode.ts";

test("režim lekce se čte z URL, neznámé hodnoty padají na učitele", () => {
  assert.equal(parseMode("projekce"), "projekce");
  assert.equal(parseMode("zak"), "zak");
  assert.equal(parseMode(["projekce", "zak"]), "projekce");
  assert.equal(parseMode("nesmysl"), "ucitel");
  assert.equal(parseMode(undefined), "ucitel");
});

test("výchozí režim zůstává bez parametru", () => {
  assert.equal(withMode("/a/b", "ucitel"), "/a/b");
  assert.equal(withMode("/a/b", "projekce"), "/a/b?rezim=projekce");
});

test("žákovský text se zobrazí jen po schválení (R7)", () => {
  assert.equal(pupilVisible({ status: "todo" }), false);
  assert.equal(pupilVisible({ status: "draft", text: ["a"] }), false);
  assert.equal(pupilVisible({ status: "reviewed", text: [] }), false);
  assert.equal(pupilVisible({ status: "reviewed", text: ["a"] }), true);
  assert.equal(pupilVisible({ status: "published", text: ["a"] }), true);
});
