"use client";

// Správa školy (správce školy, VeVit admin): kód školy pro žáky, kmenové třídy, učitelé a jejich
// přidělení ke kmenovým třídám, žáci (přesun do jiné kmenové třídy, odebrání ze školy).

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { formatSchoolCode } from "@/lib/edu/school/school";
import { CopyCode } from "../aifb/copy-code";
import { postSchool } from "./api-client";

export type SmClass = { id: string; name: string; category: string; students: number; teacherIds: string[] };
export type SmTeacher = { userId: string; label: string };
export type SmStudent = { userId: string; name: string; classId: string; joinedAt: string };

const ERRORS: Record<string, string> = {
  unknown_user: "school.manage.unknownUser",
  duplicate: "school.manage.duplicate",
  not_empty: "school.manage.notEmpty",
};

export function SchoolManager({
  locale, schoolId, name, code, courses, classes, teachers, students, csrfToken,
}: {
  locale: string;
  schoolId: string;
  name: string;
  code: string;
  courses: { id: string; title: string }[];
  classes: SmClass[];
  teachers: SmTeacher[];
  students: SmStudent[];
  csrfToken: string | null;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [currentCode, setCurrentCode] = useState(code);
  const [className, setClassName] = useState("");
  const [classCourse, setClassCourse] = useState(courses[0]?.id ?? "");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const classLabel = (id: string) => classes.find((c) => c.id === id)?.name ?? "";
  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const call = async (body: Record<string, unknown>, refresh = true) => {
    setBusy(true);
    setMessage("");
    const result = await postSchool("sprava", { school_id: schoolId, ...body }, csrfToken);
    setBusy(false);
    setMessage(result.ok ? t("school.saved") : t(ERRORS[result.error ?? ""] ?? "school.failed"));
    if (result.ok && refresh) router.refresh();
    return result;
  };

  async function newCode() {
    if (!window.confirm(t("school.manage.newCodeConfirm"))) return;
    const result = await call({ action: "new_code" }, false);
    if (result.ok && typeof result.code === "string") setCurrentCode(result.code);
  }

  async function addClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((await call({ action: "add_class", name: className, category: classCourse })).ok) setClassName("");
  }

  async function renameClass(klass: SmClass) {
    const next = window.prompt(t("school.manage.renamePrompt"), klass.name);
    if (next && next.trim() && next.trim() !== klass.name) await call({ action: "rename_class", class_id: klass.id, name: next.trim() });
  }

  async function addTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((await call({ action: "add_teacher", email: teacherEmail })).ok) setTeacherEmail("");
  }

  async function removeTeacher(teacher: SmTeacher) {
    if (window.confirm(t("school.manage.removeTeacherConfirm", { name: teacher.label }))) await call({ action: "remove_teacher", user_id: teacher.userId });
  }

  async function removeStudent(student: SmStudent) {
    if (window.confirm(t("school.manage.removeStudentConfirm", { name: student.name }))) await call({ action: "remove_student", user_id: student.userId });
  }

  const shown = students.filter((s) => !filter || s.classId === filter);

  return (
    <>
      <header className="aifb-head">
        <p className="aifb-eyebrow">{t("school.nav.manage")}</p>
        <h1>{name}</h1>
        <p className="aifb-class-card__code">
          <span className="aifb-muted">{t("school.manage.code")}</span>{" "}
          <strong className="aifb-code">{formatSchoolCode(currentCode)}</strong>{" "}
          <CopyCode code={formatSchoolCode(currentCode)} />{" "}
          <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={newCode}>{t("school.manage.newCode")}</button>
        </p>
        <p className="aifb-muted">{t("school.manage.codeHint")}</p>
        <p className="aifb-status" role="status" aria-live="polite">{message}</p>
      </header>

      <section className="aifb-section" aria-labelledby="school-manage-classes">
        <h2 className="eh-h2" id="school-manage-classes"><span className="eh-bullet" aria-hidden="true" />{t("school.manage.classes")}</h2>
        <p className="aifb-muted">{t("school.manage.classesLead")}</p>
        {classes.length === 0 ? <p className="aifb-callout" role="note">{t("school.manage.noClasses")}</p> : (
          <div className="aifb-table-wrap">
            <table className="aifb-table">
              <thead>
                <tr>
                  <th scope="col">{t("school.manage.class")}</th>
                  <th scope="col">{t("school.groups.course")}</th>
                  <th scope="col">{t("school.stat.students")}</th>
                  <th scope="col">{t("school.manage.teachers")}</th>
                  <th scope="col"><span className="sr-only">{t("school.group.actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {classes.map((klass) => (
                  <tr key={klass.id}>
                    <th scope="row">{klass.name}</th>
                    <td>{courseTitle(klass.category)}</td>
                    <td>{klass.students}</td>
                    <td>
                      {teachers.length === 0 ? <span className="aifb-muted">{t("school.manage.noTeachers")}</span> : (
                        <ul className="aifb-unlock__list">
                          {teachers.map((teacher) => (
                            <li key={teacher.userId}>
                              <label className="aifb-unlock__item">
                                <input
                                  type="checkbox"
                                  checked={klass.teacherIds.includes(teacher.userId)}
                                  disabled={busy}
                                  onChange={(e) => call({ action: "assign_teacher", class_id: klass.id, teacher_id: teacher.userId, assigned: e.target.checked })}
                                />
                                <span>{teacher.label}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      <span className="school-actions">
                        <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => renameClass(klass)}>{t("aifb.class.rename")}</button>
                        <button type="button" className="btn btn-ghost aifb-btn-sm aifb-btn-danger" disabled={busy} onClick={() => call({ action: "archive_class", class_id: klass.id })}>{t("school.manage.archiveClass")}</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form className="aifb-form" onSubmit={addClass}>
          <label className="aifb-form__field">
            <span>{t("school.manage.className")}</span>
            <input type="text" value={className} maxLength={20} required placeholder="7.A" onChange={(e) => setClassName(e.target.value)} />
          </label>
          <label className="aifb-form__field">
            <span>{t("school.groups.course")}</span>
            <select value={classCourse} onChange={(e) => setClassCourse(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || !className.trim()}>{t("school.manage.addClass")}</button>
        </form>
      </section>

      <section className="aifb-section" aria-labelledby="school-manage-teachers">
        <h2 className="eh-h2" id="school-manage-teachers"><span className="eh-bullet" aria-hidden="true" />{t("school.manage.teachers")} ({teachers.length})</h2>
        <p className="aifb-muted">{t("school.manage.teachersLead")}</p>
        {teachers.length > 0 ? (
          <ul className="aifb-student-list">
            {teachers.map((teacher) => (
              <li key={teacher.userId}>
                <span>
                  <strong>{teacher.label}</strong>{" "}
                  <span className="aifb-muted">{classes.filter((c) => c.teacherIds.includes(teacher.userId)).map((c) => c.name).join(", ") || t("school.manage.noClassesAssigned")}</span>
                </span>
                <button type="button" className="btn btn-ghost aifb-btn-sm aifb-btn-danger" disabled={busy} onClick={() => removeTeacher(teacher)}>{t("school.manage.removeTeacher")}</button>
              </li>
            ))}
          </ul>
        ) : null}
        <form className="aifb-form" onSubmit={addTeacher}>
          <label className="aifb-form__field">
            <span>{t("school.manage.teacherEmail")}</span>
            <input type="email" value={teacherEmail} maxLength={200} required onChange={(e) => setTeacherEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || !teacherEmail.trim()}>{t("school.manage.addTeacher")}</button>
        </form>
      </section>

      <section className="aifb-section" aria-labelledby="school-manage-students">
        <div className="school-row">
          <h2 className="eh-h2" id="school-manage-students"><span className="eh-bullet" aria-hidden="true" />{t("school.stat.students")} ({students.length})</h2>
          <label className="school-actions">
            <span className="aifb-muted">{t("school.manage.filter")}</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">{t("school.manage.allClasses")}</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <p className="aifb-muted">{t("school.manage.studentsLead")}</p>
        {shown.length === 0 ? <p className="aifb-muted">{t("school.groups.noStudents")}</p> : (
          <ul className="aifb-student-list">
            {shown.map((student) => (
              <li key={student.userId}>
                <span>
                  <strong>{student.name}</strong>{" "}
                  <span className="aifb-muted">{classLabel(student.classId)} · {t("aifb.class.joined", { date: date.format(new Date(student.joinedAt)) })}</span>
                </span>
                <span className="school-actions">
                  <label>
                    <span className="sr-only">{t("school.manage.move", { name: student.name })}</span>
                    <select
                      value={student.classId}
                      disabled={busy}
                      onChange={(e) => call({ action: "move_student", user_id: student.userId, class_id: e.target.value })}
                    >
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn btn-ghost aifb-btn-sm aifb-btn-danger" disabled={busy} onClick={() => removeStudent(student)}>{t("school.manage.removeStudent")}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
