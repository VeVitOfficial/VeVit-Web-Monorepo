// Port edu/js/store/progress.js – perzistence postupu v localStorage.
// Klíč i tvar dat jsou identické s legacy (vevit-ai-progress).
//
// V Reactu se tyto funkce volají z komponent (useEduProgress hook ve
// stage 2 obalí synchronizaci s React statem). Posluchači (onProgress)
// zůstávají pro případnou integraci s useEffect.

import type { Progress } from "./config";

const KEY = "vevit-ai-progress";

function empty(): Progress {
  return {
    completedLessons: [],
    completedExercises: {},
    quizScores: {},
    lastVisitedLesson: null,
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return {
        completedLessons: p.completedLessons || [],
        completedExercises: p.completedExercises || {},
        quizScores: p.quizScores || {},
        lastVisitedLesson: p.lastVisitedLesson || null,
      };
    }
  } catch {
    // ignorujeme poškozená data
  }
  return empty();
}

function save(progress: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

let cache: Progress | null = null;

export function getProgress(): Progress {
  if (!cache) cache = loadProgress();
  return cache;
}

export function completeLesson(slug: string): Progress {
  const p = getProgress();
  if (!p.completedLessons.includes(slug)) p.completedLessons.push(slug);
  save(p);
  notify();
  return p;
}

export function completeExercise(id: string): Progress {
  const p = getProgress();
  p.completedExercises[id] = true;
  save(p);
  notify();
  return p;
}

export function saveQuizScore(quizId: string, score: number): Progress {
  const p = getProgress();
  p.quizScores[quizId] = score;
  save(p);
  notify();
  return p;
}

export function setLastVisited(slug: string): Progress {
  const p = getProgress();
  p.lastVisitedLesson = slug;
  save(p);
  notify();
  return p;
}

export function resetProgress(): void {
  cache = empty();
  save(cache);
  notify();
}

export function isLessonCompleted(slug: string): boolean {
  return getProgress().completedLessons.includes(slug);
}

export function isExerciseCompleted(id: string): boolean {
  return !!getProgress().completedExercises[id];
}

type ProgressListener = (progress: Progress) => void;
const listeners = new Set<ProgressListener>();

export function onProgress(fn: ProgressListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notify(): void {
  for (const fn of listeners) fn(getProgress());
}