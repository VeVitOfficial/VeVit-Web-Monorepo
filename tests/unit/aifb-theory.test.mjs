import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FIGURE_IDS, readingMinutes, resolveTheory, validateTheory } from "../../src/lib/edu/aifb/theory.ts";
import { pupilVisible } from "../../src/lib/edu/aifb/pupil.ts";

const file = JSON.parse(readFileSync(new URL("../../src/content/aifb/aifb-theory.json", import.meta.url), "utf8"));
const levelIds = [
  "zs1-blok-a", "zs1-blok-b", "zs1-blok-c", "zs1-blok-d",
  ...[1, 2, 3, 4, 5, 6].map((n) => `zs2-level-${n}`),
  ...[1, 2, 3, 4, 5, 6].map((n) => `ss-level-${n}`),
];

test("každý blok a level má platnou teorii", () => {
  assert.deepEqual(validateTheory(file, levelIds), []);
  for (const id of levelIds) {
    const theory = resolveTheory(file, id);
    assert.ok(theory, id);
    assert.ok(theory.sections.length >= 5, `${id}: aspoň 5 sekcí`);
    assert.ok(theory.sections.some((s) => s.blocks.some((b) => b.type === "figure")), `${id}: aspoň jedna ilustrace`);
    assert.ok(readingMinutes(theory) >= 2, `${id}: obsáhlý text`);
  }
});

test("SŠ má k společnému tématu sekce navíc", () => {
  const zs2 = resolveTheory(file, "zs2-level-1");
  const ss = resolveTheory(file, "ss-level-1");
  assert.ok(ss.sections.length > zs2.sections.length);
});

test("všechny ilustrace v textu existují a každá se používá", () => {
  const used = new Set(Object.values(file.topics).flatMap((t) => t.sections.flatMap((s) => s.blocks.filter((b) => b.type === "figure").map((b) => b.figure))));
  assert.deepEqual([...used].sort(), [...FIGURE_IDS].sort());
});

test("validace odhalí chybějící teorii a neznámý obrázek", () => {
  const broken = structuredClone(file);
  delete broken.levels["zs1-blok-a"];
  broken.topics.foundation.sections[0].blocks.push({ type: "figure", figure: "neexistuje", caption: "x" });
  const errors = validateTheory(broken, levelIds);
  assert.ok(errors.some((e) => e.includes("zs1-blok-a")));
  assert.ok(errors.some((e) => e.includes("neexistuje")));
});

test("text teorie zachovává neoddělitelné mezery za jednopísmennými předložkami", () => {
  const text = JSON.stringify(file.topics["zs1-a"]);
  assert.ok(text.includes("v telefonu") || text.includes("v počítači"));
});

test("žákovský text z obsahu se zobrazí jen po schválení (R7)", () => {
  assert.equal(pupilVisible({ status: "todo" }), false);
  assert.equal(pupilVisible({ status: "draft", text: ["a"] }), false);
  assert.equal(pupilVisible({ status: "reviewed", text: ["a"] }), true);
});
