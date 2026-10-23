import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { courseTotals, findCourseLesson, findModule, moduleLessonIds, moduleSlug, validateCourse } from "../../src/lib/edu/aifb/course.ts";
import { computeXp, lessonIdsForLevel, parseProgress } from "../../src/lib/edu/aifb/progress.ts";
import { readingMinutes } from "../../src/lib/edu/aifb/theory.ts";

const course = JSON.parse(readFileSync(new URL("../../src/content/aifb/aifb-kurz.json", import.meta.url), "utf8"));

test("online kurz je platný a zůstává návrhem (R7)", () => {
  assert.deepEqual(validateCourse(course), []);
  assert.equal(course.status, "draft");
});

test("kurz bere z každé kategorie (1. stupeň, 2. stupeň, SŠ)", () => {
  const sources = new Set(course.modules.flatMap((mod) => mod.sources));
  assert.deepEqual([...sources].sort(), ["ss", "zs1", "zs2"]);
  assert.deepEqual(courseTotals(course).modules, 6);
});

test("každý modul má obsáhlou teorii s ilustrací a lekce s postupem", () => {
  for (const mod of course.modules) {
    assert.ok(mod.theory.sections.length >= 4, `${mod.id}: aspoň 4 sekce`);
    assert.ok(mod.theory.sections.some((s) => s.blocks.some((b) => b.type === "figure")), `${mod.id}: ilustrace`);
    assert.ok(readingMinutes(mod.theory) >= 3, `${mod.id}: obsáhlý text`);
    assert.ok(mod.lessons.length >= 3 && mod.lessons.length <= 5, `${mod.id}: 3–5 lekcí`);
    assert.ok(mod.lessons.some((lesson) => lesson.activity), `${mod.id}: aspoň jedno cvičení na stránce`);
  }
});

test("kurz nepoužívá cvičení s AI (bez účtu, pro všechny věkové skupiny)", () => {
  const components = course.modules.flatMap((mod) => mod.lessons.map((lesson) => lesson.activity?.component).filter(Boolean));
  assert.ok(!components.includes("AiSandbox"));
});

test("adresy a hledání modulu a lekce", () => {
  const mod = findModule(course, "m2");
  assert.equal(mod.id, "kurz-m2");
  assert.equal(moduleSlug(mod.id), "m2");
  assert.equal(findCourseLesson(mod, "cv3").id, "kurz-m2-cv3");
  assert.equal(findModule(course, "m99"), undefined);
  assert.equal(findCourseLesson(mod, "teorie"), undefined);
});

test("průběh kurzu: id projdou importem a XP se počítá stejně jako u levelů", () => {
  const mod = course.modules[0];
  const ids = moduleLessonIds(mod);
  assert.deepEqual(ids, lessonIdsForLevel(mod.id, ids.length));
  const lessons = Object.fromEntries(ids.map((id) => [id, { status: "done", at: "2026-10-23T10:00:00.000Z" }]));
  const progress = parseProgress(JSON.stringify({ version: 1, lessons }));
  assert.equal(Object.keys(progress.lessons).length, ids.length);
  assert.ok(computeXp(progress, [{ lessonIds: ids }]) > 0);
});

test("validace kurzu odhalí chyby", () => {
  const broken = structuredClone(course);
  broken.modules[0].lessons[1].order = 7;
  broken.modules[1].lessons[0].activity = { component: "AiSandbox", config: { mode: "fact-check", topicLabel: "x" } };
  broken.modules[2].lessons[2].activity.config.questions = [];
  broken.modules[3].goals = [];
  broken.modules[4].theory.sections[0].blocks.push({ type: "figure", figure: "neexistuje", caption: "x" });
  const errors = validateCourse(broken).join("\n");
  assert.match(errors, /kurz-m1-cv2: id nebo pořadí/);
  assert.match(errors, /kurz-m2-cv1: kurz nepoužívá cvičení s AI/);
  assert.match(errors, /kurz-m3-cv3: questions/);
  assert.match(errors, /kurz-m4: cíle/);
  assert.match(errors, /neznámý obrázek "neexistuje"/);
});
