import { node } from '../dom.mjs';

export function branchingControl(question, answer) {
  const nodes = question.payload?.nodes || {}; let current = question.payload?.start; const wrap = node('div', { className: 'quiz-branching' });
  const paint = () => {
    const currentNode = nodes[current]; wrap.replaceChildren(node('p', { textContent: currentNode?.md || '' }));
    (currentNode?.choices || []).forEach((choice) => { const button = node('button', { type: 'button', className: 'btn btn-secondary', textContent: choice.label }); button.addEventListener('click', () => { current = choice.next; if ((question.payload?.endings || []).includes(current)) answer.value = { ending: current }; paint(); }); wrap.append(button); });
  };
  paint(); return wrap;
}
