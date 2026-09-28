// /edu/ai-gramotnost/profil → lokální postup, level a achievementy.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { AiGramFrame } from "@/components/edu/ai-gramotnost/frame";
import { AiGramProfile } from "@/components/edu/ai-gramotnost/overview-pages";

export const metadata: Metadata = { title: "AI Gramotnost – Profil" };

export default async function AiGramProfileRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <AiGramFrame locale={locale}>
      <AiGramProfile />
    </AiGramFrame>
  );
}
