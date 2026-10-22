import test from "node:test";
import assert from "node:assert/strict";
import {
  computeXp, emptyProgress, lessonIdsForLevel, levelProgress, parseProgress, serializeProgress, setLessonStatus,
} from "../../src/lib/edu/aifb/progress.ts";
import { gemsFromXp, maxXpForLevel } from "../../src/lib/edu/aifb/xp.ts";

const LEVEL = "zs1-blok-a";
const ids = lessonIdsForLevel(LEVEL, 6);

test("id lekcí levelu odpovídají obsahu (teorie + cv1–cv5)", () => {
  assert.deepEqual(ids, ["zs1-blok-a-teorie", "zs1-blok-a-cv1", "zs1-blok-a-cv2", "zs1-blok-a-cv3", "zs1-blok-a-cv4", "zs1-blok-a-cv5"]);
});

test("změna stavu nemění původní objekt a lze ji vrátit", () => {
  const a = emptyProgress();
  const b = setLessonStatus(a, ids[0], "done", "2026-10-22T10:00:00.000Z");
  assert.deepEqual(a.lessons, {});
  assert.equal(b.lessons[ids[0]].status, "done");
  assert.deepEqual(setLessonStatus(b, ids[0], null).lessons, {});
});

test("XP: teorie 25, cvičení 40, bonus 60 za celý level", () => {
  let p = emptyProgress();
  p = setLessonStatus(p, ids[0], "done");
  assert.equal(computeXp(p, [{ lessonIds: ids }]), 25);
  p = setLessonStatus(p, ids[1], "done");
  assert.equal(computeXp(p, [{ lessonIds: ids }]), 65);
  p = setLessonStatus(p, ids[1], "started");
  assert.equal(computeXp(p, [{ lessonIds: ids }]), 25);
  for (const id of ids) p = setLessonStatus(p, id, "done");
  assert.equal(computeXp(p, [{ lessonIds: ids }]), maxXpForLevel(["theory", "exercise", "exercise", "exercise", "exercise", "exercise"]));
  assert.equal(maxXpForLevel(["theory", "exercise", "exercise", "exercise", "exercise", "exercise"]), 285);
  assert.deepEqual(levelProgress(p, ids), { done: 6, total: 6 });
  assert.equal(gemsFromXp(285), 28);
});

test("export a import: round trip a čisté výsledky", () => {
  const p = setLessonStatus(emptyProgress(), ids[2], "done", "2026-10-22T10:00:00.000Z");
  const text = serializeProgress(p);
  assert.deepEqual(parseProgress(text), p);
  assert.ok(!/@|email|jmeno|name/i.test(text), "export neobsahuje osobní údaje");
});

test("import zahodí neplatné záznamy a nebezpečné klíče", () => {
  const evil = JSON.stringify({
    version: 1,
    lessons: {
      "__proto__": { status: "done", at: "2026-10-22T10:00:00.000Z" },
      "constructor": { status: "done", at: "2026-10-22T10:00:00.000Z" },
      "zs1-blok-a-cv1": { status: "done", at: "2026-10-22T10:00:00.000Z" },
      "zs1-blok-a-cv9": { status: "done", at: "2026-10-22T10:00:00.000Z" },
      "ss-level-1-cv2": { status: "hotovo", at: "2026-10-22T10:00:00.000Z" },
      "ss-level-1-cv3": { status: "done", at: "ne datum" },
      "jmeno@example.com": { status: "done", at: "2026-10-22T10:00:00.000Z" },
    },
  });
  const parsed = parseProgress(evil);
  assert.deepEqual(Object.keys(parsed.lessons), ["zs1-blok-a-cv1"]);
  assert.equal(({}).polluted, undefined);
});

test("neplatné vstupy vrací null", () => {
  assert.equal(parseProgress(""), null);
  assert.equal(parseProgress("not json"), null);
  assert.equal(parseProgress(JSON.stringify({ version: 2, lessons: {} })), null);
  assert.equal(parseProgress(JSON.stringify({ version: 1, lessons: [] })), null);
  assert.equal(parseProgress("x".repeat(300_000)), null);
});
