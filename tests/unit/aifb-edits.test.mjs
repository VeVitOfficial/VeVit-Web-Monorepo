import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ROOT_PATH, applyEdits, applyUnit, listUnits, parsePath, unitOmit, unitValue, unitValueErrors,
} from "../../src/lib/edu/aifb/edits.ts";
import { validateEditedDoc } from "../../src/lib/edu/aifb/edit-validate.ts";

const read = (name) => JSON.parse(readFileSync(new URL(`../../src/content/aifb/${name}`, import.meta.url), "utf8"));
const schema = read("aifb-content.schema.json");
const zs1 = read("aifb-content-zs1.json");
const kurz = read("aifb-kurz.json");
const theory = read("aifb-theory.json");
const pilots = read("pupil-pilots.json");
const levelIds = ["zs1", "zs2", "ss"].flatMap((id) => read(`aifb-content-${id}.json`).levels.map((level) => level.id));
const context = { schema, levelIds };

test("cesty: kořen, klíče a prvky pole podle id", () => {
  assert.deepEqual(parsePath(ROOT_PATH), []);
  assert.deepEqual(parsePath("levels/[zs1-blok-a]/lessons/[zs1-blok-a-cv1]"), [{ key: "levels" }, { id: "zs1-blok-a" }, { key: "lessons" }, { id: "zs1-blok-a-cv1" }]);
  assert.equal(parsePath("levels/[Zs1]"), null);
  assert.equal(parsePath("levels/../x"), null);
  assert.equal(parsePath("__proto__/x").length, 2, "klíč projde parserem, ale není upravitelná jednotka");
  assert.equal(unitOmit("zs1", "__proto__/x"), null);
  // Klíč z prototypu není část obsahu.
  assert.match(unitValueErrors("theory", theory, "topics/__proto__", {})[0], /neexistuje/);
  assert.match(unitValueErrors("theory", theory, "topics/constructor", {})[0], /neexistuje/);
});

test("upravitelné jednotky a vynechané části", () => {
  assert.deepEqual(unitOmit("zs1", "levels/[zs1-blok-a]"), ["lessons"]);
  assert.deepEqual(unitOmit("zs1", "levels/[zs1-blok-a]/lessons/[zs1-blok-a-cv1]"), []);
  assert.deepEqual(unitOmit("kurz", ROOT_PATH), ["modules"]);
  assert.deepEqual(unitOmit("theory", "topics/foundation"), []);
  assert.equal(unitOmit("zs1", ROOT_PATH), null, "celý soubor kategorie najednou upravit nejde");
  assert.equal(unitOmit("pilots", "lessons/zs1-blok-a-cv1/config"), null);
  const units = listUnits("zs1", zs1);
  assert.equal(units.filter((unit) => unit.depth === 2).length, 24, "4 bloky × 6 lekcí");
  assert.ok(units.some((unit) => unit.path === "guide/[g1]"));
  assert.equal(listUnits("kurz", kurz).filter((unit) => unit.path.includes("/lessons/")).length, 24);
});

test("úprava lekce mění jen tu lekci a nemění vstup", () => {
  const path = "levels/[zs1-blok-a]/lessons/[zs1-blok-a-cv1]";
  const value = { ...unitValue("zs1", zs1, path), title: "Nový název" };
  const before = JSON.stringify(zs1);
  const next = applyUnit("zs1", zs1, path, value);
  assert.equal(JSON.stringify(zs1), before, "původní obsah zůstává (R6)");
  assert.equal(next.levels[0].lessons[1].title, "Nový název");
  assert.equal(next.levels[1], zs1.levels[1], "ostatní části se sdílí");
  assert.deepEqual(validateEditedDoc("zs1", next, context), []);
});

