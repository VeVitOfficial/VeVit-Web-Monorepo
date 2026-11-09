// /edu/school/komunita → Cvičení sdílená komunitou učitelů (učitel). Funkce se staví, stránka popisuje, co bude umět.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { gateTeacher } from "@/lib/edu/school/gate";
import { schoolCommunityPath } from "@/lib/edu/school/school";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { PlannedPage } from "@/components/edu/school/planned-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("school.nav.community")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolCommunityRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolCommunityPath(locale));
  return (
    <SchoolFrame locale={locale} viewer={viewer} active="community">
      <PlannedPage t={aifbT(locale)} locale={locale} feature="community" />
    </SchoolFrame>
  );
}
