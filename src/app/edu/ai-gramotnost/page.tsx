// /edu/ai-gramotnost → "Již brzy" stránka s animovanou scénou.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSoonPage } from "@/components/edu/pages/soon-page";

export const metadata: Metadata = { title: "AI gramotnost – již brzy" };

export default async function EduAiLiteracySoonRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduSoonPage locale={locale} topic="ai" />
    </EduRoot>
  );
}
