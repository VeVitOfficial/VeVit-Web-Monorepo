// /edu/dashboard → home page. Legacy router.js: "Domů".
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduHomePage } from "@/components/edu/pages/home-page";
import { getCatalog } from "@/lib/edu/aifb/content";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Domů – VeVit Edu" };
}

export default async function EduDashboardPageRoute({ params }: LocaleParams) {
  const locale = await readEduLocale(params);
  return (
    <EduRoot locale={locale}>
      <EduHomePage locale={locale} aifbLessons={getCatalog().totals.lessons - getCatalog().totals.levels} />
    </EduRoot>
  );
}