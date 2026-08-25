const LESSON_SLUG = /^[1-6]-[0-9]+-[a-z0-9-]+$/;
const CHAPTER_NUMBER = /^[1-6]$/;

export function normalizeLessonSlug(value) {
  if (typeof value !== 'string' || !LESSON_SLUG.test(value)) return null;
  return value;
}

export function buildLessonUrl(slug) {
  const safeSlug = normalizeLessonSlug(slug);
  return safeSlug ? `/edu/content/ai-gramotnost/lessons/${encodeURIComponent(safeSlug)}.json` : null;
}

export async function fetchLessonContent(slug, fetchImpl = window.fetch.bind(window)) {
  const url = buildLessonUrl(slug);
  if (!url) throw new Error('Neplatný odkaz na lekci.');
  const response = await fetchImpl(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Obsah lekce se nepodařilo načíst.');
  const lesson = await response.json();
  if (!lesson || lesson.slug !== slug || !Array.isArray(lesson.questionBank)) {
    throw new Error('Obsah lekce má neplatný formát.');
  }
  return lesson;
}

export async function fetchChapterContent(chapter, fetchImpl = window.fetch.bind(window)) {
  const number = String(chapter);
  if (!CHAPTER_NUMBER.test(number)) throw new Error('Neplatná kapitola.');
  const chapterFiles = {
    '1': '01-uvod.json', '2': '02-jak-ai-funguje.json', '3': '03-prompt-engineering.json',
    '4': '04-prakticka-integrace.json', '5': '05-pokrocila-temata.json', '6': '06-zaver-a-projekty.json',
  };
  const response = await fetchImpl(`/edu/content/ai-gramotnost/chapters/${chapterFiles[number]}`, {
    credentials: 'same-origin', headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Úvod kapitoly se nepodařilo načíst.');
  const content = await response.json();
  if (!content || Number(content.chapter) !== Number(number)) throw new Error('Úvod kapitoly má neplatný formát.');
  return content;
}
