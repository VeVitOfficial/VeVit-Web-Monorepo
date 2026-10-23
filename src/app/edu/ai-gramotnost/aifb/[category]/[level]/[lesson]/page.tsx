// /edu/ai-gramotnost/aifb/[category]/[level]/[lesson] → lekce (teorie nebo cvičení).
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { findLesson, findLevel, getTheory, requireCategory } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { LessonView } from "@/components/edu/aifb/lesson-view";
import { TheoryView } from "@/components/edu/aifb/theory-view";

type Props = { params: Promise<{ category: string; level: string; lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, level: levelSlug, lesson: lessonSlug } = await params;
  const [t, content] = [aifbT(await readEduLocale()), await requireCategory(category)];
  const level = findLevel(content, levelSlug);
  const lesson = level ? findLesson(level, lessonSlug) : undefined;
  if (!level || !lesson) notFound();
  const name = lesson.type === "theory" ? `${t("aifb.theory.title")}: ${level.title}` : `${lesson.title} – ${level.title}`;
  return { title: `${name} – ${t("aifb.crumbs.hub")}` };
}

export default async function AifbLessonRoute({ params }: Props) {
  await connection();
  const { category, level: levelSlug, lesson: lessonSlug } = await params;
  const [locale, content] = await Promise.all([readEduLocale(), requireCategory(category)]);
  const level = findLevel(content, levelSlug);
  const lesson = level ? findLesson(level, lessonSlug) : undefined;
  if (!level || !lesson) notFound();
  if (lesson.type === "theory") {
    const theory = getTheory(level.id);
    if (!theory) notFound();
    return (
      <AifbFrame locale={locale} theme={content.category.theme}>
        <TheoryView locale={locale} content={content} level={level} lesson={lesson} theory={theory} />
      </AifbFrame>
    );
  }
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <LessonView locale={locale} content={content} level={level} lesson={lesson} />
    </AifbFrame>
  );
}
