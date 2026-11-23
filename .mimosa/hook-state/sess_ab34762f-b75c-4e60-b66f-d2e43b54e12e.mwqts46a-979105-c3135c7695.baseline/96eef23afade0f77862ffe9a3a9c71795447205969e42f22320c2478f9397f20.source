// Přehled učitele: počty (třídy, žáci, zadané úkoly, po termínu), třídy s odkazem na detail
// a rychlé odkazy do menu. Jen serverová komponenta.

import Link from "next/link";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import { schoolContentPath, schoolGroupPath, schoolGroupsPath, schoolProgressPath } from "@/lib/edu/school/school";
import type { GroupSummary, TeacherSchoolClass } from "@/lib/edu/school/store";

export type TeacherHomeGroup = GroupSummary & { courseTitle: string; late: number };

export function TeacherHome({
  t, locale, groups, assignedClasses,
}: { t: AifbT; locale: string; groups: TeacherHomeGroup[]; assignedClasses: TeacherSchoolClass[] }) {
  const students = groups.reduce((sum, g) => sum + g.students, 0);
  const assigned = groups.reduce((sum, g) => sum + g.assigned, 0);
  const late = groups.reduce((sum, g) => sum + g.late, 0);
  return (
    <>
      <header className="aifb-head">
        <h1>{t("school.teacher.title")}</h1>
        <p className="aifb-lead">{t("school.teacher.lead")}</p>
      </header>

      <ul className="school-stats">
        <li className="school-stat"><strong>{groups.length}</strong><span>{t("school.stat.groups")}</span></li>
        <li className="school-stat"><strong>{students}</strong><span>{t("school.stat.students")}</span></li>
        <li className="school-stat"><strong>{assigned}</strong><span>{t("school.stat.assigned")}</span></li>
        <li className="school-stat"><strong>{late}</strong><span>{t("school.stat.late")}</span></li>
      </ul>

      {assignedClasses.length === 0 ? (
        <p className="aifb-callout" role="note">{t("school.teacher.noAssigned")}</p>
      ) : (
        <p className="aifb-muted">{t("school.teacher.assigned", { classes: assignedClasses.map((c) => c.name).join(", ") })}</p>
      )}

      <section className="aifb-section" aria-labelledby="school-home-groups">
        <div className="school-row">
          <h2 className="eh-h2" id="school-home-groups"><span className="eh-bullet" aria-hidden="true" />{t("school.nav.groups")}</h2>
          <Link className="btn btn-ghost aifb-btn-sm" href={schoolGroupsPath(locale)}>{t("school.groups.manage")}</Link>
        </div>
        {groups.length === 0 ? <p className="aifb-muted">{t("school.groups.none")}</p> : (
          <ul className="aifb-class-list">
            {groups.map((group) => (
              <li key={group.id} className="aifb-class-card">
                <p className="aifb-class-card__title"><Link href={schoolGroupPath(locale, group.id)}>{group.name}</Link></p>
                <p className="aifb-muted">{group.courseTitle}</p>
                <p className="aifb-chips">
                  <span className="aifb-badge">{t("school.groups.students", { n: group.students })}</span>
                  <span className="aifb-badge">{t("school.groups.unlocked", { n: group.unlocked })}</span>
                  <span className="aifb-badge">{t("school.groups.assigned", { n: group.assigned })}</span>
                  {group.late > 0 ? <span className="aifb-badge">{t("school.groups.late", { n: group.late })}</span> : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="aifb-section" aria-labelledby="school-home-next">
        <h2 className="eh-h2" id="school-home-next"><span className="eh-bullet" aria-hidden="true" />{t("school.teacher.next")}</h2>
        <ul className="aifb-link-list">
          <li><Link href={schoolContentPath(locale)}>{t("school.teacher.nextContent")}</Link></li>
          <li><Link href={schoolGroupsPath(locale)}>{t("school.teacher.nextGroup")}</Link></li>
          <li><Link href={schoolProgressPath(locale)}>{t("school.teacher.nextProgress")}</Link></li>
        </ul>
      </section>
    </>
  );
}
