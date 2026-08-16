import { node } from '../dom.mjs';

export function assignmentsControl(question, answer) {
  const mode = question.type === 'sort_buckets' ? 'bucket' : question.type;
  const live = node('p', { className: 'sr-only', 'aria-live': 'polite' });
  const list = node('div', { className: 'quiz-assignment-list' });
  const items = question.payload?.items || question.payload?.pairs || [];
  const targets = mode === 'bucket'
    ? question.payload?.buckets || []
    : mode === 'match'
      ? (question.payload?.rightOptions || [...items.map((pair) => pair.right), ...(question.payload?.distractorsRight || [])])
      : items.map((_, index) => String(index + 1));
  items.forEach((item, index) => {
    const label = node('label', { className: 'quiz-assignment-row' });
    const itemText = mode === 'match' ? item.left : typeof item === 'string' ? item : item.text;
    const select = node('select', { 'aria-label': `${itemText}: vyber cíl` });
    select.append(node('option', { value: '', textContent: 'Vyber cíl…' }));
    targets.forEach((target, targetIndex) => select.append(node('option', { value: String(targetIndex), textContent: target })));
    select.addEventListener('change', () => {
      if (mode === 'bucket') answer.value = { assignments: Object.fromEntries([...list.querySelectorAll('select')].map((s, i) => [i, s.value === '' ? '' : targets[Number(s.value)]])) };
      else if (mode === 'match') answer.value = { matches: Object.fromEntries([...list.querySelectorAll('select')].map((s, i) => [i, s.value === '' ? '' : targets[Number(s.value)]])) };
      else {
        const positions = [...list.querySelectorAll('select')].map((s) => s.value === '' ? null : Number(s.value));
        answer.value = { orderItems: positions.map((position, itemIndex) => ({ position, value: typeof items[itemIndex] === 'string' ? items[itemIndex] : items[itemIndex]?.text })).filter((entry) => Number.isInteger(entry.position)).sort((a, b) => a.position - b.position).map((entry) => entry.value) };
      }
      live.textContent = `${itemText}: volba změněna.`;
    });
    label.append(node('span', { textContent: itemText }), select); list.append(label);
  });
  return node('div', {}, [node('p', { className: 'quiz-help', textContent: 'Klávesnice a dotyk: u každé položky vyber cíl v nabídce.' }), list, live]);
}
