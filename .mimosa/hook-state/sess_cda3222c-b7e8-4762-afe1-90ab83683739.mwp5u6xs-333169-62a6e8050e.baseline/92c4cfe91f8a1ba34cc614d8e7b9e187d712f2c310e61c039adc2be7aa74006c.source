// Gamifikace + lokální progress (localStorage, bez přihlášení)
// Levely, XP, streaky, achievementy – vše per-prohlížeč.

function levelFromXp(totalXp) { return Math.min(AppConfig.maxLevel, Math.floor(Math.sqrt((totalXp || 0) / 100)) + 1); }
function xpForLevel(level) { return level * level * 100; }
function xpIntoNextLevel(totalXp) {
  const lvl = levelFromXp(totalXp);
  const curBase = xpForLevel(lvl - 1), nextBase = xpForLevel(lvl);
  return { level: lvl, into: (totalXp || 0) - curBase, need: nextBase - curBase, pct: Math.round(((totalXp || 0) - curBase) / (nextBase - curBase) * 100) };
}

// Definice achievementů (zrcadlí data/seed, lokální odemykání)
const ACHIEVEMENTS = [
  { id: 1, name: "První kroky", description: "Dokonči 1 lekci", icon: "zap", condition_type: "lessons_count", condition_value: 1, xp_reward: 50 },
  { id: 2, name: "Prompt Wizard", description: "100 % v 5 cvičeních", icon: "brain", condition_type: "perfect_exercises", condition_value: 5, xp_reward: 100 },
  { id: 3, name: "Streak Master", description: "7 dní v řadě", icon: "flame", condition_type: "streak", condition_value: 7, xp_reward: 75 },
  { id: 4, name: "Speedrunner", description: "Rychlé dokončování", icon: "zap", condition_type: "lessons_count", condition_value: 10, xp_reward: 50 },
  { id: 5, name: "Perfectionist", description: "Dokonči kapitolu celou", icon: "trophy", condition_type: "perfect_chapter", condition_value: 1, xp_reward: 100 },
  { id: 6, name: "Code Poet", description: "Všechna kódová cvičení", icon: "zap", condition_type: "all_code_exercises", condition_value: 1, xp_reward: 75 },
  { id: 7, name: "RAG Pioneer", description: "Dokonči kapitolu 5", icon: "brain", condition_type: "chapter_complete", condition_value: 5, xp_reward: 50 },
  { id: 8, name: "Full Stack", description: "Dokonči celý kurz", icon: "trophy", condition_type: "course_complete", condition_value: 1, xp_reward: 200 },
  { id: 9, name: "Early Bird", description: "Otevři kurz před 8:00", icon: "zap", condition_type: "login_before_hour", condition_value: 8, xp_reward: 25 },
  { id: 10, name: "Night Owl", description: "Studuj po 22:00", icon: "brain", condition_type: "login_after_hour", condition_value: 22, xp_reward: 25 },
];

const LocalProgress = {
  KEY: "aigram_progress_v1",
  _d: null,
  empty() { return { completedLessons: [], totalXp: 0, streak: 0, longestStreak: 0, lastActivity: null, achievements: [], exerciseBest: {} }; },
  load() { if (this._d) return this._d; try { this._d = Object.assign(this.empty(), JSON.parse(localStorage.getItem(this.KEY)) || {}); } catch { this._d = this.empty(); } return this._d; },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this._d)); if (window.AppState) AppState.setProgress(this._d); return this._d; },
  isCompleted(lessonId) { return this.load().completedLessons.includes(Number(lessonId)); },
  completedCount() { return this.load().completedLessons.length; },
  totalXp() { return this.load().totalXp; },
  streak() { return this.load().streak; },
  unlockedAchievements() { return this.load().achievements; },

  completeLesson(lessonId, xp) {
    const d = this.load(); lessonId = Number(lessonId);
    let earned = 0;
    if (!d.completedLessons.includes(lessonId)) {
      d.completedLessons.push(lessonId);
      earned = xp;
      let mult = 1; if (d.streak >= 30) mult = 1.5; else if (d.streak >= 7) mult = 1.2; else if (d.streak >= 3) mult = 1.1;
      earned = Math.round(earned * mult);
      d.totalXp += earned;
      this.bumpStreak();
      this.checkAchievements();
    }
    this.save();
    return earned;
  },
  recordExercise(exId, type, isCorrect, xp) {
    const d = this.load(); exId = Number(exId);
    const prev = d.exerciseBest[exId];
    let earned = 0;
    if (isCorrect && (!prev || prev < 100)) {
      d.exerciseBest[exId] = 100;
      if (!prev) { earned = xp; d.totalXp += earned; }
      this.checkAchievements();
    }
    this.save();
    return earned;
  },
  bumpStreak() {
    const d = this.load(); const today = new Date().toISOString().slice(0, 10);
    if (!d.lastActivity) d.streak = 1;
    else { const diff = Math.round((Date.parse(today) - Date.parse(d.lastActivity)) / 86400000); if (diff === 0) {} else if (diff === 1) d.streak++; else d.streak = 1; }
    d.lastActivity = today; d.longestStreak = Math.max(d.longestStreak || 0, d.streak);
  },
  checkAchievements() {
    const d = this.load(); const have = new Set(d.achievements);
    ACHIEVEMENTS.forEach(a => {
      if (have.has(a.id)) return;
      if (this.met(a)) { have.add(a.id); d.totalXp += a.xp_reward; }
    });
    d.achievements = [...have];
  },
  met(a) {
    const d = this.load(); const course = (window.AppState && AppState.course) || null;
    switch (a.condition_type) {
      case "lessons_count": return d.completedLessons.length >= a.condition_value;
      case "xp_total": return d.totalXp >= a.condition_value;
      case "streak": return d.streak >= a.condition_value;
      case "perfect_exercises": return Object.values(d.exerciseBest).filter(v => v >= 100).length >= a.condition_value;
      case "perfect_chapter": return (course?.chapters || []).some(ch => (ch.lessons || []).every(l => d.completedLessons.includes(Number(l.id)))) ? 1 >= a.condition_value : false;
      case "all_code_exercises": { /* vyžaduje typy cvičení – relaxed: 5 kódových 100% */ return Object.values(d.exerciseBest).filter(v => v >= 100).length >= 5; }
      case "chapter_complete": { const ch = course?.chapters?.[a.condition_value - 1]; return ch && (ch.lessons || []).every(l => d.completedLessons.includes(Number(l.id))); }
      case "course_complete": return course && d.completedLessons.length >= (course.chapters || []).reduce((n, ch) => n + (ch.lessons || []).length, 0) && d.completedLessons.length > 0;
      case "login_before_hour": return new Date().getHours() < a.condition_value;
      case "login_after_hour": return new Date().getHours() >= a.condition_value;
    }
    return false;
  },
};
