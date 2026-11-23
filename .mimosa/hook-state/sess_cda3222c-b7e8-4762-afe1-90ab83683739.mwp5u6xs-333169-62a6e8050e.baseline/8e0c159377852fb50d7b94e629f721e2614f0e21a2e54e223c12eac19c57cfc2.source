"use client";

// Detail třídy učitele (VeVit Edu pro školy):
//   Lekce    odemknout / zamknout (po jedné i celý level), zadat jako úkol s termínem a poznámkou,
//   Průběh   tabulka žák × lekce (hotovo / rozpracováno / po termínu), splněné úkoly, reset průběhu,
//   Žáci     přidání žáků z přidělených kmenových tříd, odebrání jen z této třídy,
//   Nastavení přejmenování a zrušení třídy.
// Zadaná lekce je pro žáka zároveň odemčená.

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useEduLang } from "../i18n";
import { assignmentState, schoolGroupsPath } from "@/lib/edu/school/school";
import { postSchool } from "./api-client";

export type GmLesson = { id: string; kind: string; title: string; href: string };
export type GmLevel = { id: string; code: string; title: string; lessons: GmLesson[] };
export type GmStudent = { userId: string; name: string; className: string; lastActivity: string | null };
export type GmAssignment = { lessonId: string; dueAt: string | null; note: string };
type Cell = "todo" | "started" | "done";

const TABS = ["lessons", "progress", "students", "settings"] as const;
type Tab = (typeof TABS)[number];

