// /edu/ai-gramotnost/ucitel/[trida] → správa třídy: žáci, odemykání lekcí, kód a nastavení.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { classForTeacher, classStudents, classUnlocks } from "@/lib/edu/aifb/classes";
import { requireCategory } from "@/lib/edu/aifb/content";
import { gateStaff } from "@/lib/edu/aifb/gate";
import { hubPath, teacherPath } from "@/lib/edu/aifb/routes";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { ClassManager } from "@/components/edu/aifb/class-manager";
import { Crumbs } from "@/components/edu/aifb/crumbs";
import { lessonKindLabel } from "@/components/edu/aifb/shared";

type Props = { params: Promise<{ trida: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("aifb.teacher.title")} – ${t("aifb.crumbs.hub")}`, robots: { index: false } };
}

export default async function ClassRoute({ params }: Props) {
  await connection();
  const [{ trida }, locale, viewer] = await Promise.all([params, readEduLocale(), prepareAifb()]);
  gateStaff(viewer, locale);
  if (!viewer.userId) notFound();
  const klass = await classForTeacher(trida, { userId: viewer.userId, isAdmin: viewer.role === "admin" });
  if (!klass) notFound();
  const t = aifbT(locale);
  const [content, students, unlocked] = await Promise.all([requireCategory(klass.category), classStudents(klass.id), classUnlocks(klass.id)]);
  const levels = content.levels.map((level) => ({
    id: level.id,
    code: level.code,
    title: level.title,
    lessons: level.lessons.map((lesson) => ({ id: lesson.id, kind: lessonKindLabel(t, lesson), title: lesson.type === "theory" ? "" : lesson.title })),
  }));
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: t("aifb.teacher.title"), href: teacherPath(locale) },
          { label: klass.name },
        ]}
      />
      <ClassManager
        locale={locale}
        classId={klass.id}
        name={klass.name}
        code={klass.code}
        categoryTitle={content.category.title}
        levels={levels}
        unlocked={unlocked}
        students={students}
        csrfToken={viewer.csrfToken}
      />
    </AifbFrame>
  );
}
