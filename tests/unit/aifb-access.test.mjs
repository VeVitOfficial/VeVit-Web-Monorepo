import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  PUBLIC_ACCESS, canOpenCategory, formatClassCode, generateClassCode, isAifbLessonId, isStaff, lessonUnlocked,
  normalizeClassCode, parseTestRole, roleFromPermissions, seesLevels, unlockedCount, visibleCategories,
} from "../../src/lib/edu/aifb/access.ts";

const migration = readFileSync(new URL("../../supabase/sql/account/025_edu_classes_aifb.sql", import.meta.url), "utf8");

const student = (category, unlocked) => ({ role: "student", classes: [{ id: "c1", name: "6.A", category }], unlocked: new Set(unlocked) });

test("role z oprávnění: admin > učitel > student > veřejnost", () => {
  assert.equal(roleFromPermissions(["*"]), "admin");
  assert.equal(roleFromPermissions(["edu.aifb.teacher", "edu.aifb.student"]), "teacher");
  assert.equal(roleFromPermissions(["comments.post", "edu.aifb.student"]), "student");
  assert.equal(roleFromPermissions(["comments.post", "edu.premium_all"]), "public");
  assert.equal(roleFromPermissions([]), "public");
});

test("oprávnění ranků v migraci odpovídají kódu", () => {
  assert.match(migration, /\('student', 'program'[^)]*'\{edu\.aifb\.student\}'\)/);
  assert.match(migration, /\('teacher', 'program'[^)]*'\{edu\.aifb\.teacher\}'\)/);
});

test("veřejnost nevidí levely, jen online kurz", () => {
  assert.equal(seesLevels(PUBLIC_ACCESS), false);
  assert.deepEqual(visibleCategories(PUBLIC_ACCESS), []);
  assert.equal(lessonUnlocked(PUBLIC_ACCESS, "zs1-blok-a-teorie"), false);
  assert.equal(canOpenCategory(PUBLIC_ACCESS, "zs1"), false);
});

test("učitel a admin vidí všechny kategorie a lekce", () => {
  for (const role of ["teacher", "admin"]) {
    const access = { role, classes: [], unlocked: new Set() };
    assert.equal(isStaff(access), true);
    assert.deepEqual(visibleCategories(access), ["zs1", "zs2", "ss"]);
    assert.equal(lessonUnlocked(access, "ss-level-6-cv5"), true);
  }
});

test("student vidí jen kategorii své třídy a jen odemčené lekce", () => {
  const access = student("zs2", ["zs2-level-1-teorie", "zs2-level-1-cv2", "zs1-blok-a-cv1"]);
  assert.equal(isStaff(access), false);
  assert.deepEqual(visibleCategories(access), ["zs2"]);
  assert.equal(canOpenCategory(access, "zs2"), true);
  assert.equal(canOpenCategory(access, "zs1"), false);
  assert.equal(canOpenCategory(access, "kurz"), false);
  assert.equal(lessonUnlocked(access, "zs2-level-1-cv2"), true);
  assert.equal(lessonUnlocked(access, "zs2-level-1-cv1"), false);
  // Odemčení v kategorii, kde žák nemá třídu, se nepočítá.
  assert.equal(lessonUnlocked(access, "zs1-blok-a-cv1"), false);
  assert.equal(unlockedCount(access, ["zs2-level-1-teorie", "zs2-level-1-cv1", "zs2-level-1-cv2"]), 2);
});

test("student bez třídy nevidí žádnou kategorii", () => {
  const access = { role: "student", classes: [], unlocked: new Set(["zs1-blok-a-cv1"]) };
  assert.equal(seesLevels(access), true);
  assert.deepEqual(visibleCategories(access), []);
  assert.equal(lessonUnlocked(access, "zs1-blok-a-cv1"), false);
});

test("kód třídy: 8 znaků bez zaměnitelných, normalizace vstupu", () => {
  let i = 0;
  const code = generateClassCode((max) => i++ % max);
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  for (let n = 0; n < 200; n++) assert.match(generateClassCode((max) => Math.floor(Math.random() * max)), /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(normalizeClassCode(" abcd-2345 "), "ABCD2345");
  assert.equal(normalizeClassCode("ABCD 2345"), "ABCD2345");
  assert.equal(normalizeClassCode("ABCD1234"), null, "1 není v abecedě");
  assert.equal(normalizeClassCode("ABCO2345"), null, "O není v abecedě");
  assert.equal(normalizeClassCode("ABC2345"), null);
  assert.equal(normalizeClassCode(12345678), null);
  assert.equal(formatClassCode("ABCD2345"), "ABCD-2345");
  // Stejná kontrola jako v databázi.
  assert.match(migration, /code ~ '\^\[A-HJ-NP-Z2-9\]\{8\}\$'/);
});

test("id lekcí pro odemčení: jen AIFB teorie a cvičení", () => {
  assert.equal(isAifbLessonId("zs1-blok-a-teorie"), true);
  assert.equal(isAifbLessonId("ss-level-3-cv5"), true);
  assert.equal(isAifbLessonId("kurz-m1-cv1"), false);
  assert.equal(isAifbLessonId("zs2-level-1-cv6"), false);
  assert.equal(isAifbLessonId("zs2-level-1-cv1'; drop"), false);
});

test("testovací role z cookie", () => {
  assert.equal(parseTestRole(undefined), null);
  assert.equal(parseTestRole("owner"), null);
  assert.equal(parseTestRole("admin").role, "admin");
  assert.equal(parseTestRole("public").role, "public");
  const access = parseTestRole("student:zs1:zs1-blok-a-teorie,zs1-blok-a-cv1,zs2-level-1-cv1,bad");
  assert.equal(access.role, "student");
  assert.deepEqual(visibleCategories(access), ["zs1"]);
  assert.deepEqual([...access.unlocked], ["zs1-blok-a-teorie", "zs1-blok-a-cv1"]);
  assert.equal(parseTestRole("student:kurz:"), null);
  assert.deepEqual(parseTestRole("student").classes, []);
});
