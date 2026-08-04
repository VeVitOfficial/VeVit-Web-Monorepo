// Konstanty a konfigurace – totály programování, barvy obtížnosti, kategorie

export const PROGRAMMING_TOTAL_LESSONS = 342;
export const PROGRAMMING_TOTAL_XP = 11950;
export const PROGRAMMING_COURSES_COUNT = 18;

// Barvy obtížnosti (shodně s originálem)
export const DIFFICULTY_COLOR = {
  beginner: "var(--color-prog-difficulty-beginner)",
  advanced: "var(--color-prog-difficulty-advanced)",
  expert: "var(--color-prog-difficulty-expert)",
};

// Kategorie → český popisek + barva + ikona pro dashboard
export const CATEGORIES = {
  programovani: { icon: "Code2", color: "#10b981" },
  ai: { icon: "Brain", color: "#a855f7" },
  prirodni: { icon: "Atom", color: "#06b6d4" },
  humanitni: { icon: "ScrollText", color: "#f59e0b" },
  technicke: { icon: "Cog", color: "#8b5cf6" },
};

// Ikony pro „recently added" sekci na dashboardu (shodně s originálem)
export const RECENTLY_ADDED = [
  { category: "ai", title: "AI gramotnost: Co je AI?", date: "2026-06-14", duration: "12 min", slug: "ai-01-co-je-ai-historie-a-zaklady" },
  { category: "programovani", title: "Python: Ahoj, světe!", date: "2026-06-13", duration: "8 min", slug: "python-01-ahoj-světe" },
  { category: "programovani", title: "JavaScript: Úvod do JS", date: "2026-06-12", duration: "10 min", slug: "javascript-01-úvod-do-js" },
  { category: "ai", title: "Prompt engineering: Základní struktura", date: "2026-06-11", duration: "15 min", slug: "ai-08-zakladni-struktura-promptu" },
];

// Pomocná: spočítá počet lekcí kurzu
export function courseLessonCount(course) {
  if (course.totalLessons) return course.totalLessons;
  return course.chapters.reduce((n, ch) => n + ch.lessons.length, 0);
}

// Spočítá XP kurzu (součet lesson.xp nebo course.totalXP)
export function courseXP(course) {
  if (course.totalXP) return course.totalXP;
  return course.chapters.reduce(
    (n, ch) => n + ch.lessons.reduce((m, l) => m + (l.xp || 0), 0),
    0
  );
}

// Spočítá odhadovaný čas kurzu (minuty)
export function courseMinutes(course) {
  return course.chapters.reduce(
    (n, ch) => n + ch.lessons.reduce((m, l) => m + (l.estimatedMinutes || 15), 0),
    0
  );
}

// Vypočítá level z počtu dokončených lekcí (shodně s CoursePageClient)
export function levelFromCompleted(completed) {
  return Math.floor(completed / 5) + 1;
}