// Okamžité vyhodnocení odpovědi v prohlížeči (port quiz/types/evaluate.mjs).
// Autoritativní skóre počítá server (src/lib/edu-quiz-evaluator.ts); tohle
// jen dává feedback hned po kliknutí a funguje i bez přihlášení.

import type { Dict, EvalResult } from "./types";

type AnyAnswer = Dict | undefined | null;
type Item = Dict;

function result(correct: boolean | null, scorePct: number, detail: Dict = {}): EvalResult {
  return { valid: true, correct, scorePct: Math.max(0, Math.min(100, Math.round(scorePct))), detail };
}

function invalid(error: string, correct: boolean | null = false): EvalResult {
  return { valid: false, correct, scorePct: 0, detail: { error } };
}

function list(value: unknown): Item[] {
  return Array.isArray(value) ? (value as Item[]) : [];
}

function selectedSet(value: unknown): Set<number> {
  return new Set(Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : []);
}

function setScore(actual: Set<number>, expected: Set<number>): number {
  const intersection = [...actual].filter((item) => expected.has(item)).length;
  const union = new Set([...actual, ...expected]).size;
  return union === 0 ? 100 : (intersection / union) * 100;
}

function kendallScore(order: number[]): number {
  if (order.length < 2) return 100;
  let good = 0;
  let total = 0;
  for (let left = 0; left < order.length; left += 1) {
    for (let right = left + 1; right < order.length; right += 1) {
      total += 1;
      if (order[left] < order[right]) good += 1;
    }
  }
  return (good / total) * 100;
}

function evaluateMcq(answer: AnyAnswer, payload: Dict): EvalResult {
  const index = Number(answer?.optionIndex);
  const option = list(payload.options)[index];
  if (!option) return result(false, 0);
  return result(option.correct === true, option.correct ? 100 : 0, { selectedIndex: index });
}

function evaluateMulti(answer: AnyAnswer, payload: Dict): EvalResult {
  const actual = selectedSet(answer?.optionIndices);
  const expected = new Set(list(payload.options).map((option, index) => (option.correct ? index : null)).filter(Number.isInteger) as number[]);
  const scorePct = payload.partialCredit === "jaccard"
    ? setScore(actual, expected)
    : actual.size === expected.size && [...actual].every((x) => expected.has(x)) ? 100 : 0;
  return result(scorePct === 100, scorePct);
}

