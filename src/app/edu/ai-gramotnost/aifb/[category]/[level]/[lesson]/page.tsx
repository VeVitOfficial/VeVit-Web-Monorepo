// /edu/ai-gramotnost/aifb/[category]/[level]/[lesson] → lekce (teorie nebo cvičení).
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { lessonUnlocked } from "@/lib/edu/aifb/access";
import { findLesson, findLevel, getTheory, getTheoryTopic, previewDrafts, requireCategory } from "@/lib/edu/aifb/content";
import { gateCategory } from "@/lib/edu/aifb/gate";
import { levelPath, levelSlug as slugOfLevel } from "@/lib/edu/aifb/routes";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { LockedNotice } from "@/components/edu/aifb/access-ui";
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
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  gateCategory(viewer, locale, category);
  const content = await requireCategory(category);
  const level = findLevel(content, levelSlug);
  const lesson = level ? findLesson(level, lessonSlug) : undefined;
  if (!level || !lesson) notFound();
  if (!lessonUnlocked(viewer, lesson.id)) {
    const t = aifbT(locale);
    return (
      <AifbFrame locale={locale} theme={content.category.theme}>
        <LockedNotice backHref={levelPath(locale, category, slugOfLevel(category, level.id))} backLabel={t("aifb.lesson.backToLevel")} t={t} />
      </AifbFrame>
    );
  }
  const preview = previewDrafts(viewer);
  if (lesson.type === "theory") {
    const theory = getTheory(level.id);
    if (!theory) notFound();
    return (
      <AifbFrame locale={locale} theme={content.category.theme}>
        <TheoryView locale={locale} content={content} level={level} lesson={lesson} theory={theory} viewer={viewer} preview={preview} topic={getTheoryTopic(level.id)} />
      </AifbFrame>
    );
  }
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <LessonView locale={locale} content={content} level={level} lesson={lesson} viewer={viewer} preview={preview} />
    </AifbFrame>
  );
}
