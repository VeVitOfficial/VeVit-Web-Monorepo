// /edu/ai-gramotnost/kurz → online kurz pro všechny: přehled modulů.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { courseVisible, getCourse } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { CourseOverview } from "@/components/edu/aifb/course-views";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  const course = getCourse();
  return { title: `${course.title} – ${t("aifb.crumbs.hub")}`, description: course.subtitle };
}

export default async function CourseRoute() {
  await connection();
  if (!courseVisible()) notFound();
  const locale = await readEduLocale();
  return (
    <AifbFrame locale={locale} theme="clean">
      <CourseOverview locale={locale} course={getCourse()} />
    </AifbFrame>
  );
}
