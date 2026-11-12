import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allOk, checkPasses, evaluateChecks, initialLab, labFinished, labScore, roundStars, skipRound, solveRound } from "../../src/lib/edu/aifb/prompt-lab.ts";
import { aiLessonAvailable, publicLayer, validatePupilLayer } from "../../src/lib/edu/aifb/pupil.ts";

const pilots = JSON.parse(readFileSync(new URL("../../src/content/aifb/pupil-pilots.json", import.meta.url), "utf8")).lessons;
const labs = Object.entries(pilots).filter(([, layer]) => layer.component === "PromptLab");

test("PromptLab: podmínky ignorují diakritiku a velikost písmen", () => {
  const pattern = { id: "x", label: "l", hint: "h", kind: "pattern", pattern: "pro žáka|děti" };
  assert.equal(checkPasses(pattern, "Vysvětli to PRO ZAKA 6. třídy"), true);
  assert.equal(checkPasses(pattern, "pro deti"), true);
  assert.equal(checkPasses(pattern, "vysvětli to"), false);
  assert.equal(checkPasses({ ...pattern, kind: "notPattern" }, "vysvětli to"), true);
  // třídy jako \S se nesmí lowercasovat (dříve rozbíjelo [\s\S])
  assert.equal(checkPasses({ ...pattern, pattern: "\\{[\\s\\S]*\\}" }, "{\n\"a\": 1\n}"), true);
});

test("PromptLab: slova, věty, odrážky", () => {
  const c = (kind, n) => ({ id: "x", label: "l", hint: "h", kind, n });
  assert.equal(checkPasses(c("minWords", 3), "dva slova"), false);
  assert.equal(checkPasses(c("maxWords", 3), "tři slova tady"), true);
  assert.equal(checkPasses(c("maxSentences", 2), "Jedna. Dvě. Tři."), false);
  assert.equal(checkPasses(c("minBullets", 3), "- a\n- b\n- c"), true);
  assert.equal(checkPasses(c("minBullets", 3), "1. a\n2. b\ntext"), false);
});

test("PromptLab: hvězdičky, přeskočení a skóre", () => {
  assert.deepEqual([roundStars(1), roundStars(2), roundStars(5)], [3, 2, 1]);
  const config = { rounds: [{ id: "a" }, { id: "b" }] };
  let state = initialLab(config);
  state = solveRound(state, "a", 1);
  state = skipRound({ ...state });
  assert.equal(state.queue.length, 3, "přeskočené kolo se vrací na konec");
  state = skipRound({ ...state, position: 2 });
  assert.equal(state.queue.length, 3, "podruhé se už nevrací");
  assert.equal(labFinished(state), true);
  assert.deepEqual(labScore(config, state), { correct: 1, total: 2 });
});

test("PromptLab: všechny vrstvy jsou platné a nic nevyzrazují klientovi", () => {
  assert.ok(labs.length >= 10);
  for (const [id, layer] of labs) {
    assert.deepEqual(validatePupilLayer(id, layer), [], id);
    assert.equal(layer.status, "draft", `${id}: nové živé cvičení čeká na schválení`);
    assert.ok(!id.startsWith("zs1-"), "R1: žáci 1. stupně do AI nepíšou");
    const shown = JSON.stringify(publicLayer(layer));
    assert.ok(!shown.includes("Jsi pomocník"), id);
    assert.equal(publicLayer(layer).server, undefined);
    assert.equal(aiLessonAvailable(layer, false), false);
    assert.equal(aiLessonAvailable(layer, true), true);
  }
});

test("PromptLab: uložená ukázka splní podmínky na odpověď a obsahuje to, co kolo slibuje", () => {
  for (const [id, layer] of labs) {
    for (const round of layer.config.rounds) {
      const stored = layer.server.rounds[round.id].fallback;
      const results = evaluateChecks(round.answerChecks ?? [], stored);
      assert.ok(allOk(results), `${id}/${round.id}: ${results.filter((r) => !r.ok).map((r) => r.check.id)}`);
    }
  }
});

test("PromptLab: prázdné a vágní zadání kolo nevyřeší, dobré ano", () => {
  const round = pilots["zs2-level-2-cv1"].config.rounds[0];
  const bad = evaluateChecks(round.promptChecks, "Napiš e-mail.");
  assert.equal(allOk(bad), false);
  const good = evaluateChecks(round.promptChecks, "Napiš krátký e-mail učitelce, že v pátek nemůžu na kroužek, protože jdu k zubaři. Nejvýše 4 věty.");
  assert.ok(allOk(good), JSON.stringify(good.filter((r) => !r.ok)));
});

import { memoryDeck, memoryStars, quizOptionIds, stableOrder, truthStatements } from "../../src/lib/edu/aifb/interactive-logic.ts";

const pairsConfig = {
  pairs: ["a", "b", "c", "d", "e", "f", "g"].map((id) => ({ id, left: `L${id}`, right: `R${id}` })),
};

test("Šablony párů: stálé pořadí, kvíz má správnou volbu a max. 4 možnosti", () => {
  assert.deepEqual(stableOrder([3, 1, 2], String, "x"), stableOrder([2, 3, 1], String, "x"));
  for (const pair of pairsConfig.pairs) {
    const options = quizOptionIds(pairsConfig, pair.id);
    assert.ok(options.includes(pair.id));
    assert.ok(options.length === 4 && new Set(options).size === 4);
  }
});

test("Šablony párů: pravda/lež má pravdivé i nepravdivé a nepravdivé se liší od pravdy", () => {
  const statements = truthStatements(pairsConfig);
  assert.equal(statements.length, 7);
  assert.ok(statements.some((s) => s.isTrue) && statements.some((s) => !s.isTrue));
  for (const s of statements) assert.equal(s.shownId === s.pairId, s.isTrue);
});

test("Šablony párů: pexeso má nejvýše 12 karet po dvojicích a hvězdy podle tahů", () => {
  const deck = memoryDeck(pairsConfig);
  assert.equal(deck.length, 12);
  for (const card of deck) assert.equal(deck.filter((c) => c.pairId === card.pairId).length, 2);
  assert.deepEqual([memoryStars(7, 6), memoryStars(11, 6), memoryStars(30, 6)], [3, 2, 1]);
});

test("Šablony párů: neznámá šablona se odmítne", () => {
  const layer = { status: "draft", component: "PairMatch", config: { template: "bingo", pairs: pairsConfig.pairs } };
  assert.ok(validatePupilLayer("x", layer).some((e) => e.includes("šablona")));
  assert.deepEqual(validatePupilLayer("x", { ...layer, config: { ...layer.config, template: "memory" } }), []);
});
