// /edu/ai-gramotnost/kurz → online kurz pro všechny: přehled modulů. Sem míří i veřejnost z rozcestníku;
// dokud je kurz návrh, vidí jen zprávu, že se připravuje (admin a náhled vidí návrh).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { courseVisible, getCourse } from "@/lib/edu/aifb/content";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { CourseOverview, CourseSoon } from "@/components/edu/aifb/course-views";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  const course = getCourse();
  return { title: `${course.title} – ${t("aifb.crumbs.hub")}`, description: course.subtitle };
}

export default async function CourseRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  return (
    <AifbFrame locale={locale} theme="clean">
      {courseVisible(viewer)
        ? <CourseOverview locale={locale} course={getCourse()} role={viewer.role} />
        : <CourseSoon locale={locale} role={viewer.role} />}
    </AifbFrame>
  );
}
