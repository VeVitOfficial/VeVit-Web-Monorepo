import { node } from '../dom.mjs';

export function findControl(question, answer) {
  const spans = question.payload?.text?.spans || question.payload?.regions || [];
  const list = node('div', { className: 'quiz-find-list', role: 'group' });
  spans.forEach((span, index) => {
    const button = node('button', { type: 'button', className: 'quiz-find-item', textContent: span.text || `Oblast ${index + 1}`, 'aria-pressed': 'false' });
    button.addEventListener('click', () => { button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true')); answer.value = { selected: [...list.querySelectorAll('[aria-pressed="true"]')].map((item) => Number(item.dataset.index)) }; });
    button.dataset.index = String(index); list.append(button);
  });
  return list;
}
