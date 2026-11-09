import "server-only";

// Kdo si prohlíží VeVit Edu pro školy: přihlášení, VeVit admin (rank admin) a členství ve školách
// (žák, učitel, správce). Jednou za požadavek (React cache). Výpadek účtů nebo databáze = žádné
// členství (bezpečná strana).

import { cache } from "react";
import { loadSessionFromCookies } from "@/lib/account-session";
import { getUserAccess } from "@/lib/permissions";
import { schoolHome } from "./school";
import { loadMemberships, type Memberships } from "./store";

export type SchoolViewer = Memberships & {
  userId: string | null;
  csrfToken: string | null;
  /** VeVit admin (rank admin, ne jen oprávnění *): zakládá školy a vidí všechny. */
  isAdmin: boolean;
};

const hasAdminRank = (ranks: readonly string[]) => ranks.includes("admin");

/** Pro API: má účet rank admin? Výpadek = ne. */
export async function isVevitAdmin(userId: string): Promise<boolean> {
  try {
    return hasAdminRank((await getUserAccess(userId)).ranks);
  } catch {
    return false;
  }
}

const ANONYMOUS: SchoolViewer = { userId: null, csrfToken: null, isAdmin: false, student: null, teacherOf: [], adminOf: [] };

export const getSchoolViewer = cache(async (): Promise<SchoolViewer> => {
  try {
    const session = await loadSessionFromCookies();
    if (!session) return ANONYMOUS;
    const userId = session.user.id;
    const [access, memberships] = await Promise.all([getUserAccess(userId), loadMemberships(userId)]);
    return { userId, csrfToken: session.csrfToken, isAdmin: hasAdminRank(access.ranks), ...memberships };
  } catch {
    return { ...ANONYMOUS };
  }
});

/** Má přístup do portálu školy (tlačítko „Vstoupit do třídy“). */
export function inSchool(viewer: SchoolViewer): boolean {
  return viewer.isAdmin || viewer.student !== null || viewer.teacherOf.length > 0 || viewer.adminOf.length > 0;
}

export function isSchoolTeacher(viewer: SchoolViewer): boolean {
  return viewer.teacherOf.length > 0 || viewer.isAdmin;
}

export function isSchoolManager(viewer: SchoolViewer, schoolId?: string): boolean {
  if (viewer.isAdmin) return true;
  return schoolId ? viewer.adminOf.some((s) => s.id === schoolId) : viewer.adminOf.length > 0;
}

/** Tlačítko na hlavní stránce Edu: název školy a odkaz do portálu, nebo null (zatím ve škole není). */
export async function schoolEntry(locale: string): Promise<{ name: string; href: string } | null> {
  const viewer = await getSchoolViewer();
  if (!inSchool(viewer)) return null;
  const name = viewer.student?.schoolName ?? viewer.teacherOf[0]?.name ?? viewer.adminOf[0]?.name ?? "VeVit";
  return { name, href: schoolHome(locale) };
}
