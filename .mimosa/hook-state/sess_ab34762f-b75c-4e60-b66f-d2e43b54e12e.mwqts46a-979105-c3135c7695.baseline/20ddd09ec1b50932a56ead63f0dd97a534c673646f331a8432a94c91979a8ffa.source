import "server-only";

/**
 * Port of edu/api/quiz/evaluator.php — pure server-side answer evaluation.
 * PHP array semantics are mirrored by Record accessors; numeric handling keeps
 * the PHP comparisons strict where it matters (booleans are not numbers here).
 */

export interface QuizEvalResult {
  valid: boolean;
  correct: boolean | null;
  scorePct: number;
  detail: Record<string, unknown>;
}

type Dict = Record<string, unknown>;

export function quizEvalResult(correct: boolean | null, scorePct: number, detail: Dict = {}, valid = true): QuizEvalResult {
  return { valid, correct, scorePct: Math.max(0, Math.min(100, Math.round(scorePct))), detail };
}

function quizEvalIndices(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const indices = value
    .map((x) => {
      if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
      if (typeof x === "string" && /^-?\d+(\.\d+)?$/.test(x.trim())) return Math.trunc(Number(x));
      return null;
    })
    .filter((x): x is number => x !== null);
  return [...new Set(indices)];
}

function quizEvalSetScore(actual: number[], expected: number[]): number {
  const e = new Set(expected);
  const intersection = [...new Set(actual)].filter((x) => e.has(x)).length;
  // PHP: count(array_unique(merge)) — union of both lists.
  const union = new Set([...actual, ...expected]).size;
  return union === 0 ? 100 : (intersection / union) * 100;
}

function isTrue(value: unknown): boolean {
  return value === true;
}

function optionAt(payload: Dict, key: string, index: number): Dict | null {
  const options = payload[key];
  if (!Array.isArray(options)) return null;
  const option = options[index];
  return option !== null && typeof option === "object" && !Array.isArray(option) ? (option as Dict) : null;
}

function evaluateWagerStake(inner: QuizEvalResult, stake: number): QuizEvalResult {
  inner.detail.stake = stake;
  inner.detail.wagerXp = inner.correct === true ? stake : -stake;
  return inner;
}

