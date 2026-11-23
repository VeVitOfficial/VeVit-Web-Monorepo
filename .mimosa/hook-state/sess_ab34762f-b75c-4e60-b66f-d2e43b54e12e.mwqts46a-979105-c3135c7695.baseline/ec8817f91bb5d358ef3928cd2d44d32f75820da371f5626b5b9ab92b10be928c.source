import "server-only";

// Kdo si stránku AIFB prohlíží: role z ranků účtu (access.ts), u studenta jeho třídy a odemčené
// lekce. Jednou za požadavek (React cache). Výpadek účtů nebo databáze = veřejnost (bezpečná
// strana: vidí jen veřejný kurz).

import { cache } from "react";
import { cookies } from "next/headers";
import { loadSessionFromCookies } from "@/lib/account-session";
import { getUserAccess } from "@/lib/permissions";
import { PUBLIC_ACCESS, parseTestRole, roleFromPermissions, type AifbAccess } from "./access";
import { loadStudentClasses } from "./classes";
import { refreshContentEdits } from "./edits-store";

export type AifbViewer = AifbAccess & {
  userId: string | null;
  /** Pro zápisové požadavky (hlavička x-csrf-token), jen přihlášený. */
  csrfToken: string | null;
};

const ANONYMOUS: AifbViewer = { ...PUBLIC_ACCESS, userId: null, csrfToken: null };

export const TEST_ROLE_COOKIE = "aifb_test_role";

/**
 * Testovací role z cookie: jen `next dev` a E2E proti `next start` mimo Vercel (AIFB_TEST_ROLES=1).
 * Produkční build na Vercelu ji nikdy nečte (NODE_ENV=production a VERCEL=1).
 */
export function testRolesEnabled(): boolean {
  return process.env.NODE_ENV === "development" || (process.env.AIFB_TEST_ROLES === "1" && !process.env.VERCEL);
}

export const getViewer = cache(async (): Promise<AifbViewer> => {
  if (testRolesEnabled()) {
    const test = parseTestRole((await cookies()).get(TEST_ROLE_COOKIE)?.value);
    if (test) return { ...test, userId: null, csrfToken: null };
  }
  try {
    const session = await loadSessionFromCookies();
    if (!session) return ANONYMOUS;
    const userId = session.user.id;
    const role = roleFromPermissions((await getUserAccess(userId)).permissions);
    const base = { userId, csrfToken: session.csrfToken };
    if (role !== "student") return { ...base, role, classes: [], unlocked: new Set() };
    return { ...base, role, ...(await loadStudentClasses(userId)) };
  } catch {
    return ANONYMOUS;
  }
});

/** Na začátku každé stránky AIFB: role návštěvníka + aktuální úpravy obsahu. */
export async function prepareAifb(): Promise<AifbViewer> {
  const [viewer] = await Promise.all([getViewer(), refreshContentEdits()]);
  return viewer;
}
