// /edu/ai-gramotnost/kurz/[modul] → modul online kurzu: teorie, potom lekce.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { courseVisible, getCourse } from "@/lib/edu/aifb/content";
import { findModule } from "@/lib/edu/aifb/course";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { CourseModuleView } from "@/components/edu/aifb/course-views";

type Props = { params: Promise<{ modul: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modul } = await params;
  const t = aifbT(await readEduLocale());
  const courseModule = findModule(getCourse(), modul);
  if (!courseModule) notFound();
  return { title: `${courseModule.code}: ${courseModule.title} – ${t("aifb.course.crumb")}` };
}

export default async function CourseModuleRoute({ params }: Props) {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  if (!courseVisible(viewer)) notFound();
  const { modul } = await params;
  const course = getCourse();
  const courseModule = findModule(course, modul);
  if (!courseModule) notFound();
  return (
    <AifbFrame locale={locale} theme="clean">
      <CourseModuleView locale={locale} course={course} module={courseModule} role={viewer.role} />
    </AifbFrame>
  );
}
