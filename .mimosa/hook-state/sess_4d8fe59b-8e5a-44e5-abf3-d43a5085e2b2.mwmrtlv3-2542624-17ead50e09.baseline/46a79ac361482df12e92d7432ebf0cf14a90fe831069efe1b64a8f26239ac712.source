// Port edu/js/store/custom-lessons.js – localStorage logika pro vytvořit/detail.
// Klíče (vevit-custom-lessons, vevit-custom-lessons-drafts) i událost
// vevit:lessonschange jsou identické s legacy.

export interface CustomLesson {
  slug: string;
  title: string;
  author?: string;
  blocks?: unknown[];
  sources?: string[];
  attribution?: string;
  createdAt?: number;
  [key: string]: unknown;
}

export interface CustomLessonDraft {
  [key: string]: unknown;
}

const LESSONS_KEY = "vevit-custom-lessons";
const DRAFTS_KEY = "vevit-custom-lessons-drafts";

export function loadCustomLessons(): CustomLesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (raw) return JSON.parse(raw) as CustomLesson[];
  } catch {
    // ignorujeme poškozená data
  }
  return [];
}

export function saveCustomLessons(list: CustomLesson[]): void {
  localStorage.setItem(LESSONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("vevit:lessonschange"));
}

export function getCustomLesson(slug: string): CustomLesson | null {
  return loadCustomLessons().find((l) => l.slug === slug) || null;
}

export function addCustomLesson(lesson: CustomLesson): void {
  const list = loadCustomLessons();
  list.unshift(lesson);
  saveCustomLessons(list);
}

export function deleteCustomLesson(slug: string): void {
  const list = loadCustomLessons().filter((l) => l.slug !== slug);
  saveCustomLessons(list);
}

// Drafts (autosave, max 10)
export function loadDrafts(): CustomLessonDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw) as CustomLessonDraft[];
  } catch {
    // ignorujeme poškozená data
  }
  return [];
}

export function saveDraft(draft: CustomLessonDraft): void {
  let drafts = loadDrafts();
  drafts.unshift(draft);
  drafts = drafts.slice(0, 10);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// Generování slugu z názvu (shodně s originálem – NFD, strip diakritiky)
export function generateSlug(title: string): string {
  return (
    String(title || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "lekce-" + Date.now()
  );
}