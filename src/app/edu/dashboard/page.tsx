// /edu/dashboard → home page. Legacy router.js: "Domů".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduHomePage } from "@/components/edu/pages/home-page";
import { getCatalog } from "@/lib/edu/aifb/content";
import { schoolEntry } from "@/lib/edu/school/viewer";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Domů – VeVit Edu" };
}

export default async function EduDashboardPageRoute() {
  await connection();
  const locale = await readEduLocale();
  const school = await schoolEntry(locale);
  return (
    <EduRoot locale={locale}>
      <EduHomePage locale={locale} aifbLessons={getCatalog().totals.lessons - getCatalog().totals.levels} school={school} />
    </EduRoot>
  );
}