function evaluateRapid(answer: AnyAnswer, payload: Dict): EvalResult {
  const values = Array.isArray(answer?.answers) ? (answer.answers as unknown[]) : [];
  const statements = list(payload.statements);
  if (!statements.length) return result(false, 0);
  const correctCount = statements.filter((item, index) => values[index] === item.answer).length;
  const scorePct = (correctCount / statements.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateBuckets(answer: AnyAnswer, payload: Dict): EvalResult {
  const assignments = answer?.assignments && typeof answer.assignments === "object" ? (answer.assignments as Dict) : {};
  const items = list(payload.items);
  if (!items.length) return result(false, 0);
  const correctCount = items.filter((item, index) => assignments[index] === item.correct).length;
  const scorePct = (correctCount / items.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateOrder(answer: AnyAnswer, payload: Dict): EvalResult {
  const rawItems = Array.isArray(payload.items) ? (payload.items as unknown[]) : [];
  if (Array.isArray(answer?.orderItems)) {
    const orderItems = (answer.orderItems as unknown[]).map(String);
    const items = rawItems.map(String);
    if (orderItems.length !== items.length) return result(false, 0);
    const positions = orderItems.map((item) => items.indexOf(item));
    if (positions.some((position) => position < 0)) return result(false, 0);
    const correctCount = orderItems.filter((item, index) => item === items[index]).length;
    const scorePct = payload.scoring === "kendall" ? kendallScore(positions) : (correctCount / items.length) * 100;
    return result(scorePct === 100, scorePct, { correctCount });
  }
  const order = Array.isArray(answer?.order) ? (answer.order as unknown[]).map(Number) : [];
  if (order.length !== rawItems.length) return result(false, 0);
  const correctCount = order.filter((item, index) => item === index).length;
  const scorePct = payload.scoring === "kendall" ? kendallScore(order) : (correctCount / rawItems.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateMatch(answer: AnyAnswer, payload: Dict): EvalResult {
  const matches = answer?.matches && typeof answer.matches === "object" ? (answer.matches as Dict) : {};
  const pairs = list(payload.pairs);
  if (!pairs.length) return result(false, 0);
  const correctCount = pairs.filter((pair, index) => (typeof matches[index] === "string"
    ? matches[index] === pair.right
    : Number(matches[index]) === index)).length;
  const scorePct = (correctCount / pairs.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateSlider(answer: AnyAnswer, payload: Dict): EvalResult {
  const value = Number(answer?.value);
  if (!Number.isFinite(value)) return result(false, 0);
  const tolerance = Number(payload.tolerance ?? 0);
  const correct = Math.abs(value - Number(payload.correctValue)) <= tolerance;
  return result(correct, correct ? 100 : 0, { value, correctValue: payload.correctValue });
}

function evaluateFindAll(answer: AnyAnswer, payload: Dict, key: string): EvalResult {
  const actual = selectedSet(answer?.selected);
  const text = payload.text as Dict | undefined;
  const spans = list(text?.spans ?? payload.regions);
  const expected = new Set(spans.map((item, index) => (item[key] === true ? index : null)).filter(Number.isInteger) as number[]);
  const scorePct = setScore(actual, expected);
  return result(scorePct === 100, scorePct);
}

function evaluateBlind(answer: AnyAnswer, payload: Dict): EvalResult {
  const sources = Array.isArray(answer?.sources) ? (answer.sources as unknown[]) : [];
  const items = list(payload.items);
  if (!items.length) return result(false, 0);
  const correctCount = items.filter((item, index) => sources[index] === item.source).length;
  const scorePct = (correctCount / items.length) * 100;
  return result(scorePct === 100, scorePct);
}

function evaluateWager(answer: AnyAnswer, payload: Dict): EvalResult {
  const stakes = Array.isArray(payload.stakes) ? (payload.stakes as unknown[]) : [];
  if (Array.isArray(payload.rounds)) {
    const payloadRounds = list(payload.rounds);
    const rounds = Array.isArray(answer?.rounds) ? (answer.rounds as Dict[]) : [];
    if (rounds.length !== payloadRounds.length) return invalid("Dokonči všech šest sázek.");
    const results = payloadRounds.map((round, index) => {
      const stake = Number(rounds[index]?.stake);
      if (![5, 15, 30].includes(stake) || !stakes.includes(stake)) return null;
      const inner = evaluateQuestion(rounds[index]?.answer as Dict, { type: round.type, payload: (round.payload as Dict) || {} });
      return inner.valid ? { correct: inner.correct === true, stake, wagerXp: inner.correct === true ? stake : -stake } : null;
    });
    if (results.some((item) => item === null)) return invalid("Některá sázka není platná.");
    const valid = results as { correct: boolean; stake: number; wagerXp: number }[];
    const correctCount = valid.filter((item) => item.correct).length;
    return result(correctCount === valid.length, (correctCount / valid.length) * 100, {
      rounds: valid, correctCount, wagerXp: valid.reduce((sum, item) => sum + item.wagerXp, 0),
    });
  }
  const stake = Number(answer?.stake);
  if (![5, 15, 30].includes(stake) || !stakes.includes(stake)) return invalid("Neplatná sázka.");
  const inner = payload.inner as Dict | undefined;
  const evaluated = evaluateQuestion(answer?.answer as Dict, { type: inner?.type, payload: (inner?.payload as Dict) || {} });
  return { ...evaluated, detail: { ...evaluated.detail, stake, wagerXp: evaluated.correct ? stake : -stake } };
}

function evaluatePoll(answer: AnyAnswer, payload: Dict): EvalResult {
  const index = Number(answer?.optionIndex);
  const reason = typeof answer?.reason === "string" ? answer.reason.trim() : "";
  const valid = Number.isInteger(index) && index >= 0 && index < list(payload.options).length && reason.length >= 3;
  return valid ? result(null, 100) : invalid("Doplň volbu a krátké odůvodnění.", null);
}

function evaluateBranching(answer: AnyAnswer, payload: Dict): EvalResult {
  const ending = answer?.ending;
  const endings = Array.isArray(payload.endings) ? (payload.endings as unknown[]) : [];
  if (typeof ending !== "string" || !endings.includes(ending)) return invalid("Scénář ještě není dokončený.");
  const correctEndings = Array.isArray(payload.correctEndings) ? (payload.correctEndings as unknown[]) : endings;
  const correct = correctEndings.includes(ending);
  return result(correct, correct ? 100 : 0, { ending });
}

function evaluateText(answer: AnyAnswer, payload: Dict, minKey: "minChars" | "minWords"): EvalResult {
  const text = typeof answer?.text === "string" ? answer.text.trim() : "";
  const minimum = Number(payload[minKey] ?? 1);
  const length = minKey === "minWords" ? text.split(/\s+/u).filter(Boolean).length : text.length;
  if (length < minimum) return invalid("Odpověď je příliš krátká.", null);
  const rubric = Array.isArray(payload.rubric) ? payload.rubric : [];
  const scores = Array.isArray(answer?.selfScores) ? (answer.selfScores as unknown[]) : [];
  if (!rubric.length || scores.length !== rubric.length || scores.some((score) => !Number.isInteger(score) || (score as number) < 0 || (score as number) > 5)) {
    return invalid("Vyplň sebehodnocení 0–5 u všech kritérií.", null);
  }
  const numeric = scores as number[];
  const selfScorePct = (numeric.reduce((sum, score) => sum + score, 0) / (rubric.length * 5)) * 100;
  return result(null, 100, { selfScores: numeric, selfScorePct });
}

function evaluateMicrotask(answer: AnyAnswer, payload: Dict): EvalResult {
  if (answer?.confirmed !== true) return invalid("Nejdřív potvrď splnění úkolu.", null);
  if (payload.proof === "text" && !String(answer?.text || "").trim()) return invalid("Doplň krátký důkaz.", null);
  return result(null, 100);
}

export function evaluateQuestion(answer: AnyAnswer, question: { type?: unknown; payload?: unknown }): EvalResult {
  const payload = (question?.payload as Dict) || {};
  switch (question?.type) {
    case "mcq": return evaluateMcq(answer, payload);
    case "multi": return evaluateMulti(answer, payload);
    case "truefalse_rapid": return evaluateRapid(answer, payload);
    case "sort_buckets": return evaluateBuckets(answer, payload);
    case "order": return evaluateOrder(answer, payload);
    case "match": return evaluateMatch(answer, payload);
    case "slider": return evaluateSlider(answer, payload);
    case "hotspot": return evaluateFindAll(answer, payload, "correct");
    case "hallucination_hunt": return evaluateFindAll(answer, payload, "isFalse");
    case "blind_test": return evaluateBlind(answer, payload);
    case "wager": return evaluateWager(answer, payload);
    case "poll": return evaluatePoll(answer, payload);
    case "branching": return evaluateBranching(answer, payload);
    case "prompt_lab": return evaluateText(answer, payload, "minChars");
    case "open_rubric": return evaluateText(answer, payload, "minWords");
    case "microtask": return evaluateMicrotask(answer, payload);
    default: return invalid("Nepodporovaný typ otázky.");
  }
}
