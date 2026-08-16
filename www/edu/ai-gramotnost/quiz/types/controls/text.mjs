import { node } from '../dom.mjs';

export function textControl(question, answer) {
  const minimum = question.type === 'microtask' ? 1 : 0;
  const wrap = node('div', { className: 'quiz-text-control' });
  const input = node('textarea', { rows: '5', className: 'quiz-text-input', placeholder: 'Napiš svou odpověď.' });
  const rubric = Array.isArray(question.payload?.rubric) ? question.payload.rubric : [];
  const scores = rubric.map(() => null);
  const update = () => {
    answer.value = {
      text: input.value,
      ...(rubric.length ? { selfScores: [...scores] } : {}),
      ...(question.type === 'microtask' ? { confirmed: input.value.trim().length >= minimum } : {}),
    };
  };
  input.addEventListener('input', update); wrap.append(input);
  if (rubric.length) {
    const details = node('details', { className: 'quiz-self-rubric' }); details.hidden = true;
    details.append(node('summary', { textContent: 'Sebehodnocení podle rubriky' }));
    rubric.forEach((criterion, index) => {
      const labelText = typeof criterion === 'string' ? criterion : criterion.label || criterion.text || `Kritérium ${index + 1}`;
      const label = node('label', { className: 'quiz-self-rubric__row' });
      const select = node('select', { 'aria-label': `${labelText}: hodnocení 0 až 5` }); select.append(node('option', { value: '', textContent: 'Vyber 0–5' }));
      for (let value = 0; value <= 5; value += 1) select.append(node('option', { value: String(value), textContent: String(value) }));
      select.addEventListener('change', () => { scores[index] = select.value === '' ? null : Number(select.value); update(); });
      label.append(node('span', { textContent: labelText }), select); details.append(label);
    });
    if (question.payload?.sampleAnswer) details.append(node('p', { className: 'quiz-self-rubric__sample', textContent: `Ukázková odpověď: ${question.payload.sampleAnswer}` }));
    wrap.append(details);
  }
  update(); return wrap;
}
