// Kdo co v sekci AIFB vidí (ranky z migrace 025). Čistá logika bez serveru (server, klient, testy):
//   admin   (oprávnění *)                 vše jako dosud, včetně návrhů, a smí obsah upravovat,
//   teacher (rank teacher)                všechny kategorie a lekce, průvodce a tisk, správa tříd,
//   student (rank student)                jen kategorie svých tříd a jen lekce odemčené učitelem,
//   public  (bez ranku, i nepřihlášený)   jen online kurz pro veřejnost, bez rozcestníku.

import { CONTENT_CATEGORY_IDS, isCategoryId, type CategoryId } from "./types.ts";

export type AifbRole = "admin" | "teacher" | "student" | "public";

export const AIFB_PERMISSIONS = { student: "edu.aifb.student", teacher: "edu.aifb.teacher" } as const;

export type StudentClass = { id: string; name: string; category: CategoryId };

export type AifbAccess = {
  role: AifbRole;
  /** Třídy studenta (jiné role prázdné). */
  classes: StudentClass[];
  /** Lekce odemčené studentovi (sjednocení přes všechny jeho třídy). */
  unlocked: ReadonlySet<string>;
};

export const PUBLIC_ACCESS: AifbAccess = { role: "public", classes: [], unlocked: new Set() };

/** Admin (`*`) má přednost, potom učitel, potom student. */
export function roleFromPermissions(permissions: readonly string[]): AifbRole {
  if (permissions.includes("*")) return "admin";
  if (permissions.includes(AIFB_PERMISSIONS.teacher)) return "teacher";
  if (permissions.includes(AIFB_PERMISSIONS.student)) return "student";
  return "public";
}

/** Učitel a admin: všechny lekce, metodika pro učitele, průvodce, tisk a správa tříd. */
export function isStaff(access: Pick<AifbAccess, "role">): boolean {
  return access.role === "admin" || access.role === "teacher";
}

/** Rozcestník a levely AIFB; veřejnost dostane rovnou online kurz. */
export function seesLevels(access: Pick<AifbAccess, "role">): boolean {
  return access.role !== "public";
}

export function visibleCategories(access: AifbAccess): CategoryId[] {
  if (isStaff(access)) return [...CONTENT_CATEGORY_IDS];
  if (access.role !== "student") return [];
  return CONTENT_CATEGORY_IDS.filter((id) => access.classes.some((item) => item.category === id));
}

export function canOpenCategory(access: AifbAccess, categoryId: string): boolean {
  return isCategoryId(categoryId) && visibleCategories(access).includes(categoryId);
}

export function lessonCategory(lessonId: string): CategoryId | null {
  const prefix = lessonId.split("-")[0];
  return isCategoryId(prefix) ? prefix : null;
}

export function lessonUnlocked(access: AifbAccess, lessonId: string): boolean {
  if (isStaff(access)) return true;
  if (access.role !== "student") return false;
  const category = lessonCategory(lessonId);
  return category !== null && canOpenCategory(access, category) && access.unlocked.has(lessonId);
}

export function unlockedCount(access: AifbAccess, lessonIds: readonly string[]): number {
  return lessonIds.filter((id) => lessonUnlocked(access, id)).length;
}

// ── Třídy ──────────────────────────────────────────────────────────────────

/** Bez snadno zaměnitelných znaků (0/O, 1/I); stejná kontrola je v migraci 025. */
export const CLASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CLASS_CODE_LENGTH = 8;
const CLASS_CODE = /^[A-HJ-NP-Z2-9]{8}$/;

export function generateClassCode(randomInt: (max: number) => number): string {
  let code = "";
  for (let i = 0; i < CLASS_CODE_LENGTH; i++) code += CLASS_CODE_ALPHABET[randomInt(CLASS_CODE_ALPHABET.length)];
  return code;
}

/** Kód z formuláře: bez mezer a pomlček, velká písmena; null, když nemá správný tvar. */
export function normalizeClassCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.replace(/[\s-]/g, "").toUpperCase();
  return CLASS_CODE.test(code) ? code : null;
}

/** Kód pro zobrazení: dvě skupiny po čtyřech (ABCD-2345). */
export function formatClassCode(code: string): string {
  return code.length === CLASS_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** Id lekce AIFB (teorie nebo cvičení); stejná kontrola je v migraci 025. */
const LESSON_ID = /^(zs1|zs2|ss)-[a-z0-9-]+-(teorie|cv[1-5])$/;

export function isAifbLessonId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && LESSON_ID.test(value);
}

// ── Testovací role ─────────────────────────────────────────────────────────

/**
 * Role z testovací cookie (jen vývoj a E2E mimo Vercel, viz viewer.ts): "admin", "teacher",
 * "public", "student" (bez třídy) nebo "student:<kategorie>:<id lekcí oddělená čárkou>" (jedna
 * třída). Cokoli jiného = null.
 */
export function parseTestRole(value: string | undefined): AifbAccess | null {
  if (!value) return null;
  if (value === "admin" || value === "teacher" || value === "public") return { role: value, classes: [], unlocked: new Set() };
  if (value === "student") return { role: "student", classes: [], unlocked: new Set() };
  const match = /^student:(zs1|zs2|ss):([a-z0-9,-]*)$/.exec(value);
  if (!match) return null;
  const category = match[1] as CategoryId;
  const unlocked = match[2].split(",").filter((id) => isAifbLessonId(id) && id.startsWith(`${category}-`));
  return { role: "student", classes: [{ id: "test", name: "Test", category }], unlocked: new Set(unlocked) };
}
