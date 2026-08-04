// Globální state (no-auth – bez uživatele)
const AppState = {
  course: null, currentLesson: null, progress: {},
  listeners: new Set(),
  setCourse(c) { this.course = c; this.notify(); },
  setProgress(p) { this.progress = p || {}; this.notify(); },
  setLesson(l) { this.currentLesson = l; this.notify(); },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  notify() { this.listeners.forEach((fn) => fn(this)); },
};
