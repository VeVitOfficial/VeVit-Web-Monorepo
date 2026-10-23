// /edu/ai-gramotnost → hub AIFB: výběr kategorie (1. stupeň ZŠ, 2. stupeň ZŠ, SŠ, online kurz).
// Bez ranku student / učitel / admin rovnou online kurz pro veřejnost (bez rozcestníku).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { courseVisible, getCatalog, getCourse } from "@/lib/edu/aifb/content";
import { gateLevels } from "@/lib/edu/aifb/gate";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { Hub } from "@/components/edu/aifb/hub";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("aifb.hub.title")} – VeVit Edu`, description: t("aifb.hub.lead") };
}

export default async function AifbHubRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  gateLevels(viewer, locale);
  return (
    <AifbFrame locale={locale}>
      <Hub locale={locale} catalog={getCatalog()} course={courseVisible(viewer) ? getCourse() : null} viewer={viewer} />
    </AifbFrame>
  );
}
