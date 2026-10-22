import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectPersonalData } from "../../src/lib/edu/aifb/pii.ts";
import { validatePupilLayer } from "../../src/lib/edu/aifb/pupil.ts";
import { cardsLeft, misplacedCards, placeCard, quizScore, splitSentences, trafficCorrect } from "../../src/lib/edu/aifb/interactive-logic.ts";

test("kontrola osobních údajů: e-mail, telefon, rodné číslo, adresa stránky", () => {
  assert.equal(detectPersonalData("napiš mi na jan.novak@example.com"), "email");
  assert.equal(detectPersonalData("moje číslo je 777 123 456"), "phone");
  assert.equal(detectPersonalData("+420 777-123-456"), "phone");
  assert.equal(detectPersonalData("rodné číslo 010203/1234"), "birthNumber");
  assert.equal(detectPersonalData("podívej se na https://example.com/a"), "url");
  assert.equal(detectPersonalData("viz www.example.cz"), "url");
  assert.equal(detectPersonalData("Napiš něco o ekologii, nejvýše 120 slov, v roce 1348."), null);
  assert.equal(detectPersonalData(""), null);
});

test("třídění karet: zařazení, zbývající karty a volitelné správné odpovědi", () => {
  const config = { piles: [{ id: "a", label: "A" }, { id: "b", label: "B" }], cards: [{ id: "1", label: "1" }, { id: "2", label: "2" }], expected: { "1": "a", "2": "b" } };
  let p = {};
  assert.equal(cardsLeft(config, p), 2);
  p = placeCard(p, "1", "b");
  assert.equal(cardsLeft(config, p), 1);
  assert.deepEqual(misplacedCards(config, p), ["1"]);
  p = placeCard(p, "1", "a");
  assert.deepEqual(misplacedCards(config, p), []);
  assert.deepEqual(misplacedCards({ ...config, expected: undefined }, p), []);
  assert.deepEqual(placeCard(p, "1", null), {});
});

test("semafor a kvíz se hodnotí jen tam, kde je správná odpověď", () => {
  const traffic = { situations: [{ id: "s1", text: "a", answer: "red" }, { id: "s2", text: "b", answer: "green" }, { id: "s3", text: "c" }] };
  assert.deepEqual(trafficCorrect(traffic, { s1: "red", s2: "red", s3: "green" }), { answered: 3, graded: 2, correct: 1 });
  const quiz = { questions: [{ id: "q1", prompt: "?", options: [{ id: "a", text: "a" }, { id: "b", text: "b" }], correct: "b", explanation: "e" }] };
  assert.deepEqual(quizScore(quiz, { q1: "b" }), { answered: 1, correct: 1, total: 1 });
  assert.deepEqual(quizScore(quiz, { q1: "a" }), { answered: 1, correct: 0, total: 1 });
});

test("věty se dělí na tečkách a zachovají obsah", () => {
  assert.deepEqual(splitSentences("První věta. Druhá věta! Třetí? Čtvrtá."), ["První věta.", "Druhá věta!", "Třetí?", "Čtvrtá."]);
  assert.deepEqual(splitSentences("  "), []);
});

test("pilotní žákovská vrstva je platná a vždy jen ve stavu draft (R7)", () => {
  const overlay = JSON.parse(readFileSync(new URL("../../src/content/aifb/pupil-pilots.json", import.meta.url), "utf8"));
  const ids = Object.keys(overlay.lessons);
  assert.ok(ids.length >= 7, "pilotní lekce + kvíz");
  for (const id of ids) assert.deepEqual(validatePupilLayer(id, overlay.lessons[id]), [], id);
  assert.notDeepEqual(validatePupilLayer("x", { status: "published" }), []);
  assert.notDeepEqual(validatePupilLayer("x", { status: "draft", component: "QuizCard", config: { questions: [{ id: "q", prompt: "p", options: [{ id: "a", text: "a" }, { id: "b", text: "b" }], correct: "z", explanation: "e" }] } }), []);
});

import { AI_LESSONS, truncateWords } from "../../src/lib/edu/aifb/ai-config.ts";

test("odpověď modelu se ořízne na limit slov", () => {
  assert.equal(truncateWords("a b c d e", 3), "a b c…");
  assert.equal(truncateWords("a b c", 3), "a b c");
});

test("AI lekce mají uloženou odpověď a žádná není pro 1. stupeň (R1)", () => {
  for (const [id, config] of Object.entries(AI_LESSONS)) {
    assert.ok(config.fallback.length > 40, id);
    assert.ok(!id.startsWith("zs1-"), "žáci 1. stupně AI nepíšou");
    assert.ok(!/gpt|claude|gemini|openai|anthropic/i.test(config.fallback + config.system), "bez značky modelu (R8)");
  }
});

test("uložená ukázka pro hledání chyb obsahuje klíč nepřesností", () => {
  const fact = AI_LESSONS["zs2-level-1-cv2"];
  assert.equal(fact.plantedErrors.length, 2);
  assert.ok(fact.fallback.includes("1857"));
});
