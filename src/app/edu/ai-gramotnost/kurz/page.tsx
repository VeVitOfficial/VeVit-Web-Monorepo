// /edu/ai-gramotnost/kurz → úvody kapitol + osnova kurzu.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aiGramChapterIntros } from "@/lib/edu/ai-gramotnost";
import { AiGramFrame } from "@/components/edu/ai-gramotnost/frame";
import { AiGramCourse } from "@/components/edu/ai-gramotnost/overview-pages";

export const metadata: Metadata = { title: "AI Gramotnost – Kurz" };

export default async function AiGramCourseRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <AiGramFrame locale={locale}>
      <AiGramCourse intros={aiGramChapterIntros()} />
    </AiGramFrame>
  );
}
