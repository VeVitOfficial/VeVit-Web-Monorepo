// /edu/historie → "Již brzy" stránka s animovanou scénou.
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSoonPage } from "@/components/edu/pages/soon-page";

export const metadata: Metadata = { title: "Historie – již brzy" };

export default async function EduHistorieSoonRoute({ params }: LocaleParams) {
  const locale = await readEduLocale(params);
  return (
    <EduRoot locale={locale}>
      <EduSoonPage locale={locale} topic="history" />
    </EduRoot>
  );
}
