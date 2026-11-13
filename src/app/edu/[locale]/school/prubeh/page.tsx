// /edu/school/prubeh → Průběh žáků (učitel): po třídách, u každého žáka splněné zadané lekce,
// lekce po termínu, hotové lekce celkem a poslední aktivita. Podrobná tabulka je v detailu třídy.
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { gateTeacher } from "@/lib/edu/school/gate";
import { groupReport } from "@/lib/edu/school/report";
import { fullName, schoolGroupPath, schoolProgressPath } from "@/lib/edu/school/school";
import { listGroups } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const t = aifbT(await readEduLocale(params));
  return { title: `${t("school.nav.progress")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolProgressRoute({ params }: LocaleParams) {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(params), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolProgressPath(locale));
  const t = aifbT(locale);
  const groups = (await listGroups(viewer.userId!)) ?? [];
  const reports = await Promise.all(groups.map(async (group) => ({ group, report: await groupReport(group) })));
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <SchoolFrame locale={locale} viewer={viewer} active="progress">
      <header className="aifb-head">
        <h1>{t("school.nav.progress")}</h1>
        <p className="aifb-lead">{t("school.progress.lead")}</p>
      </header>
      {reports.length === 0 ? <p className="aifb-muted">{t("school.groups.none")}</p> : reports.map(({ group, report }) => (
        <section key={group.id} className="aifb-section" aria-labelledby={`school-progress-${group.id}`}>
          <div className="school-row">
            <h2 className="eh-h2" id={`school-progress-${group.id}`}><span className="eh-bullet" aria-hidden="true" />{group.name}</h2>
            <Link className="btn btn-ghost aifb-btn-sm" href={schoolGroupPath(locale, group.id)}>{t("school.progress.detail")}</Link>
          </div>
          {report.students.length === 0 ? <p className="aifb-muted">{t("school.groups.noStudents")}</p> : (
            <div className="aifb-table-wrap">
              <table className="aifb-table">
                <thead>
                  <tr>
                    <th scope="col">{t("school.group.student")}</th>
                    <th scope="col">{t("school.progress.tasksDone", { n: report.assignments.length })}</th>
                    <th scope="col">{t("school.task.late")}</th>
                    <th scope="col">{t("school.progress.lessonsDone")}</th>
                    <th scope="col">{t("school.group.last")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.students.map((student) => {
                    const mine = report.perStudent.get(student.userId) ?? { done: 0, late: 0 };
                    const done = [...(report.states.get(student.userId)?.values() ?? [])].filter((s) => s === "done").length;
                    const last = report.lastActivity.get(student.userId);
                    return (
                      <tr key={student.userId}>
                        <th scope="row">{fullName(student)}</th>
                        <td>{mine.done} / {report.assignments.length}</td>
                        <td>{mine.late}</td>
                        <td>{done}</td>
                        <td>{last ? date.format(new Date(last)) : "–"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </SchoolFrame>
  );
}
