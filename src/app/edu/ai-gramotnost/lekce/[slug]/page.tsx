// /edu/ai-gramotnost/lekce/[slug] → lekce (rozcvička, teorie, otázky, mikro-úkol).
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aiGramCourse, aiGramLesson } from "@/lib/edu/ai-gramotnost";
import { AiGramFrame } from "@/components/edu/ai-gramotnost/frame";
import { AiGramLesson } from "@/components/edu/ai-gramotnost/lesson";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const lesson = aiGramLesson(decodeURIComponent((await params).slug));
  return { title: `AI Gramotnost – ${lesson?.title ?? "Lekce"}` };
}

export default async function AiGramLessonRoute({ params }: RouteProps) {
  await connection();
  const locale = await readEduLocale();
  const slug = decodeURIComponent((await params).slug);
  // Závěrečný test je milník, ne běžná lekce (stejně jako v původní aplikaci).
  if (slug === "6-4-zaverecny-test") redirect(`/${locale}/edu/ai-gramotnost/milnik/final-6`);
  const lesson = aiGramLesson(slug);
  if (!lesson) notFound();
  const courseLesson = aiGramCourse().chapters.flatMap((chapter) => chapter.lessons).find((item) => item.slug === slug) ?? null;
  return (
    <AiGramFrame locale={locale}>
      <AiGramLesson lesson={lesson} courseLesson={courseLesson} />
    </AiGramFrame>
  );
}
