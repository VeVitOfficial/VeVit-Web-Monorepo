// /edu/school → portál VeVit Edu pro školy. Učitel: přehled tříd a úkolů. Žák: zadané úkoly
// a odemčené lekce. Jen správce nebo jen VeVit admin: rovnou na svou správu.
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { getViewer } from "@/lib/edu/aifb/viewer";
import { isCategoryId, type CategoryId } from "@/lib/edu/aifb/types";
import { gateSchool } from "@/lib/edu/school/gate";
import { schoolCourse } from "@/lib/edu/school/lessons";
import { groupReport } from "@/lib/edu/school/report";
import { schoolAdminPath, schoolHome, schoolManagePath } from "@/lib/edu/school/school";
import { listGroups, progressOf, studentAssignments, teacherSchoolClasses } from "@/lib/edu/school/store";
import { getSchoolViewer, isSchoolTeacher } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { StudentHome } from "@/components/edu/school/student-home";
import { TeacherHome } from "@/components/edu/school/teacher-home";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const t = aifbT(await readEduLocale(params));
  return { title: t("school.title"), robots: { index: false } };
}

export default async function SchoolHomeRoute({ params }: LocaleParams) {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(params), getSchoolViewer()]);
  gateSchool(viewer, locale, schoolHome(locale));
  const t = aifbT(locale);
  const userId = viewer.userId!;

  if (isSchoolTeacher(viewer) && viewer.teacherOf.length > 0) {
    const [groups, assignedClasses] = await Promise.all([
      listGroups(userId),
      teacherSchoolClasses(userId, viewer.teacherOf.map((s) => s.id)),
    ]);
    const titles = new Map<CategoryId, string>();
    const withStats = await Promise.all((groups ?? []).map(async (group) => {
      if (!titles.has(group.category)) titles.set(group.category, (await schoolCourse(group.category, locale, t)).title);
      const report = await groupReport(group);
      const late = [...report.perAssignment.values()].reduce((sum, a) => sum + a.late, 0);
      return { ...group, courseTitle: titles.get(group.category) ?? "", late };
    }));
    return (
      <SchoolFrame locale={locale} viewer={viewer} active="home">
        {groups === null ? <p className="aifb-callout" role="alert">{t("school.loadFailed")}</p> : null}
        <TeacherHome t={t} locale={locale} groups={withStats} assignedClasses={assignedClasses} />
      </SchoolFrame>
    );
  }

  if (viewer.student) {
    const access = await getViewer();
    const categories = [...new Set(access.classes.map((c) => c.category))].filter(isCategoryId);
    const [courses, assignments, progress] = await Promise.all([
      Promise.all(categories.map((c) => schoolCourse(c, locale, t))),
      studentAssignments(access.classes.map((c) => ({ id: c.id, name: c.name }))),
      progressOf([userId]),
    ]);
    return (
      <SchoolFrame locale={locale} viewer={viewer} active="home">
        <StudentHome
          t={t}
          locale={locale}
          firstName={viewer.student.firstName}
          courses={courses}
          unlocked={access.unlocked}
          assignments={assignments}
          progress={new Map(progress.map((row) => [row.lessonId, row.status]))}
        />
      </SchoolFrame>
    );
  }

  redirect(viewer.adminOf.length > 0 ? schoolManagePath(locale) : schoolAdminPath(locale));
}
