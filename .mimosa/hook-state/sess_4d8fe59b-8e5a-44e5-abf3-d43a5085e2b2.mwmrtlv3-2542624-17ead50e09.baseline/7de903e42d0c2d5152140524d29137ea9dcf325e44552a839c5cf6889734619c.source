// Progress store – port useProgress.ts

const KEY = "vevit-ai-progress";

function empty() {
  return { completedLessons: [], completedExercises: {}, quizScores: {}, lastVisitedLesson: null };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        completedLessons: p.completedLessons || [],
        completedExercises: p.completedExercises || {},
        quizScores: p.quizScores || {},
        lastVisitedLesson: p.lastVisitedLesson || null,
      };
    }
  } catch {}
  return empty();
}

function save(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

let cache = null;
export function getProgress() {
  if (!cache) cache = loadProgress();
  return cache;
}

export function completeLesson(slug) {
  const p = getProgress();
  if (!p.completedLessons.includes(slug)) p.completedLessons.push(slug);
  save(p);
  notify();
  return p;
}

export function completeExercise(id) {
  const p = getProgress();
  p.completedExercises[id] = true;
  save(p);
  notify();
  return p;
}

export function saveQuizScore(quizId, score) {
  const p = getProgress();
  p.quizScores[quizId] = score;
  save(p);
  notify();
  return p;
}

export function setLastVisited(slug) {
  const p = getProgress();
  p.lastVisitedLesson = slug;
  save(p);
  notify();
  return p;
}

export function resetProgress() {
  cache = empty();
  save(cache);
  notify();
}

export function isLessonCompleted(slug) {
  return getProgress().completedLessons.includes(slug);
}

export function isExerciseCompleted(id) {
  return !!getProgress().completedExercises[id];
}

const listeners = new Set();
export function onProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  for (const fn of listeners) fn(getProgress());
}