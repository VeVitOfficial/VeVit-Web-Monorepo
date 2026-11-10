import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectPersonalData } from "../../src/lib/edu/aifb/pii.ts";
import { PUPIL_COMPONENTS, validatePupilLayer } from "../../src/lib/edu/aifb/pupil.ts";
import { cardsLeft, misplacedCards, placeCard, quizScore, splitSentences, trafficCorrect, starsFor, assemblePrompt, detectiveProgress, pairRightOrder, promptSlotsRight, scaleHit } from "../../src/lib/edu/aifb/interactive-logic.ts";

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

test("žákovská vrstva je platná; návrhem zůstávají cvičení s AI a citlivé rozhovory (R7)", () => {
  const overlay = JSON.parse(readFileSync(new URL("../../src/content/aifb/pupil-pilots.json", import.meta.url), "utf8"));
  const ids = Object.keys(overlay.lessons);
  assert.ok(ids.length >= 7, "pilotní lekce + kvíz");
  for (const id of ids) assert.deepEqual(validatePupilLayer(id, overlay.lessons[id]), [], id);
  assert.notDeepEqual(validatePupilLayer("x", { status: "published" }), []);
  for (const id of ids) if (overlay.lessons[id].component === "AiSandbox") assert.equal(overlay.lessons[id].status, "draft", id);
  for (const id of ["zs2-level-3-cv4", "ss-level-3-cv4"]) assert.equal(overlay.lessons[id].status, "draft", id);
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

import { aiLessonAvailable } from "../../src/lib/edu/aifb/pupil.ts";

test("AI endpoint obslouží jen schválenou vrstvu AiSandbox (návrh jen v náhledu)", () => {
  assert.equal(aiLessonAvailable(undefined, true), false);
  assert.equal(aiLessonAvailable({ status: "draft", component: "AiSandbox" }, false), false);
  assert.equal(aiLessonAvailable({ status: "draft", component: "AiSandbox" }, true), true);
  assert.equal(aiLessonAvailable({ status: "reviewed", component: "AiSandbox" }, false), true);
  assert.equal(aiLessonAvailable({ status: "published", component: "CardSort" }, true), false);
});

test("hvězdičky: 3 za vše napoprvé, 2 od 60 %, jinak 1; bez hodnocení 3", () => {
  assert.equal(starsFor(5, 5), 3);
  assert.equal(starsFor(3, 5), 2);
  assert.equal(starsFor(2, 5), 1);
  assert.equal(starsFor(0, 0), 3);
});

test("skládačka zadání: vhodné části a složený text", () => {
  const config = { goal: "g", success: "s", slots: [
    { id: "s1", label: "Role", why: "w", options: [{ id: "a", text: "Jsi učitel.", good: true }, { id: "b", text: "Jsi někdo." }] },
    { id: "s2", label: "Úkol", why: "w", options: [{ id: "a", text: "Voda." }, { id: "b", text: "Vysvětli koloběh vody.", good: true }] },
  ] };
  assert.deepEqual(promptSlotsRight(config, { s1: "a", s2: "a" }), ["s1"]);
  assert.equal(assemblePrompt(config, { s1: "a", s2: "b" }), "Jsi učitel. Vysvětli koloběh vody.");
  assert.deepEqual(validatePupilLayer("x", { status: "draft", component: "PromptBuilder", config }), []);
  const allGood = structuredClone(config);
  allGood.slots[0].options[1].good = true;
  assert.ok(validatePupilLayer("x", { status: "draft", component: "PromptBuilder", config: allGood }).length > 0);
});

test("detektiv, přímka a spojovačka: postup, směr nápovědy a stálé promíchání", () => {
  const detective = { mode: "redact", segments: [{ id: "t1", text: "Ahoj" }, { id: "t2", text: "Jan Novák", target: true, replacement: "kluk", explanation: "jméno" }, { id: "t3", text: "pomoz" }] };
  assert.deepEqual(detectiveProgress(detective, []), { total: 1, found: 0, done: false });
  assert.deepEqual(detectiveProgress(detective, ["t2"]), { total: 1, found: 1, done: true });
  assert.deepEqual(validatePupilLayer("x", { status: "draft", component: "TextDetective", config: detective }), []);
  delete detective.segments[1].replacement;
  assert.ok(validatePupilLayer("x", { status: "draft", component: "TextDetective", config: detective }).length > 0);
  const item = { id: "i1", text: "t", min: 2, max: 3, feedback: "f" };
  assert.equal(scaleHit(item, 1), 1);
  assert.equal(scaleHit(item, 3), 0);
  assert.equal(scaleHit(item, 5), -1);
  const pairs = { pairs: [{ id: "p1", left: "a", right: "x" }, { id: "p2", left: "b", right: "y" }, { id: "p3", left: "c", right: "z" }] };
  const order = pairRightOrder(pairs);
  assert.deepEqual([...order].sort(), ["p1", "p2", "p3"]);
  assert.deepEqual(order, pairRightOrder(pairs));
  assert.notDeepEqual(order, ["p1", "p2", "p3"]);
});

test("všechny typy cvičení v souboru jsou známé komponenty", () => {
  const overlay = JSON.parse(readFileSync(new URL("../../src/content/aifb/pupil-pilots.json", import.meta.url), "utf8"));
  for (const [id, layer] of Object.entries(overlay.lessons)) assert.ok(PUPIL_COMPONENTS.includes(layer.component), id);
});
