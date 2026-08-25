function result(correct, scorePct, detail = {}) {
  return { valid: true, correct, scorePct: Math.max(0, Math.min(100, Math.round(scorePct))), detail };
}

function selectedSet(value) {
  return new Set(Array.isArray(value) ? value.map(Number).filter(Number.isInteger) : []);
}

function setScore(actual, expected) {
  const intersection = [...actual].filter((item) => expected.has(item)).length;
  const union = new Set([...actual, ...expected]).size;
  return union === 0 ? 100 : (intersection / union) * 100;
}

function evaluateMcq(answer, payload) {
  const index = Number(answer?.optionIndex);
  const option = payload.options?.[index];
  if (!option) return result(false, 0);
  return result(option.correct === true, option.correct ? 100 : 0, { selectedIndex: index });
}

function evaluateMulti(answer, payload) {
  const actual = selectedSet(answer?.optionIndices);
  const expected = new Set((payload.options || []).map((option, index) => option.correct ? index : null).filter(Number.isInteger));
  const scorePct = payload.partialCredit === 'jaccard' ? setScore(actual, expected) : (actual.size === expected.size && [...actual].every((x) => expected.has(x)) ? 100 : 0);
  return result(scorePct === 100, scorePct);
}

function evaluateRapid(answer, payload) {
  const values = Array.isArray(answer?.answers) ? answer.answers : [];
  const statements = payload.statements || [];
  if (!statements.length) return result(false, 0);
  const correctCount = statements.filter((item, index) => values[index] === item.answer).length;
  const scorePct = (correctCount / statements.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateBuckets(answer, payload) {
  const assignments = answer?.assignments && typeof answer.assignments === 'object' ? answer.assignments : {};
  const items = payload.items || [];
  if (!items.length) return result(false, 0);
  const correctCount = items.filter((item, index) => assignments[index] === item.correct).length;
  const scorePct = (correctCount / items.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateOrder(answer, payload) {
  if (Array.isArray(answer?.orderItems)) {
    const orderItems = answer.orderItems.map(String);
    const items = (payload.items || []).map(String);
    if (orderItems.length !== items.length) return result(false, 0);
    const positions = orderItems.map((item) => items.indexOf(item));
    if (positions.some((position) => position < 0)) return result(false, 0);
    const correctCount = orderItems.filter((item, index) => item === items[index]).length;
    const scorePct = payload.scoring === 'kendall' ? kendallScore(positions) : (correctCount / items.length) * 100;
    return result(scorePct === 100, scorePct, { correctCount });
  }
  const order = Array.isArray(answer?.order) ? answer.order.map(Number) : [];
  const items = payload.items || [];
  if (order.length !== items.length) return result(false, 0);
  const correctCount = order.filter((item, index) => item === index).length;
  const scorePct = payload.scoring === 'kendall'
    ? kendallScore(order)
    : (correctCount / items.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function kendallScore(order) {
  if (order.length < 2) return 100;
  let good = 0;
  let total = 0;
  for (let left = 0; left < order.length; left += 1) for (let right = left + 1; right < order.length; right += 1) {
    total += 1;
    if (order[left] < order[right]) good += 1;
  }
  return (good / total) * 100;
}

function evaluateMatch(answer, payload) {
  const matches = answer?.matches && typeof answer.matches === 'object' ? answer.matches : {};
  const pairs = payload.pairs || [];
  if (!pairs.length) return result(false, 0);
  const correctCount = pairs.filter((pair, index) => typeof matches[index] === 'string'
    ? matches[index] === pair.right
    : Number(matches[index]) === index).length;
  const scorePct = (correctCount / pairs.length) * 100;
  return result(scorePct === 100, scorePct, { correctCount });
}

function evaluateSlider(answer, payload) {
  const value = Number(answer?.value);
  if (!Number.isFinite(value)) return result(false, 0);
  const tolerance = Number(payload.tolerance ?? 0);
  const correct = Math.abs(value - Number(payload.correctValue)) <= tolerance;
  return result(correct, correct ? 100 : 0, { value, correctValue: payload.correctValue });
}

function evaluateFindAll(answer, payload, key) {
  const actual = selectedSet(answer?.selected);
  const list = payload.text?.spans || payload.regions || [];
  const expected = new Set(list.map((item, index) => item[key] === true ? index : null).filter(Number.isInteger));
  const scorePct = setScore(actual, expected);
  return result(scorePct === 100, scorePct);
}

function evaluateBlind(answer, payload) {
  const sources = Array.isArray(answer?.sources) ? answer.sources : [];
  const items = payload.items || [];
  if (!items.length) return result(false, 0);
  const correctCount = items.filter((item, index) => sources[index] === item.source).length;
  const scorePct = (correctCount / items.length) * 100;
  return result(scorePct === 100, scorePct);
}

function evaluateWager(answer, payload) {
  if (Array.isArray(payload.rounds)) {
    const rounds = Array.isArray(answer?.rounds) ? answer.rounds : [];
    if (rounds.length !== payload.rounds.length) return { valid: false, correct: false, scorePct: 0, detail: { error: 'Dokonči všech šest sázek.' } };
    const results = payload.rounds.map((round, index) => {
      const stake = Number(rounds[index]?.stake);
      if (![5, 15, 30].includes(stake) || !(payload.stakes || []).includes(stake)) return null;
      const inner = evaluateQuestion(rounds[index]?.answer, { type: round.type, payload: round.payload || {} });
      return inner.valid ? { correct: inner.correct === true, stake, wagerXp: inner.correct === true ? stake : -stake } : null;
    });
    if (results.some((item) => item === null)) return { valid: false, correct: false, scorePct: 0, detail: { error: 'Některá sázka není platná.' } };
    const correctCount = results.filter((item) => item.correct).length;
    return result(correctCount === results.length, (correctCount / results.length) * 100, { rounds: results, correctCount, wagerXp: results.reduce((sum, item) => sum + item.wagerXp, 0) });
  }
  const stake = Number(answer?.stake);
  if (![5, 15, 30].includes(stake) || !(payload.stakes || []).includes(stake)) return { valid: false, correct: false, scorePct: 0, detail: { error: 'Neplatná sázka.' } };
  const inner = evaluateQuestion(answer?.answer, { type: payload.inner?.type, payload: payload.inner?.payload || {} });
  return { ...inner, detail: { ...inner.detail, stake, wagerXp: inner.correct ? stake : -stake } };
}

function evaluatePoll(answer, payload) {
  const index = Number(answer?.optionIndex);
  const reason = typeof answer?.reason === 'string' ? answer.reason.trim() : '';
  const valid = Number.isInteger(index) && index >= 0 && index < (payload.options || []).length && reason.length >= 3;
  return valid ? result(null, 100) : { valid: false, correct: null, scorePct: 0, detail: { error: 'Doplň volbu a krátké odůvodnění.' } };
}

function evaluateBranching(answer, payload) {
  const ending = answer?.ending;
  const valid = typeof ending === 'string' && (payload.endings || []).includes(ending);
  if (!valid) return { valid: false, correct: false, scorePct: 0, detail: { error: 'Scénář ještě není dokončený.' } };
  const correctEndings = Array.isArray(payload.correctEndings) ? payload.correctEndings : (payload.endings || []);
  const correct = correctEndings.includes(ending);
  return result(correct, correct ? 100 : 0, { ending });
}

function evaluateText(answer, payload, minKey) {
  const text = typeof answer?.text === 'string' ? answer.text.trim() : '';
  const minimum = Number(payload[minKey] ?? 1);
  const length = minKey === 'minWords' ? text.split(/\s+/u).filter(Boolean).length : text.length;
  if (length < minimum) return { valid: false, correct: null, scorePct: 0, detail: { error: 'Odpověď je příliš krátká.' } };
  const rubric = Array.isArray(payload.rubric) ? payload.rubric : [];
  const scores = Array.isArray(answer?.selfScores) ? answer.selfScores : [];
  if (!rubric.length || scores.length !== rubric.length || scores.some((score) => !Number.isInteger(score) || score < 0 || score > 5)) {
    return { valid: false, correct: null, scorePct: 0, detail: { error: 'Vyplň sebehodnocení 0–5 u všech kritérií.' } };
  }
  const selfScorePct = scores.reduce((sum, score) => sum + score, 0) / (rubric.length * 5) * 100;
  return result(null, 100, { selfScores: scores, selfScorePct });
}

function evaluateMicrotask(answer, payload) {
  if (answer?.confirmed !== true) return { valid: false, correct: null, scorePct: 0, detail: { error: 'Nejdřív potvrď splnění úkolu.' } };
  if (payload.proof === 'text' && (!String(answer?.text || '').trim())) return { valid: false, correct: null, scorePct: 0, detail: { error: 'Doplň krátký důkaz.' } };
  return result(null, 100);
}

export function evaluateQuestion(answer, question) {
  const payload = question?.payload || {};
  switch (question?.type) {
    case 'mcq': return evaluateMcq(answer, payload);
    case 'multi': return evaluateMulti(answer, payload);
    case 'truefalse_rapid': return evaluateRapid(answer, payload);
    case 'sort_buckets': return evaluateBuckets(answer, payload);
    case 'order': return evaluateOrder(answer, payload);
    case 'match': return evaluateMatch(answer, payload);
    case 'slider': return evaluateSlider(answer, payload);
    case 'hotspot': return evaluateFindAll(answer, payload, 'correct');
    case 'hallucination_hunt': return evaluateFindAll(answer, payload, 'isFalse');
    case 'blind_test': return evaluateBlind(answer, payload);
    case 'wager': return evaluateWager(answer, payload);
    case 'poll': return evaluatePoll(answer, payload);
    case 'branching': return evaluateBranching(answer, payload);
    case 'prompt_lab': return evaluateText(answer, payload, 'minChars');
    case 'open_rubric': return evaluateText(answer, payload, 'minWords');
    case 'microtask': return evaluateMicrotask(answer, payload);
    default: return { valid: false, correct: false, scorePct: 0, detail: { error: 'Nepodporovaný typ otázky.' } };
  }
}
