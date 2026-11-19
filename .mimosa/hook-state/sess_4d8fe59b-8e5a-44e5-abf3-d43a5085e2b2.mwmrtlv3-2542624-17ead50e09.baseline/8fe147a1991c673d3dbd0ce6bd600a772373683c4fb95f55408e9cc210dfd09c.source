// Custom lessons store – port localStorage logiky z vytvořit/detail stránek

const LESSONS_KEY = "vevit-custom-lessons";
const DRAFTS_KEY = "vevit-custom-lessons-drafts";

export function loadCustomLessons() {
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveCustomLessons(list) {
  localStorage.setItem(LESSONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("vevit:lessonschange"));
}

export function getCustomLesson(slug) {
  return loadCustomLessons().find((l) => l.slug === slug) || null;
}

export function addCustomLesson(lesson) {
  const list = loadCustomLessons();
  list.unshift(lesson);
  saveCustomLessons(list);
}

export function deleteCustomLesson(slug) {
  const list = loadCustomLessons().filter((l) => l.slug !== slug);
  saveCustomLessons(list);
}

// Drafts (autosave, max 10)
export function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveDraft(draft) {
  let drafts = loadDrafts();
  drafts.unshift(draft);
  drafts = drafts.slice(0, 10);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// Generování slugu z názvu (shodně s originálem – NFD, strip diakritiky)
export function generateSlug(title) {
  return String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "lekce-" + Date.now();
}