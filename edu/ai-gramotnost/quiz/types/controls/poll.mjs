import { node } from '../dom.mjs';
import { choiceControl } from './choice.mjs';

export function pollControl(question, answer) {
  const wrap = node('div', { className: 'quiz-poll' }); const selected = { index: null, reason: '' };
  const choices = choiceControl(question, { set value(value) { selected.index = value.optionIndex; answer.value = { optionIndex: selected.index, reason: selected.reason }; } });
  const reason = node('textarea', { rows: '3', placeholder: 'Krátce vysvětli proč.' });
  reason.addEventListener('input', () => { selected.reason = reason.value; answer.value = { optionIndex: selected.index, reason: selected.reason }; });
  wrap.append(choices, reason); return wrap;
}
