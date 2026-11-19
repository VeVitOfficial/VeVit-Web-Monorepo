import "server-only";

// Přesměrování podle role (access.ts): veřejnost míří na online kurz, student mimo své kategorie
// na rozcestník, metodika pro učitele (průvodce, tisk) jen pro učitele a admina.

import { redirect } from "next/navigation";
import { canOpenCategory, isStaff, seesLevels, type AifbAccess } from "./access";
import { coursePath, hubPath } from "./routes";

export function gateLevels(viewer: AifbAccess, locale: string): void {
  if (!seesLevels(viewer)) redirect(coursePath(locale));
}

export function gateCategory(viewer: AifbAccess, locale: string, categoryId: string): void {
  gateLevels(viewer, locale);
  if (!canOpenCategory(viewer, categoryId)) redirect(hubPath(locale));
}

export function gateStaff(viewer: AifbAccess, locale: string): void {
  gateLevels(viewer, locale);
  if (!isStaff(viewer)) redirect(hubPath(locale));
}
