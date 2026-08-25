import { node, text } from '../dom.mjs';

export function blindControl(question, answer) {
  const wrap = node('div', { className: 'quiz-blind-list' });
  (question.payload?.items || []).forEach((item, index) => {
    const field = node('fieldset'); field.append(node('legend', { textContent: item.md || `Ukázka ${index + 1}` }));
    ['human', 'ai'].forEach((source) => { const input = node('input', { type: 'radio', name: `${question.id}-${index}`, value: source }); input.addEventListener('change', () => { answer.value = { sources: [...wrap.querySelectorAll('fieldset')].map((set) => set.querySelector('input:checked')?.value || '') }; }); const label = node('label'); label.append(input, text(source === 'human' ? 'Člověk' : 'AI')); field.append(label); });
    wrap.append(field);
  }); return wrap;
}
