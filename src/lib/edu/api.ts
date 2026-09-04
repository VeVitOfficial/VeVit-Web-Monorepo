// Port edu/js/lib/api.js — načítání statických JSON dat (courses/index.json +
// courses/<slug>.json). Per-locale: primárně /edu/data/courses/<lang>/<file>,
// fallback na /edu/data/courses/<file> (cs default).
//
// Endpointy jsou identické s legacy (base href=/edu/ → relativní
// data/courses/<file> résolvuje na /edu/data/courses/<file>). V Reactu
// voláme absolutní cestu /edu/data/courses/<file>, takže proxy i Next
// servírují stejná veřejná data z public/edu/data/courses/.
//
// Locale se bere z EduLocale (default cs). Legacy četlo currentLang() z
// store/lang.js — ekvivalent je lang z useEduLang().

import type { Course, CourseIndexMeta, Lesson, Progress } from "./config";
import type { EduLocale } from "./i18n-data";

const DEFAULT_LANG: EduLocale = "cs";
const DATA_BASE = "/edu/data/courses";

const cache = new Map<string, unknown>();

async function fetchJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} pro ${path}`);
  const data = (await res.json()) as T;
  cache.set(path, data);
  return data;
}

// Vrátí lokalizovaný JSON s fallbackem na default (cs) root verzi.
// Pro lang === cs čte přímo root — žádný zbytečný 404.
// Pro ostatní jazyky zkouší /edu/data/courses/<lang>/<file>; při 404 /
// síťové chybě spadne zpět na /edu/data/courses/<file> (cs).
async function fetchLocalized<T>(file: string, langOverride?: EduLocale): Promise<T> {
  const lang = langOverride || DEFAULT_LANG;
  if (lang === DEFAULT_LANG) return fetchJSON<T>(`${DATA_BASE}/${file}`);
  const localizedPath = `${DATA_BASE}/${lang}/${file}`;
  if (cache.has(localizedPath)) return cache.get(localizedPath) as T;
  try {
    const res = await fetch(localizedPath);
    if (res.ok) {
      const data = (await res.json()) as T;
      cache.set(localizedPath, data);
      return data;
    }
    // 404 / ne-OK → fallback na cs (root)
  } catch {
    // síťová chyba → fallback na cs (root)
  }
  return fetchJSON<T>(`${DATA_BASE}/${file}`);
}

export function getIndex(langOverride?: EduLocale): Promise<CourseIndexMeta[]> {
  return fetchLocalized<CourseIndexMeta[]>("index.json", langOverride);
}

export function getCourse(slug: string, langOverride?: EduLocale): Promise<Course> {
  return fetchLocalized<Course>(`${slug}.json`, langOverride);
}

export interface LessonBySlug {
  course: Course;
  chapter: Course["chapters"][number];
  lesson: Lesson;
  lessonNumber: number;
  chapterIndex: number;
  lessonIndex: number;
  prev: Lesson | null;
  next: Lesson | null;
}

// Najde lekci napříč všemi kurzy a vrátí kontext (kurz, kapitola, lekce,
// číslo lekce, předchozí/následující lekce).
export async function getLessonBySlug(
  slug: string,
  langOverride?: EduLocale,
): Promise<LessonBySlug | null> {
  const index = await getIndex(langOverride);
  for (const meta of index) {
    const lessonMeta = meta.lessons.find((l) => l.slug === slug);
    if (!lessonMeta) continue;
    const course = await getCourse(meta.slug, langOverride);
    let lessonNumber = 0;
    let found: LessonBySlug | null = null;
    const flat: { l: Lesson; ci: number; li: number }[] = [];
    for (let ci = 0; ci < course.chapters.length; ci++) {
      const ch = course.chapters[ci];
      for (let li = 0; li < ch.lessons.length; li++) {
        const l = ch.lessons[li];
        lessonNumber++;
        flat.push({ l, ci, li });
        if (l.slug === slug) {
          found = {
            course,
            chapter: ch,
            lesson: l,
            lessonNumber,
            chapterIndex: ci,
            lessonIndex: li,
            prev: null,
            next: null,
          };
        }
      }
    }
    if (!found) continue;
    const pos = flat.findIndex((x) => x.l.slug === slug);
    found.prev = pos > 0 ? flat[pos - 1].l : null;
    found.next = pos < flat.length - 1 ? flat[pos + 1].l : null;
    return found;
  }
  return null;
}

export interface CourseBySlug {
  meta: CourseIndexMeta;
  course: Course;
}

// Najde kurz podle slugu (metadata + plný kurz)
export async function getCourseBySlug(
  slug: string,
  langOverride?: EduLocale,
): Promise<CourseBySlug | null> {
  const index = await getIndex(langOverride);
  const meta = index.find((c) => c.slug === slug);
  if (!meta) return null;
  const course = await getCourse(slug, langOverride);
  return { meta, course };
}

export type ResumeMode = "resume" | "continue" | "start";

export interface ResumeLesson {
  course: CourseIndexMeta;
  lesson: { slug: string; title: string };
  slug: string;
  mode: ResumeMode;
}

// Najde lekci pro „Pokračovat v poslední rozdělané lekci".
// Vrací { course, lesson, slug, mode } kde mode ∈ "resume" | "continue" | "start",
// nebo null (vše dokončeno).
//   resume    – poslední navštívená lekce (progress.lastVisitedLesson) je rozpracovaná
//   continue  – žádná rozpracovaná, ale už něco dokončeno → první nedokončená lekce
//   start     – nový uživatel (nic nedokončeno) → první lekce
export function findResumeLesson(
  index: CourseIndexMeta[],
  progress: Progress,
  programmingOnly = true,
): ResumeLesson | null {
  const courses = programmingOnly ? index.filter((c) => c.category === "programovani") : index;
  const slugs = new Set<string>();
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