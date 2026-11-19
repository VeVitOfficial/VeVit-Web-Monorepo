// Načítání statických JSON dat (courses/index.json + courses/<slug>.json)
// Per-locale: primárně data/courses/<lang>/<file>, fallback na data/courses/<file> (cs default).
// Locale se čte z edu store (store/lang.js), který ho detekuje z URL prefixu /<lang>/edu/… .

import { currentLang } from "../store/lang.js?v=20260824a";

const DEFAULT_LANG = "cs";
const cache = new Map();

async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} pro ${path}`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

// Vrátí lokalizovaný JSON s fallbackem na default (cs) root verzi.
// Pro lang === cs čte přímo root (data/courses/<file>) — žádný zbytečný 404.
// Pro ostatní jazyky zkouší data/courses/<lang>/<file>; při 404/síťové chybě
// spadne zpět na data/courses/<file> (cs).
async function fetchLocalized(file, langOverride) {
  const lang = langOverride || currentLang() || DEFAULT_LANG;
  if (lang === DEFAULT_LANG) return fetchJSON(`data/courses/${file}`);
  const localizedPath = `data/courses/${lang}/${file}`;
  if (cache.has(localizedPath)) return cache.get(localizedPath);
  try {
    const res = await fetch(localizedPath);
    if (res.ok) {
      const data = await res.json();
      cache.set(localizedPath, data);
      return data;
    }
    // 404 / ne-OK → fallback na cs (root)
  } catch (_e) {
    // síťová chyba → fallback na cs (root)
  }
  return fetchJSON(`data/courses/${file}`);
}

export function getIndex(langOverride) {
  return fetchLocalized("index.json", langOverride);
}

export function getCourse(slug, langOverride) {
  return fetchLocalized(`${slug}.json`, langOverride);
}

// Najde lekci napříč všemi kurzy a vrátí { course, chapter, lesson, lessonNumber, chapterIndex, lessonIndex, prev, next }
export async function getLessonBySlug(slug) {
  const index = await getIndex();
  for (const meta of index) {
    const lessonMeta = meta.lessons.find((l) => l.slug === slug);
    if (!lessonMeta) continue;
    const course = await getCourse(meta.slug);
    let lessonNumber = 0;
    let found = null;
    let chapterIndex = -1;
    let lessonIndex = -1;
    const flat = [];
    course.chapters.forEach((ch, ci) => {
      ch.lessons.forEach((l, li) => {
        lessonNumber++;
        flat.push({ l, ci, li });
        if (l.slug === slug) {
          found = { course, chapter: ch, lesson: l, lessonNumber, chapterIndex: ci, lessonIndex: li };
        }
      });
    });
    if (!found) continue;
    const pos = flat.findIndex((x) => x.l.slug === slug);
    const prev = pos > 0 ? flat[pos - 1].l : null;
    const next = pos < flat.length - 1 ? flat[pos + 1].l : null;
    return { ...found, prev, next, course };
  }
  return null;
}

// Najde kurz podle slugu (metadata + plný kurz)
export async function getCourseBySlug(slug) {
  const index = await getIndex();
  const meta = index.find((c) => c.slug === slug);
  if (!meta) return null;
  const course = await getCourse(slug);
  return { meta, course };
}
// Najde lekci pro „Pokračovat v poslední rozdělané lekci".
// Vrací { course, lesson, slug, mode } kde mode ∈ "resume" | "continue" | "start", nebo null (vše dokončeno).
//   resume    – poslední navštívená lekce (progress.lastVisitedLesson) je rozpracovaná (nedokončená)
//   continue  – žádná rozpracovaná, ale už něco dokončeno → první nedokončená lekce
//   start     – nový uživatel (nic nedokončeno) → první lekce
export function findResumeLesson(index, progress, programmingOnly = true) {
  const courses = programmingOnly ? index.filter((c) => c.category === "programovani") : index;
  const slugs = new Set();
  courses.forEach((c) => (c.lessons || []).forEach((l) => slugs.add(l.slug)));
  const hasCompleted = progress.completedLessons.some((s) => slugs.has(s));

  const lv = progress.lastVisitedLesson;
  if (lv && slugs.has(lv) && !progress.completedLessons.includes(lv)) {
    const c = courses.find((cc) => (cc.lessons || []).some((l) => l.slug === lv));
    const lm = c && (c.lessons || []).find((l) => l.slug === lv);
    if (c && lm) return { course: c, lesson: lm, slug: lv, mode: "resume" };
  }

  for (const c of courses) {
    for (const l of c.lessons || []) {
      if (!progress.completedLessons.includes(l.slug)) {
        return { course: c, lesson: l, slug: l.slug, mode: hasCompleted ? "continue" : "start" };
      }
    }
  }
  return null;
}