export function quizEvaluateQuestion(answer: Dict, question: Dict): QuizEvalResult {
  const payload = question.payload !== null && typeof question.payload === "object" && !Array.isArray(question.payload)
    ? (question.payload as Dict)
    : {};
  const type = typeof question.type === "string" ? question.type : "";

  if (type === "mcq") {
    const index = answer.optionIndex !== undefined ? Math.trunc(Number(answer.optionIndex)) : -1;
    const correct = isTrue(optionAt(payload, "options", index)?.correct);
    return quizEvalResult(correct, correct ? 100 : 0);
  }

  if (type === "multi") {
    const actual = quizEvalIndices(answer.optionIndices);
    const expected: number[] = [];
    const options = Array.isArray(payload.options) ? payload.options : [];
    options.forEach((option, index) => {
      if (option !== null && typeof option === "object" && isTrue((option as Dict).correct)) expected.push(index);
    });
    const score = payload.partialCredit === "jaccard"
      ? quizEvalSetScore(actual, expected)
      : actual.length === expected.length && actual.every((x, i) => x === expected[i])
        ? 100
        : 0;
    return quizEvalResult(score >= 100, score);
  }

  if (type === "truefalse_rapid") {
    const items = payload.statements;
    const answers = answer.answers;
    if (!Array.isArray(items) || items.length === 0) return quizEvalResult(false, 0);
    const correctAnswers = Array.isArray(answers) ? answers : [];
    let correct = 0;
    (items as unknown[]).forEach((item, index) => {
      const expected = item !== null && typeof item === "object" ? (item as Dict).answer : undefined;
      if (correctAnswers[index] !== undefined && correctAnswers[index] === expected) correct++;
    });
    const score = (correct / items.length) * 100;
    return quizEvalResult(score >= 100, score, { correctCount: correct });
  }

  if (type === "sort_buckets") {
    const items = payload.items;
    const assignmentsList = answer.assignments;
    if (!Array.isArray(items) || items.length === 0) return quizEvalResult(false, 0);
    const assignments: Record<string, unknown> = assignmentsList !== null && typeof assignmentsList === "object"
      ? (assignmentsList as Record<string, unknown>)
      : {};
    let correct = 0;
    (items as unknown[]).forEach((item, index) => {
      const expected = item !== null && typeof item === "object" ? (item as Dict).correct : undefined;
      const value = assignments[String(index)] ?? assignments[index] ?? null;
      if ((value ?? null) === expected) correct++;
    });
    const score = (correct / items.length) * 100;
    return quizEvalResult(score >= 100, score);
  }

  if (type === "order") {
    const orderItemsRaw = answer.orderItems;
    if (Array.isArray(orderItemsRaw)) {
      const orderItems = orderItemsRaw.map(String);
      const items = (Array.isArray(payload.items) ? payload.items : []).map(String);
      if (items.length === 0 || orderItems.length !== items.length) return quizEvalResult(false, 0);
      const positions: number[] = [];
      for (const item of orderItems) {
        const position = items.indexOf(item);
        if (position === -1) return quizEvalResult(false, 0);
        positions.push(position);
      }
      if (payload.scoring === "kendall") {
        let good = 0;
        let total = 0;
        positions.forEach((left, i) => {
          for (const right of positions.slice(i + 1)) {
            total++;
            if (left < right) good++;
          }
        });
        const score = total ? (good / total) * 100 : 100;
        return quizEvalResult(score >= 100, score);
      }
      let correct = 0;
      orderItems.forEach((value, index) => {
        if (items[index] === value) correct++;
      });
      const score = (correct / items.length) * 100;
      return quizEvalResult(score >= 100, score);
    }
    const order = quizEvalIndices(answer.order);
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (order.length !== items.length || items.length === 0) return quizEvalResult(false, 0);
    if (payload.scoring === "kendall") {
      let good = 0;
      let total = 0;
      order.forEach((left, i) => {
        for (const right of order.slice(i + 1)) {
          total++;
          if (left < right) good++;
        }
      });
      const score = total ? (good / total) * 100 : 100;
      return quizEvalResult(score >= 100, score);
    }
    let correct = 0;
    order.forEach((value, index) => {
      if (index === value) correct++;
    });
    const score = (correct / items.length) * 100;
    return quizEvalResult(score >= 100, score);
  }

  if (type === "match") {
    const pairs = payload.pairs;
    const matchesRaw = answer.matches;
    if (!Array.isArray(pairs) || pairs.length === 0) return quizEvalResult(false, 0);
    const matches: Record<string, unknown> = matchesRaw !== null && typeof matchesRaw === "object"
      ? (matchesRaw as Record<string, unknown>)
      : {};
    let correct = 0;
    (pairs as unknown[]).forEach((pair, index) => {
      if (pair === null || typeof pair !== "object") return;
      const value = matches[String(index)] ?? matches[index] ?? null;
      if (value === undefined && matches[String(index)] === undefined && matches[index] === undefined) return;
      const right = (pair as Dict).right ?? null;
      if (typeof value === "string" && value === right) correct++;
      else if (typeof value !== "string" && Math.trunc(Number(value)) === index) correct++;
    });
    const score = (correct / pairs.length) * 100;
    return quizEvalResult(score >= 100, score);
  }

  if (type === "slider") {
    const value = answer.value;
    if (typeof value !== "number" && !(typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value))) {
      return quizEvalResult(false, 0);
    }
    const correct = Math.abs(Number(value) - Number(payload.correctValue ?? 0)) <= Number(payload.tolerance ?? 0);
    return quizEvalResult(correct, correct ? 100 : 0);
  }

  if (type === "hotspot" || type === "hallucination_hunt") {
    const key = type === "hotspot" ? "correct" : "isFalse";
    const text = payload.text;
    const spans = text !== null && typeof text === "object" && Array.isArray((text as Dict).spans)
      ? (text as Dict).spans
      : payload.regions;
    const items = Array.isArray(spans) ? spans : [];
    const expected: number[] = [];
    (items as unknown[]).forEach((item, index) => {
      if (item !== null && typeof item === "object" && isTrue((item as Dict)[key])) expected.push(index);
    });
    const score = quizEvalSetScore(quizEvalIndices(answer.selected), expected);
    return quizEvalResult(score >= 100, score);
  }

  if (type === "blind_test") {
    const items = payload.items;
    const sources = answer.sources;
    if (!Array.isArray(items) || items.length === 0) return quizEvalResult(false, 0);
    let correct = 0;
    if (sources !== null && typeof sources === "object") {
      (items as unknown[]).forEach((item, index) => {
        const expected = item !== null && typeof item === "object" ? (item as Dict).source : undefined;
        const given = Array.isArray(sources) ? sources[index] : (sources as Record<string, unknown>)[index] ?? (sources as Record<string, unknown>)[String(index)];
        if (given !== undefined && given === expected) correct++;
      });
    }
    const score = (correct / items.length) * 100;
    return quizEvalResult(score >= 100, score);
  }

  if (type === "wager") {
    if (Array.isArray(payload.rounds)) {
      const roundsPayload = payload.rounds as unknown[];
      const answers = Array.isArray(answer.rounds) ? answer.rounds : [];
      const validStakes: number[] = Array.isArray(payload.stakes) ? (payload.stakes as unknown[]).map(Number) : [];
      if (answers.length !== roundsPayload.length) {
        return quizEvalResult(false, 0, { error: "Dokonči všech šest sázek." }, false);
      }
      const details: Dict[] = [];
      let correctCount = 0;
      let wagerXp = 0;
      for (let index = 0; index < roundsPayload.length; index++) {
        const round = roundsPayload[index] as Dict;
        const roundAnswer = answers[index] !== null && typeof answers[index] === "object" ? (answers[index] as Dict) : {};
        const stake = Math.trunc(Number(roundAnswer.stake ?? 0));
        if (![5, 15, 30].includes(stake) || !validStakes.includes(stake)) {
          return quizEvalResult(false, 0, { error: "Neplatná sázka." }, false);
        }
        const innerAnswer = roundAnswer.answer !== null && typeof roundAnswer.answer === "object" ? (roundAnswer.answer as Dict) : {};
        const inner = quizEvaluateQuestion(innerAnswer, { type: round.type ?? "", payload: round.payload ?? [] });
        if (inner.valid !== true) return quizEvalResult(false, 0, { error: "Některá sázka není platná." }, false);
        const isCorrect = inner.correct === true;
        if (isCorrect) correctCount++;
        const delta = isCorrect ? stake : -stake;
        wagerXp += delta;
        details.push({ correct: isCorrect, stake, wagerXp: delta });
      }
      const score = details.length ? (correctCount / details.length) * 100 : 0;
      return quizEvalResult(correctCount === details.length, score, { rounds: details, correctCount, wagerXp });
    }
    const stake = Math.trunc(Number(answer.stake ?? 0));
    const validStakes: number[] = Array.isArray(payload.stakes) ? (payload.stakes as unknown[]).map(Number) : [];
    if (![5, 15, 30].includes(stake) || !validStakes.includes(stake)) {
      return quizEvalResult(false, 0, { error: "Neplatná sázka." }, false);
    }
    const innerPayload = payload.inner as Dict | undefined;
    const inner = quizEvaluateQuestion(
      answer.answer !== null && typeof answer.answer === "object" ? (answer.answer as Dict) : {},
      { type: innerPayload?.type ?? "", payload: innerPayload?.payload ?? [] },
    );
    return evaluateWagerStake(inner, stake);
  }

  if (type === "poll") {
    const index = answer.optionIndex !== undefined ? Math.trunc(Number(answer.optionIndex)) : -1;
    const reason = String(answer.reason ?? "").trim();
    const options = payload.options;
    const hasOption = Array.isArray(options) && Object.prototype.hasOwnProperty.call(options, index);
    const valid = hasOption && reason.length >= 3;
    return valid
      ? quizEvalResult(null, 100)
      : quizEvalResult(null, 0, { error: "Doplň volbu a krátké odůvodnění." }, false);
  }

  if (type === "branching") {
    const ending = answer.ending;
    const endings = Array.isArray(payload.endings) ? (payload.endings as unknown[]) : [];
    const valid = typeof ending === "string" && endings.includes(ending);
    if (!valid) return quizEvalResult(false, 0, { error: "Scénář ještě není dokončený." }, false);
    const correctEndings = Array.isArray(payload.correctEndings)
      ? (payload.correctEndings as unknown[])
      : endings;
    const correct = correctEndings.includes(ending);
    return quizEvalResult(correct, correct ? 100 : 0, { ending });
  }

  if (type === "prompt_lab" || type === "open_rubric") {
    const text = String(answer.text ?? "").trim();
    const minimum = Math.trunc(Number(payload[type === "prompt_lab" ? "minChars" : "minWords"] ?? 1));
    const length = type === "prompt_lab" ? text.length : wordCount(text);
    if (length < minimum) return quizEvalResult(null, 0, { error: "Odpověď je příliš krátká." }, false);
    const rubric = Array.isArray(payload.rubric) ? (payload.rubric as unknown[]).slice() : [];
    const scores = Array.isArray(answer.selfScores) ? [...(answer.selfScores as unknown[])] : [];
    let validScores = rubric.length > 0 && scores.length === rubric.length;
    for (const score of scores) if (!Number.isInteger(score) || (score as number) < 0 || (score as number) > 5) validScores = false;
    if (!validScores) return quizEvalResult(null, 0, { error: "Vyplň sebehodnocení 0–5 u všech kritérií." }, false);
    const selfScorePct = (scores.reduce<number>((sum, s) => sum + (s as number), 0) / (rubric.length * 5)) * 100;
    return quizEvalResult(null, 100, { selfScores: scores, selfScorePct });
  }

  if (type === "microtask") {
    const hasText = String(answer.text ?? "").trim() !== "";
    const proof = typeof payload.proof === "string" ? payload.proof : "none";
    const valid = answer.confirmed === true && (proof !== "text" || hasText);
    return valid ? quizEvalResult(null, 100) : quizEvalResult(null, 0, { error: "Dokonči mikro-úkol." }, false);
  }

  return quizEvalResult(false, 0, { error: "Nepodporovaný typ otázky." }, false);
}

/** PHP str_word_count()-like word split used by open_rubric minWords. */
export function wordCount(text: string): number {
  return text.split(/\s+/u).filter(Boolean).length;
}

/** UTF-8 code-point length (PHP mb_strlen equivalent). */
export function phpMbLength(text: string): number {
  return [...text].length;
}

/** PHP round($x, 2) — rounds half away from zero; JS Math.round is half-up. */
export function phpRound2(value: number): number {
  const scaled = value * 100;
  const result = scaled < 0 ? -Math.round(-scaled) : Math.round(scaled);
  return result / 100;
}