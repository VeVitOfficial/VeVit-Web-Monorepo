// /edu/chemie → "Již brzy" stránka s animovanou scénou.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSoonPage } from "@/components/edu/pages/soon-page";

export const metadata: Metadata = { title: "Chemie – již brzy" };

export default async function EduChemieSoonRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduSoonPage locale={locale} topic="chemistry" />
    </EduRoot>
  );
}
