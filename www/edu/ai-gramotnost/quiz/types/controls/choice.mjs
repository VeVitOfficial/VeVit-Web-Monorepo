import { node, text } from '../dom.mjs';

export function choiceControl(question, answer, multiple = question.type === 'multi') {
  const group = node('div', { className: 'quiz-choice-group', role: multiple ? 'group' : 'radiogroup' });
  (question.payload?.options || []).forEach((option, index) => {
    const label = node('label', { className: 'quiz-choice' });
    const input = node('input', { type: multiple ? 'checkbox' : 'radio', name: `quiz-${question.id}`, value: String(index) });
    input.addEventListener('change', () => {
      const selected = [...group.querySelectorAll('input:checked')].map((item) => Number(item.value));
      answer.value = multiple ? { optionIndices: selected } : { optionIndex: selected[0] };
    });
    label.append(input, text(option.text)); group.append(label);
  });
  return group;
}
