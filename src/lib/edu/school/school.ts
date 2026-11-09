// VeVit Edu pro školy (migrace 029): čistá logika bez serveru (server, klient, testy).
// Žák vstupuje kódem školy (stejný tvar jako dřívější kód třídy), zadá jméno, příjmení a kmenovou
// třídu. Adresy portálu jsou pod /<locale>/edu/school.

import { formatClassCode, normalizeClassCode } from "../aifb/access.ts";

export const normalizeSchoolCode = normalizeClassCode;
export const formatSchoolCode = formatClassCode;

/** Jméno nebo příjmení z formuláře: ořezané, 1–60 znaků, jen písmena, mezera, pomlčka, apostrof. */
export function normalizePersonName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, " ");
  return value.length >= 1 && value.length <= 60 && /^[\p{L}][\p{L}\p{M} '’-]*$/u.test(value) ? value : null;
}

/** Název kmenové třídy (7.A, 2.B, Sexta): 1–20 znaků. */
export function normalizeSchoolClassName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().replace(/\s+/g, " ");
  return value.length >= 1 && value.length <= 20 ? value : null;
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

/** Řazení žáků podle příjmení a jména (česky). */
export function compareStudents(a: { firstName: string; lastName: string }, b: { firstName: string; lastName: string }): number {
  return a.lastName.localeCompare(b.lastName, "cs") || a.firstName.localeCompare(b.firstName, "cs");
}

/** Stav zadané lekce u žáka: hotovo, po termínu (nehotovo a termín minul), čeká. */
export type AssignmentState = "done" | "late" | "open";

export function assignmentState(done: boolean, dueAt: string | null, now: Date = new Date()): AssignmentState {
  if (done) return "done";
  return dueAt && new Date(dueAt).getTime() < now.getTime() ? "late" : "open";
}

// ── Adresy ─────────────────────────────────────────────────────────────────

export const SCHOOL_BASE = "edu/school";
export const schoolHome = (locale: string) => `/${locale}/${SCHOOL_BASE}`;
export const schoolContentPath = (locale: string) => `${schoolHome(locale)}/obsah`;
export const schoolGroupsPath = (locale: string) => `${schoolHome(locale)}/tridy`;
export const schoolGroupPath = (locale: string, id: string) => `${schoolGroupsPath(locale)}/${id}`;
export const schoolProgressPath = (locale: string) => `${schoolHome(locale)}/prubeh`;
export const schoolCreatePath = (locale: string) => `${schoolHome(locale)}/tvorba`;
export const schoolCommunityPath = (locale: string) => `${schoolHome(locale)}/komunita`;
export const schoolWorkbookPath = (locale: string) => `${schoolHome(locale)}/sesit`;
export const schoolManagePath = (locale: string) => `${schoolHome(locale)}/sprava`;
export const schoolAdminPath = (locale: string) => `${schoolHome(locale)}/admin`;
/** Vstup kódem školy (veřejná stránka VeVit Edu pro školy). */
export const schoolJoinPath = (locale: string) => `/${locale}/edu/skoly#skola`;
