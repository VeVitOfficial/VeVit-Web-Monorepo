import { evaluateQuestion } from './evaluate.mjs';
import { node } from './dom.mjs';

function feedback(container, question, result, difficulty = 'junior') {
  const failed = result.valid === false || result.correct === false;
  const box = node('div', { className: failed ? 'quiz-feedback quiz-feedback--bad' : 'quiz-feedback quiz-feedback--ok', role: 'status' });
  const why = difficulty === 'pro' ? question.proWhy || question.why : question.juniorWhy || question.why;
  box.textContent = result.valid === false ? (result.detail?.error || 'Odpověď ještě není úplná.') : `${result.correct === false ? 'Zkus to znovu.' : 'Hotovo.'} ${why || ''}`;
  if (question.trap === true && result.correct === false) { box.classList.add('quiz-feedback--trap'); box.append(node('p', { textContent: '🪤 Tohle je častý mýtus. Otázka byla zařazena do opakování.' })); }
  if (question.type === 'slider' && question.payload?.reveal?.md) box.append(node('p', { textContent: question.payload.reveal.md }));
  if (question.type === 'blind_test') (question.payload?.items || []).forEach((item, index) => box.append(node('p', { textContent: `Ukázka ${index + 1}: ${item.tell || ''}` })));
  if ((question.type === 'prompt_lab' || question.type === 'open_rubric') && Number.isFinite(Number(result.detail?.selfScorePct))) box.append(node('p', { textContent: `Sebehodnocení: ${Math.round(Number(result.detail.selfScorePct))} %.` }));
  container.replaceChildren(box);
}

export function createRenderer(type, renderControl) {
  const answer = { value: {} };
  let difficulty = 'junior';
  let rubricPanel = null;
  return {
    type,
    render(container, question, ctx = {}) {
      difficulty = ctx.difficulty || 'junior';
      const prompt = node('p', { className: 'quiz-question__prompt', textContent: question.prompt });
      const control = renderControl(question, answer);
      rubricPanel = control.querySelector?.('.quiz-self-rubric') || null;
      const help = question.helpText ? node('p', { className: 'quiz-help', textContent: question.helpText }) : null;
      container.replaceChildren(...[prompt, help, control].filter(Boolean));
    },
    serialize() { return answer.value; },
    evaluate(value, question) { return evaluateQuestion(value, question); },
    reveal(container, result, question) {
      if (result.valid === false && rubricPanel) { rubricPanel.hidden = false; rubricPanel.open = true; }
      feedback(container, question, result, difficulty);
    },
  };
}
