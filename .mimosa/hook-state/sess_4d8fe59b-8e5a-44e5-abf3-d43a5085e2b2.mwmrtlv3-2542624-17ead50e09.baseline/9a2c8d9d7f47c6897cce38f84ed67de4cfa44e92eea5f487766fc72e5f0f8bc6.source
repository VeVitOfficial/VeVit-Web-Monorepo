import "server-only";

// Přesměrování v portálu školy: nepřihlášený na přihlášení (s návratem), kdo není ve škole na
// vstup kódem školy, stránky učitele jen učitel (nebo admin), správa jen správce (nebo admin).

import { redirect } from "next/navigation";
import { schoolHome, schoolJoinPath } from "./school";
import { inSchool, isSchoolManager, isSchoolTeacher, type SchoolViewer } from "./viewer";

export function gateSchool(viewer: SchoolViewer, locale: string, returnTo: string): void {
  if (!viewer.userId) redirect(`/${locale}/account/login?return_to=${encodeURIComponent(returnTo)}`);
  if (!inSchool(viewer)) redirect(schoolJoinPath(locale));
}

export function gateTeacher(viewer: SchoolViewer, locale: string, returnTo: string): void {
  gateSchool(viewer, locale, returnTo);
  if (!isSchoolTeacher(viewer)) redirect(schoolHome(locale));
}

export function gateManager(viewer: SchoolViewer, locale: string, returnTo: string): void {
  gateSchool(viewer, locale, returnTo);
  if (!isSchoolManager(viewer)) redirect(schoolHome(locale));
}
