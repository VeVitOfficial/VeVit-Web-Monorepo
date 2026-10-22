import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAifb } from "../../scripts/aifb-validate.mjs";
import { lessonSlug, levelSlug } from "../../src/lib/edu/aifb/routes.ts";

const contentDir = new URL("../../src/content/aifb/", import.meta.url).pathname;

test("obsah AIFB je platný: 3 kategorie, 16 levelů, 96 lekcí", () => {
  const { errors, summary } = validateAifb(contentDir);
  assert.deepEqual(errors, []);
  assert.deepEqual(summary, { categories: 3, levels: 16, lessons: 96 });
});

function mutated(edit) {
  const dir = mkdtempSync(join(tmpdir(), "aifb-"));
  cpSync(contentDir, dir, { recursive: true });
  edit(dir);
  return validateAifb(dir).errors;
}

test("změna id lekce shodí validaci", () => {
  const errors = mutated((dir) => {
    const file = join(dir, "aifb-content-zs1.json");
    writeFileSync(file, readFileSync(file, "utf8").replace('"zs1-blok-a-cv3"', '"zs1-blok-a-cv9"'));
  });
  assert.ok(errors.some((e) => e.includes("zs1-blok-a-cv9")));
});

test("odebrání lekce shodí validaci počtu", () => {
  const errors = mutated((dir) => {
    const file = join(dir, "aifb-content-ss.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    data.levels[0].lessons.pop();
    writeFileSync(file, JSON.stringify(data));
  });
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.includes("96")));
});

test("odkaz na neexistující oddíl shodí validaci", () => {
  const errors = mutated((dir) => {
    const file = join(dir, "aifb-content-zs2.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    data.levels[0].teacherNotes.push("Podrobnosti v oddíle 99.9.");
    writeFileSync(file, JSON.stringify(data));
  });
  assert.ok(errors.some((e) => e.includes("99.9")));
});

test("certifikace s jiným stavem než planned je chyba", () => {
  const errors = mutated((dir) => {
    const file = join(dir, "aifb-content-ss.json");
    const data = JSON.parse(readFileSync(file, "utf8"));
    data.levels[0].certification.status = "issued";
    writeFileSync(file, JSON.stringify(data));
  });
  assert.ok(errors.length > 0);
});

test("segmenty URL se odvozují z id a jsou jednoznačné", () => {
  assert.equal(levelSlug("zs1", "zs1-blok-a"), "blok-a");
  assert.equal(levelSlug("zs2", "zs2-level-3"), "level-3");
  assert.equal(lessonSlug("zs1-blok-a", "zs1-blok-a-cv3"), "cv3");
  assert.equal(lessonSlug("ss-level-1", "ss-level-1-teorie"), "teorie");
});
