import { node, text } from '../dom.mjs';

export function rapidControl(question, answer) {
  const group = node('div', { className: 'quiz-rapid-list' });
  (question.payload?.statements || []).forEach((statement, index) => {
    const field = node('fieldset'); field.append(node('legend', { textContent: statement.text }));
    ['Ano', 'Ne'].forEach((label, optionIndex) => {
      const input = node('input', { type: 'radio', name: `${question.id}-${index}`, value: optionIndex === 0 ? 'true' : 'false' });
      input.addEventListener('change', () => { answer.value = { answers: [...group.querySelectorAll('fieldset')].map((set) => set.querySelector('input:checked')?.value === 'true') }; });
      const wrapped = node('label'); wrapped.append(input, text(label)); field.append(wrapped);
    }); group.append(field);
  }); return group;
}
