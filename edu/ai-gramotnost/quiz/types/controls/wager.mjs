import { node, text } from '../dom.mjs';
import { choiceControl } from './choice.mjs';
import { sliderControl } from './slider.mjs';
import { assignmentsControl } from './assignments.mjs';

function innerControl(question, sink) {
  if (question.type === 'mcq') return choiceControl(question, sink);
  if (question.type === 'slider') return sliderControl(question, sink);
  if (question.type === 'sort_buckets') return assignmentsControl(question, sink);
  return node('p', { textContent: 'Tento typ sázky není podporovaný.' });
}

export function wagerControl(question, answer) {
  if (Array.isArray(question.payload?.rounds)) {
    const wrap = node('div', { className: 'quiz-wager quiz-wager--series' });
    const states = question.payload.rounds.map(() => ({ stake: null, answer: {} }));
    const update = () => { answer.value = { rounds: states.map((state) => ({ stake: state.stake, answer: state.answer })) }; };
    question.payload.rounds.forEach((round, index) => {
      const field = node('fieldset', { className: 'quiz-wager-round' }); field.append(node('legend', { textContent: `${index + 1}. ${round.prompt}` }));
      const stakes = node('div', { className: 'quiz-wager-stakes' });
      (question.payload.stakes || []).forEach((stake) => { const input = node('input', { type: 'radio', name: `${question.id}-${index}-stake`, value: String(stake) }); input.addEventListener('change', () => { states[index].stake = Number(input.value); update(); }); const label = node('label'); label.append(input, text(`${stake} XP`)); stakes.append(label); });
      const innerQuestion = { id: `${question.id}-${index}`, type: round.type, payload: round.payload || {}, prompt: round.prompt };
      const sink = { set value(value) { states[index].answer = value; update(); } };
      field.append(stakes, innerControl(innerQuestion, sink)); wrap.append(field);
    });
    return wrap;
  }
  const wrap = node('div', { className: 'quiz-wager' }); const state = { stake: null, answer: {} }; const update = () => { answer.value = { stake: state.stake, answer: state.answer }; };
  const stakes = node('fieldset'); stakes.append(node('legend', { textContent: 'Kolik XP vsadíš?' }));
  (question.payload?.stakes || []).forEach((stake) => { const input = node('input', { type: 'radio', name: `${question.id}-stake`, value: String(stake) }); input.addEventListener('change', () => { state.stake = Number(input.value); update(); }); const label = node('label'); label.append(input, text(`${stake} XP`)); stakes.append(label); });
  const inner = question.payload?.inner || {}; const innerQuestion = { id: `${question.id}-inner`, type: inner.type, payload: inner.payload || {}, prompt: inner.prompt || 'Vnitřní otázka' };
  wrap.append(stakes, innerControl(innerQuestion, { set value(value) { state.answer = value; update(); } })); return wrap;
}