export function GroupManager({
  locale, groupId, name, courseTitle, levels, unlocked, assignments, students, candidates, states, csrfToken,
}: {
  locale: string;
  groupId: string;
  name: string;
  courseTitle: string;
  levels: GmLevel[];
  unlocked: string[];
  assignments: GmAssignment[];
  students: GmStudent[];
  /** Žáci přidělených kmenových tříd, kteří ve třídě nejsou. */
  candidates: GmStudent[];
  /** userId → lessonId → stav */
  states: Record<string, Record<string, Cell>>;
  csrfToken: string | null;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("lessons");
  const [open, setOpen] = useState(() => new Set(unlocked));
  const [tasks, setTasks] = useState(() => new Map(assignments.map((a) => [a.lessonId, a])));
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");
  const [newName, setNewName] = useState(name);
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const lessonById = useMemo(() => new Map(levels.flatMap((l) => l.lessons.map((x) => [x.id, { ...x, level: l }] as const))), [levels]);

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMessage("");
    const result = await postSchool("ucitel", { group_id: groupId, ...body }, csrfToken);
    setBusy(false);
    setMessage(result.ok ? t("school.saved") : t("school.failed"));
    return result.ok;
  };

  async function toggleUnlock(ids: string[], unlock: boolean) {
    const before = new Set(open);
    const after = new Set(open);
    for (const id of ids) {
      if (unlock) after.add(id);
      else after.delete(id);
    }
    setOpen(after);
    if (!(await call({ action: unlock ? "unlock" : "lock", lessons: ids }))) setOpen(before);
  }

  async function assign(ids: string[]) {
    // Termín je konec zvoleného dne v místním čase.
    const dueAt = due ? new Date(`${due}T23:59:00`).toISOString() : null;
    if (await call({ action: "assign", lessons: ids, due_at: dueAt, note })) {
      const next = new Map(tasks);
      for (const id of ids) next.set(id, { lessonId: id, dueAt, note });
      setTasks(next);
    }
  }

  async function unassign(ids: string[]) {
    if (await call({ action: "unassign", lessons: ids })) {
      const next = new Map(tasks);
      for (const id of ids) next.delete(id);
      setTasks(next);
    }
  }

  async function reset(student: GmStudent) {
    if (!window.confirm(t("school.group.resetConfirm", { name: student.name }))) return;
    if (await call({ action: "reset", user_ids: [student.userId] })) router.refresh();
  }

  async function removeMember(student: GmStudent) {
    if (!window.confirm(t("school.group.removeConfirm", { name: student.name }))) return;
    if (await call({ action: "remove_member", user_id: student.userId })) router.refresh();
  }

  async function addMembers() {
    if (adding.size === 0) return;
    if (await call({ action: "add_members", user_ids: [...adding] })) {
      setAdding(new Set());
      router.refresh();
    }
  }

  async function rename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newName.trim() && (await call({ action: "rename", name: newName.trim() }))) router.refresh();
  }

  async function archive() {
    if (!window.confirm(t("school.group.archiveConfirm", { name }))) return;
    if (await call({ action: "archive" })) router.push(schoolGroupsPath(locale));
  }

  const cell = (userId: string, lessonId: string): Cell => states[userId]?.[lessonId] ?? "todo";
  const shownLevels = levels.filter((l) => l.lessons.some((x) => open.has(x.id) || tasks.has(x.id)));
  const taskList = [...tasks.values()].filter((a) => lessonById.has(a.lessonId));

  return (
    <>
      <header className="aifb-head">
        <p className="aifb-eyebrow">{courseTitle}</p>
        <h1>{name}</h1>
        <p className="aifb-muted">{t("school.groups.students", { n: students.length })}</p>
        <p className="aifb-status" role="status" aria-live="polite">{message}</p>
      </header>

      <div className="aifb-chips" role="tablist" aria-label={t("school.group.tabs")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "btn btn-primary aifb-btn-sm" : "btn btn-ghost aifb-btn-sm"}
            onClick={() => setTab(key)}
          >
            {t(`school.group.tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === "lessons" ? (
        <section className="aifb-section" aria-label={t("school.group.tab.lessons")}>
          <p className="aifb-muted">{t("school.group.lessonsLead")}</p>
          <div className="aifb-class-card school-card">
            <p className="aifb-class-card__title">{t("school.group.assignSettings")}</p>
            <div className="aifb-form">
              <label className="aifb-form__field">
                <span>{t("school.group.due")}</span>
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              </label>
              <label className="aifb-form__field">
                <span>{t("school.group.note")}</span>
                <input type="text" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={t("school.group.notePlaceholder")} />
              </label>
            </div>
          </div>
          <div className="aifb-unlock-grid">
            {levels.map((level) => {
              const ids = level.lessons.map((l) => l.id);
              const count = ids.filter((id) => open.has(id) || tasks.has(id)).length;
              return (
                <fieldset key={level.id} className="aifb-unlock">
                  <legend>{level.code}: {level.title} <span className="aifb-badge">{count} / {ids.length}</span></legend>
                  <ul className="aifb-unlock__list">
                    {level.lessons.map((lesson) => {
                      const task = tasks.get(lesson.id);
                      return (
                        <li key={lesson.id} className="school-row">
                          <label className="aifb-unlock__item">
                            <input
                              type="checkbox"
                              checked={open.has(lesson.id) || !!task}
                              disabled={busy || !!task}
                              onChange={(e) => toggleUnlock([lesson.id], e.target.checked)}
                            />
                            <span><strong>{lesson.kind}</strong> {lesson.title}</span>
                          </label>
                          {task ? (
                            <span className="school-actions">
                              <span className="aifb-badge">{task.dueAt ? t("school.task.due", { date: date.format(new Date(task.dueAt)) }) : t("school.group.assigned")}</span>
                              <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => unassign([lesson.id])}>{t("school.group.unassign")}</button>
                            </span>
                          ) : (
                            <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => assign([lesson.id])}>{t("school.group.assign")}</button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="aifb-unlock__actions">
                    <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => toggleUnlock(ids, true)}>{t("aifb.class.unlockAll")}</button>
                    <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => toggleUnlock(ids, false)}>{t("aifb.class.lockAll")}</button>
                    <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => assign(ids)}>{t("school.group.assignAll")}</button>
                  </p>
                </fieldset>
              );
            })}
          </div>
        </section>
      ) : null}

      {tab === "progress" ? (
        <section className="aifb-section" aria-label={t("school.group.tab.progress")}>
          {taskList.length > 0 ? (
            <>
              <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("school.group.tasks")}</h2>
              <ul className="school-tasks">
                {taskList.map((task) => {
                  const lesson = lessonById.get(task.lessonId)!;
                  const done = students.filter((s) => cell(s.userId, task.lessonId) === "done");
                  const late = students.filter((s) => assignmentState(cell(s.userId, task.lessonId) === "done", task.dueAt) === "late");
                  return (
                    <li key={task.lessonId} className="school-task" data-state={late.length ? "late" : "open"}>
                      <span className="school-task__title">{lesson.level.code}: {lesson.kind}{lesson.title ? ` – ${lesson.title}` : ""}</span>
                      <span className="aifb-badge">{t("school.group.doneOf", { done: done.length, total: students.length })}</span>
                      <p className="school-task__meta">
                        {task.dueAt ? t("school.task.due", { date: date.format(new Date(task.dueAt)) }) : t("school.group.noDue")}
                        {late.length ? ` · ${t("school.group.lateNames", { names: late.map((s) => s.name).join(", ") })}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("school.group.matrix")}</h2>
          <p className="school-legend">
            <span><span className="school-cell" data-state="done">✓</span> {t("aifb.status.done")}</span>
            <span><span className="school-cell" data-state="started">…</span> {t("aifb.status.started")}</span>
            <span><span className="school-cell" data-state="late">!</span> {t("school.task.late")}</span>
            <span><span className="school-cell" data-state="todo">–</span> {t("aifb.status.todo")}</span>
          </p>
          {students.length === 0 || shownLevels.length === 0 ? <p className="aifb-muted">{t("school.group.matrixEmpty")}</p> : (
            <div className="aifb-table-wrap">
              <table className="aifb-table school-matrix">
                <thead>
                  <tr>
                    <th scope="col">{t("school.group.student")}</th>
                    {shownLevels.flatMap((level) => level.lessons.filter((x) => open.has(x.id) || tasks.has(x.id)).map((lesson) => (
                      <th key={lesson.id} scope="col" title={`${level.title}: ${lesson.kind} ${lesson.title}`}>{level.code}<br />{lesson.kind}</th>
                    )))}
                    <th scope="col">{t("school.group.last")}</th>
                    <th scope="col"><span className="sr-only">{t("school.group.actions")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.userId}>
                      <th scope="row">{student.name}</th>
                      {shownLevels.flatMap((level) => level.lessons.filter((x) => open.has(x.id) || tasks.has(x.id)).map((lesson) => {
                        const state = cell(student.userId, lesson.id);
                        const task = tasks.get(lesson.id);
                        const shown = task && assignmentState(state === "done", task.dueAt) === "late" ? "late" : state;
                        const mark = shown === "done" ? "✓" : shown === "started" ? "…" : shown === "late" ? "!" : "–";
                        return (
                          <td key={lesson.id}>
                            <span className="school-cell" data-state={shown} aria-label={t(shown === "late" ? "school.task.late" : `aifb.status.${shown}`)}>{mark}</span>
                          </td>
                        );
                      }))}
                      <td>{student.lastActivity ? date.format(new Date(student.lastActivity)) : "–"}</td>
                      <td><button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => reset(student)}>{t("school.group.reset")}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "students" ? (
        <section className="aifb-section" aria-label={t("school.group.tab.students")}>
          {students.length === 0 ? <p className="aifb-muted">{t("school.groups.noStudents")}</p> : (
            <ul className="aifb-student-list">
              {students.map((student) => (
                <li key={student.userId}>
                  <span><strong>{student.name}</strong> <span className="aifb-muted">{student.className}</span></span>
                  <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => removeMember(student)}>{t("school.group.remove")}</button>
                </li>
              ))}
            </ul>
          )}
          <p className="aifb-muted">{t("school.group.removeHint")}</p>
          <h2 className="eh-h2"><span className="eh-bullet" aria-hidden="true" />{t("school.group.add")}</h2>
          {candidates.length === 0 ? <p className="aifb-muted">{t("school.group.noCandidates")}</p> : (
            <>
              <ul className="school-pick">
                {candidates.map((s) => (
                  <li key={s.userId}>
                    <label className="aifb-unlock__item">
                      <input
                        type="checkbox"
                        checked={adding.has(s.userId)}
                        onChange={(e) => {
                          const next = new Set(adding);
                          if (e.target.checked) next.add(s.userId);
                          else next.delete(s.userId);
                          setAdding(next);
                        }}
                      />
                      <span>{s.name} <span className="aifb-muted">{s.className}</span></span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="aifb-unlock__actions">
                <button type="button" className="btn btn-primary" disabled={busy || adding.size === 0} onClick={addMembers}>{t("school.group.addSelected", { n: adding.size })}</button>
              </p>
            </>
          )}
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="aifb-section" aria-label={t("school.group.tab.settings")}>
          <form className="aifb-form" onSubmit={rename}>
            <label className="aifb-form__field">
              <span>{t("school.groups.name")}</span>
              <input type="text" value={newName} maxLength={80} required onChange={(e) => setNewName(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-ghost" disabled={busy || !newName.trim() || newName.trim() === name}>{t("aifb.class.rename")}</button>
          </form>
          <p className="aifb-unlock__actions">
            <button type="button" className="btn btn-ghost aifb-btn-danger" disabled={busy} onClick={archive}>{t("school.group.archive")}</button>
          </p>
        </section>
      ) : null}
    </>
  );
}
