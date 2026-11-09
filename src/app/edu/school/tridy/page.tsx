// /edu/school/tridy → Moje třídy (učitel): seznam vlastních tříd a založení nové z kmenových tříd,
// které učiteli přidělil správce školy.
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { getCatalog } from "@/lib/edu/aifb/content";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { CONTENT_CATEGORY_IDS } from "@/lib/edu/aifb/types";
import { gateTeacher } from "@/lib/edu/school/gate";
import { fullName, schoolGroupPath, schoolGroupsPath } from "@/lib/edu/school/school";
import { listGroups, studentsOfSchoolClasses, teacherSchoolClasses } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { GroupCreate } from "@/components/edu/school/group-create";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("school.nav.groups")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolGroupsRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolGroupsPath(locale));
  const t = aifbT(locale);
  const userId = viewer.userId!;
  const [groups, classes] = await Promise.all([listGroups(userId), teacherSchoolClasses(userId, viewer.teacherOf.map((s) => s.id))]);
  const students = await studentsOfSchoolClasses(classes.map((c) => c.id));
  const courses = getCatalog().categories
    .filter((c) => (CONTENT_CATEGORY_IDS as readonly string[]).includes(c.id))
    .map((c) => ({ id: c.id, title: c.title }));
  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  return (
    <SchoolFrame locale={locale} viewer={viewer} active="groups">
      <header className="aifb-head">
        <h1>{t("school.nav.groups")}</h1>
        <p className="aifb-lead">{t("school.groups.lead")}</p>
      </header>

      <section className="aifb-section" aria-labelledby="school-groups-list">
        <h2 className="eh-h2" id="school-groups-list"><span className="eh-bullet" aria-hidden="true" />{t("school.groups.list")}</h2>
        {groups === null ? <p className="aifb-callout" role="alert">{t("school.loadFailed")}</p> : groups.length === 0 ? (
          <p className="aifb-muted">{t("school.groups.none")}</p>
        ) : (
          <ul className="aifb-class-list">
            {groups.map((group) => (
              <li key={group.id} className="aifb-class-card">
                <p className="aifb-class-card__title"><Link href={schoolGroupPath(locale, group.id)}>{group.name}</Link></p>
                <p className="aifb-muted">{courseTitle(group.category)}</p>
                <p className="aifb-chips">
                  <span className="aifb-badge">{t("school.groups.students", { n: group.students })}</span>
                  <span className="aifb-badge">{t("school.groups.unlocked", { n: group.unlocked })}</span>
                  <span className="aifb-badge">{t("school.groups.assigned", { n: group.assigned })}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="aifb-section" aria-labelledby="school-groups-new">
        <h2 className="eh-h2" id="school-groups-new"><span className="eh-bullet" aria-hidden="true" />{t("school.groups.new")}</h2>
        <GroupCreate
          locale={locale}
          schools={viewer.teacherOf}
          courses={courses}
          classes={classes}
          students={students.map((s) => ({ userId: s.userId, name: fullName(s), classId: s.classId }))}
          csrfToken={viewer.csrfToken}
        />
      </section>
    </SchoolFrame>
  );
}
