import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assignmentState, compareStudents, formatSchoolCode, fullName, normalizePersonName, normalizeSchoolClassName,
  normalizeSchoolCode, schoolGroupPath, schoolHome, schoolJoinPath,
} from "../../src/lib/edu/school/school.ts";

const migration = readFileSync(new URL("../../supabase/sql/account/029_edu_schools.sql", import.meta.url), "utf8");

test("kód školy: stejný tvar jako dřív kód třídy (8 znaků bez 0/O/1/I)", () => {
  assert.equal(normalizeSchoolCode("abcd-2345"), "ABCD2345");
  assert.equal(normalizeSchoolCode(" ABCD 2345 "), "ABCD2345");
  assert.equal(normalizeSchoolCode("ABCD-0345"), null);
  assert.equal(normalizeSchoolCode("ABC"), null);
  assert.equal(normalizeSchoolCode(42), null);
  assert.equal(formatSchoolCode("ABCD2345"), "ABCD-2345");
});

test("jméno a příjmení žáka: písmena s diakritikou, mezera, pomlčka; nic jiného", () => {
  assert.equal(normalizePersonName("  Jan  "), "Jan");
  assert.equal(normalizePersonName("Anna-Marie"), "Anna-Marie");
  assert.equal(normalizePersonName("Šárka   Nováková"), "Šárka Nováková");
  assert.equal(normalizePersonName("O'Neil"), "O'Neil");
  assert.equal(normalizePersonName(""), null);
  assert.equal(normalizePersonName("Jan2"), null);
  assert.equal(normalizePersonName("<script>"), null);
  assert.equal(normalizePersonName("-Jan"), null);
  assert.equal(normalizePersonName("a".repeat(61)), null);
});

test("název kmenové třídy: 1–20 znaků", () => {
  assert.equal(normalizeSchoolClassName(" 7.A "), "7.A");
  assert.equal(normalizeSchoolClassName(""), null);
  assert.equal(normalizeSchoolClassName("x".repeat(21)), null);
});

test("žáci se řadí podle příjmení, potom jména (česky)", () => {
  const list = [
    { firstName: "Petr", lastName: "Čech" },
    { firstName: "Adam", lastName: "Černý" },
    { firstName: "Eva", lastName: "Cibulková" },
    { firstName: "Adam", lastName: "Čech" },
  ].sort(compareStudents);
  assert.deepEqual(list.map(fullName), ["Eva Cibulková", "Adam Čech", "Petr Čech", "Adam Černý"]);
});

test("stav úkolu: hotovo > po termínu > čeká", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  assert.equal(assignmentState(true, "2026-11-01T00:00:00Z", now), "done");
  assert.equal(assignmentState(false, "2026-11-01T00:00:00Z", now), "late");
  assert.equal(assignmentState(false, "2026-11-20T00:00:00Z", now), "open");
  assert.equal(assignmentState(false, null, now), "open");
});

test("adresy portálu jsou pod /<locale>/edu/school", () => {
  assert.equal(schoolHome("cs"), "/cs/edu/school");
  assert.equal(schoolGroupPath("cs", "abc"), "/cs/edu/school/tridy/abc");
  assert.equal(schoolJoinPath("cs"), "/cs/edu/skoly#skola");
});

test("migrace 029: rank správce, zdroj 'school' a tabulky jen pro server", () => {
  assert.match(migration, /\('school_admin', 'program'[^)]*'\{edu\.school\.admin\}'\)/);
  assert.match(migration, /check \(source in \('manual', 'migration', 'class', 'school'\)\)/);
  for (const table of ["edu_schools", "edu_school_admins", "edu_school_teachers", "edu_school_classes", "edu_school_class_teachers", "edu_school_students", "edu_class_assignments", "edu_lesson_progress"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), table);
    assert.match(migration, new RegExp(`public\\.${table}[,\\s]`), table);
  }
  assert.match(migration, /from anon, authenticated;/);
  assert.doesNotMatch(migration, /grant [^;]* to (anon|authenticated)/);
});
