// /edu/school/tvorba → Tvorba vlastních cvičení, teorie a kurzů (učitel). Funkce se staví, stránka popisuje, co bude umět.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { gateTeacher } from "@/lib/edu/school/gate";
import { schoolCreatePath } from "@/lib/edu/school/school";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { PlannedPage } from "@/components/edu/school/planned-page";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const t = aifbT(await readEduLocale(params));
  return { title: `${t("school.nav.create")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolCreateRoute({ params }: LocaleParams) {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(params), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolCreatePath(locale));
  return (
    <SchoolFrame locale={locale} viewer={viewer} active="create">
      <PlannedPage t={aifbT(locale)} locale={locale} feature="create" />
    </SchoolFrame>
  );
}
