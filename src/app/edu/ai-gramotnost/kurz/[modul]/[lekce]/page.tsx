// /edu/ai-gramotnost/kurz/[modul]/[lekce] → teorie modulu („teorie") nebo lekce („cv1"…).
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { courseVisible, getCourse } from "@/lib/edu/aifb/content";
import { findCourseLesson, findModule } from "@/lib/edu/aifb/course";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { CourseLessonView, CourseTheoryView } from "@/components/edu/aifb/course-views";

type Props = { params: Promise<{ modul: string; lekce: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modul, lekce } = await params;
  const t = aifbT(await readEduLocale());
  const courseModule = findModule(getCourse(), modul);
  if (!courseModule) notFound();
  if (lekce === "teorie") return { title: `${t("aifb.theory.title")}: ${courseModule.title} – ${t("aifb.course.crumb")}` };
  const lesson = findCourseLesson(courseModule, lekce);
  if (!lesson) notFound();
  return { title: `${lesson.title} – ${courseModule.title} – ${t("aifb.course.crumb")}` };
}

export default async function CourseLessonRoute({ params }: Props) {
  await connection();
  if (!courseVisible()) notFound();
  const { modul, lekce } = await params;
  const course = getCourse();
  const courseModule = findModule(course, modul);
  if (!courseModule) notFound();
  const locale = await readEduLocale();
  if (lekce === "teorie") {
    return (
      <AifbFrame locale={locale} theme="clean">
        <CourseTheoryView locale={locale} course={course} module={courseModule} />
      </AifbFrame>
    );
  }
  const lesson = findCourseLesson(courseModule, lekce);
  if (!lesson) notFound();
  return (
    <AifbFrame locale={locale} theme="clean">
      <CourseLessonView locale={locale} course={course} module={courseModule} lesson={lesson} />
    </AifbFrame>
  );
}
