import "server-only";

// Lekce kurzů pro školy (zatím AIFB): přehled levelů a lekcí kategorie s odkazy, pro výběr lekcí
// v třídě učitele, tabulku průběhu a seznam úkolů žáka.

import type { AifbT } from "../aifb/i18n";
import { requireCategory } from "../aifb/content";
import { lessonPath, lessonSlug, levelSlug } from "../aifb/routes";
import type { CategoryId } from "../aifb/types";

export type SchoolLesson = { id: string; kind: string; title: string; href: string; levelId: string };
export type SchoolLevel = { id: string; code: string; title: string; lessons: SchoolLesson[] };
export type SchoolCourse = { category: CategoryId; title: string; theme: string; levels: SchoolLevel[] };

/** Stejný štítek jako lessonKindLabel v components/edu/aifb/shared.tsx („Teorie“, „Lekce 3“). */
function kindLabel(t: AifbT, lesson: { type: "theory" | "exercise"; order: number }): string {
  return lesson.type === "theory" ? t("aifb.lesson.theory") : t("aifb.lesson.exercise", { n: lesson.order });
}

export async function schoolCourse(category: CategoryId, locale: string, t: AifbT): Promise<SchoolCourse> {
  const content = await requireCategory(category);
  return {
    category,
    title: content.category.title,
    theme: content.category.theme,
    levels: content.levels.map((level) => ({
      id: level.id,
      code: level.code,
      title: level.title,
      lessons: level.lessons.map((lesson) => ({
        id: lesson.id,
        kind: kindLabel(t, lesson),
        title: lesson.type === "theory" ? "" : lesson.title,
        href: lessonPath(locale, category, levelSlug(category, level.id), lessonSlug(level.id, lesson.id)),
        levelId: level.id,
      })),
    })),
  };
}

export function lessonIndex(courses: SchoolCourse[]): Map<string, SchoolLesson & { levelCode: string; levelTitle: string; courseTitle: string }> {
  const map = new Map<string, SchoolLesson & { levelCode: string; levelTitle: string; courseTitle: string }>();
  for (const course of courses) {
    for (const level of course.levels) {
      for (const lesson of level.lessons) map.set(lesson.id, { ...lesson, levelCode: level.code, levelTitle: level.title, courseTitle: course.title });
    }
  }
  return map;
}