test("úprava levelu zachová jeho lekce a lekce se skládá navrch", () => {
  const levelPath = "levels/[zs1-blok-b]";
  const lessonPath = "levels/[zs1-blok-b]/lessons/[zs1-blok-b-cv2]";
  const levelValue = unitValue("zs1", zs1, levelPath);
  assert.equal("lessons" in levelValue, false);
  const lessonValue = { ...unitValue("zs1", zs1, lessonPath), title: "Lekce upravená" };
  // Pořadí v databázi nerozhoduje: nejdřív level, potom lekce.
  const next = applyEdits("zs1", zs1, [
    { path: lessonPath, value: lessonValue },
    { path: levelPath, value: { ...levelValue, title: "Blok upravený" } },
  ]);
  const level = next.levels.find((item) => item.id === "zs1-blok-b");
  assert.equal(level.title, "Blok upravený");
  assert.equal(level.lessons.length, 6);
  assert.equal(level.lessons[2].title, "Lekce upravená");
});

test("neplatné úpravy: změna id, vynechaná část, neexistující cesta", () => {
  const path = "levels/[zs1-blok-a]";
  const value = unitValue("zs1", zs1, path);
  assert.match(unitValueErrors("zs1", zs1, path, { ...value, id: "zs1-blok-x" })[0], /id se nesmí měnit/);
  assert.match(unitValueErrors("zs1", zs1, path, { ...value, lessons: [] })[0], /upravuje zvlášť/);
  assert.match(unitValueErrors("zs1", zs1, "levels/[zs1-blok-z]", value)[0], /neexistuje/);
  assert.match(unitValueErrors("zs1", zs1, path, "text")[0], /objekt/);
  // Neplatná uložená úprava se při skládání přeskočí (stránky dál fungují).
  assert.equal(applyEdits("zs1", zs1, [{ path, value: { ...value, id: "jine" } }]), zs1);
  assert.equal(applyEdits("zs1", zs1, [{ path: "levels/[neni]", value }]), zs1);
});

test("validace celého dokumentu po úpravě odhalí chyby", () => {
  const path = "levels/[zs1-blok-a]";
  const value = unitValue("zs1", zs1, path);
  const badCert = applyUnit("zs1", zs1, path, { ...value, certification: { ...value.certification, status: "issued" } });
  assert.ok(validateEditedDoc("zs1", badCert, context).some((error) => /certifikace/.test(error) || /planned/.test(error)));
  const empty = applyUnit("zs1", zs1, path, { ...value, title: 5 });
  assert.ok(validateEditedDoc("zs1", empty, context).length > 0);
  const lessonPath = "modules/[kurz-m1]/lessons/[kurz-m1-cv1]";
  const noSteps = applyUnit("kurz", kurz, lessonPath, { ...unitValue("kurz", kurz, lessonPath), steps: [] });
  assert.ok(validateEditedDoc("kurz", noSteps, context).some((error) => /postup/.test(error)));
});

test("admin schválí kurz, teorii i pilotní cvičení změnou stavu", () => {
  const course = applyUnit("kurz", kurz, ROOT_PATH, { ...unitValue("kurz", kurz, ROOT_PATH), status: "reviewed" });
  assert.equal(course.status, "reviewed");
  assert.equal(course.modules.length, kurz.modules.length);
  assert.deepEqual(validateEditedDoc("kurz", course, context), []);
  const theoryDoc = applyUnit("theory", theory, ROOT_PATH, { ...unitValue("theory", theory, ROOT_PATH), status: "reviewed" });
  assert.deepEqual(validateEditedDoc("theory", theoryDoc, context), []);
  const pilotPath = "lessons/zs1-blok-a-cv1";
  const pilotDoc = applyUnit("pilots", pilots, pilotPath, { ...unitValue("pilots", pilots, pilotPath), status: "reviewed" });
  assert.deepEqual(validateEditedDoc("pilots", pilotDoc, context), []);
  const aiInZs1 = applyUnit("pilots", pilots, pilotPath, { ...unitValue("pilots", pilots, pilotPath), component: "AiSandbox", config: { mode: "fact-check", topicLabel: "x" } });
  assert.ok(validateEditedDoc("pilots", aiInZs1, context).some((error) => /R1/.test(error)));
});
