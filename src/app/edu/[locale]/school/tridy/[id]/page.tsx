// /edu/school/tridy/[id] → detail třídy učitele: lekce (odemknout / zadat), průběh žáků, žáci, nastavení.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { classUnlocks } from "@/lib/edu/aifb/classes";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { gateTeacher } from "@/lib/edu/school/gate";
import { schoolCourse } from "@/lib/edu/school/lessons";
import { groupReport } from "@/lib/edu/school/report";
import { fullName, schoolGroupPath } from "@/lib/edu/school/school";
import { groupForTeacher, schoolDetail, studentsOfSchoolClasses, teacherSchoolClasses } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { GroupManager } from "@/components/edu/school/group-manager";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const t = aifbT(await readEduLocale(params));
  return { title: `${t("school.nav.groups")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolGroupRoute({ params }: Props) {
  await connection();
  const [{ id }, locale, viewer] = await Promise.all([params, readEduLocale(params), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolGroupPath(locale, id));
  const group = await groupForTeacher(id, { userId: viewer.userId!, isAdmin: viewer.isAdmin });
  if (!group) notFound();
  const t = aifbT(locale);

  const visibleClasses = viewer.isAdmin && group.teacherId !== viewer.userId
    ? (await schoolDetail(group.schoolId))?.classes ?? []
    : await teacherSchoolClasses(group.teacherId, [group.schoolId]);
  const [course, unlocked, report, pool, detail] = await Promise.all([
    schoolCourse(group.category, locale, t),
    classUnlocks(group.id),
    groupReport(group),
    studentsOfSchoolClasses(visibleClasses.map((c) => c.id)),
    schoolDetail(group.schoolId),
  ]);
  const classNames = new Map((detail?.classes ?? []).map((c) => [c.id, c.name]));
  const memberIds = new Set(report.students.map((s) => s.userId));
  const states: Record<string, Record<string, "todo" | "started" | "done">> = {};
  for (const [userId, lessons] of report.states) states[userId] = Object.fromEntries(lessons);

  return (
    <SchoolFrame locale={locale} viewer={viewer} active="groups">
      <GroupManager
        locale={locale}
        groupId={group.id}
        name={group.name}
        courseTitle={course.title}
        levels={course.levels}
        unlocked={unlocked}
        assignments={report.assignments}
        students={report.students.map((s) => ({
          userId: s.userId, name: fullName(s), className: classNames.get(s.classId) ?? "", lastActivity: report.lastActivity.get(s.userId) ?? null,
        }))}
        candidates={pool.filter((s) => !memberIds.has(s.userId)).map((s) => ({
          userId: s.userId, name: fullName(s), className: classNames.get(s.classId) ?? "", lastActivity: null,
        }))}
        states={states}
        csrfToken={viewer.csrfToken}
      />
    </SchoolFrame>
  );
}
