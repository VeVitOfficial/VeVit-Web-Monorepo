// /edu/ai-gramotnost → přehled kurzu AI gramotnosti.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { AiGramFrame } from "@/components/edu/ai-gramotnost/frame";
import { AiGramDashboard } from "@/components/edu/ai-gramotnost/overview-pages";

export const metadata: Metadata = {
  title: "AI Gramotnost – Domů",
  description: "Kompletní e-learningový kurz AI gramotnosti – od základů po pokročilé techniky prompt engineeringu a integrace AI.",
};

export default async function AiGramDashboardRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <AiGramFrame locale={locale}>
      <AiGramDashboard />
    </AiGramFrame>
  );
}
