// Pravidla místního XP pro AIFB (jen v prohlížeči, bez účtu). NÁVRH z plánu (progressAndRewards):
// teorie 25, cvičení 40, bonus za dokončený level 60. Do jednotné služby XP účtu se nic nezapisuje.
// Soubor je bez importů (sdílí ho klient, server i testy).

export const XP_THEORY = 25;
export const XP_EXERCISE = 40;
export const XP_LEVEL_BONUS = 60;
/** 1 drahokam = 10 XP (téma pirate-map ukazuje drahokamy místo XP). */
export const XP_PER_GEM = 10;

export function xpForLesson(type: "theory" | "exercise"): number {
  return type === "theory" ? XP_THEORY : XP_EXERCISE;
}

/** Největší možné XP za level podle typů lekcí (+ bonus za dokončení). */
export function maxXpForLevel(lessonTypes: readonly ("theory" | "exercise")[]): number {
  return lessonTypes.reduce((sum, type) => sum + xpForLesson(type), 0) + XP_LEVEL_BONUS;
}

export function gemsFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_GEM);
}
