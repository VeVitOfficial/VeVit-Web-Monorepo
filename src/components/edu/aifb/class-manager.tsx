"use client";

// Správa jedné třídy: kód pro žáky, seznam žáků, odemykání lekcí (teorie i cvičení) po jedné nebo
// po celém bloku / levelu a nastavení třídy. Změny odemčení se ukládají hned po kliknutí.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { formatClassCode } from "@/lib/edu/aifb/access";
import { teacherPath } from "@/lib/edu/aifb/routes";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { postAifb } from "./api-client";
import { CopyCode } from "./copy-code";

export type ManagedLevel = { id: string; code: string; title: string; lessons: { id: string; kind: string; title: string }[] };
export type ManagedStudent = { userId: string; name: string; joinedAt: string };

export function ClassManager({
  locale, classId, name, code, categoryTitle, levels, unlocked, students, csrfToken,
}: {
  locale: EduLocale;
  classId: string;
  name: string;
  code: string;
  categoryTitle: string;
  levels: ManagedLevel[];
  unlocked: string[];
  students: ManagedStudent[];
  csrfToken: string | null;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [open, setOpen] = useState(() => new Set(unlocked));
  const [currentCode, setCurrentCode] = useState(code);
  const [newName, setNewName] = useState(name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    const result = await postAifb("tridy", { class_id: classId, ...body }, csrfToken);
    setBusy(false);
    if (!result.ok) setMessage(t("aifb.teacher.failed"));
    return result;
  };

  async function toggle(lessonIds: string[], unlock: boolean) {
    const before = new Set(open);
    const after = new Set(open);
    for (const id of lessonIds) {
      if (unlock) after.add(id);
      else after.delete(id);
    }
    setOpen(after);
    const result = await call({ action: unlock ? "unlock" : "lock", lessons: lessonIds });
    if (result.ok) setMessage(t("aifb.class.saved"));
    else setOpen(before);
  }

  async function removeStudent(student: ManagedStudent) {
    const label = student.name || t("aifb.class.unnamed");
    if (!window.confirm(t("aifb.class.removeConfirm", { name: label }))) return;
    if ((await call({ action: "remove_student", user_id: student.userId })).ok) {
      setMessage(t("aifb.class.removed"));
      router.refresh();
    }
  }

  async function newCode() {
    if (!window.confirm(t("aifb.class.newCodeConfirm"))) return;
    const result = await call({ action: "new_code" });
    if (result.ok && typeof result.code === "string") {
      setCurrentCode(result.code);
      setMessage(t("aifb.class.newCodeDone", { code: formatClassCode(result.code) }));
    }
  }

  async function rename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    if ((await call({ action: "rename", name: newName.trim() })).ok) {
      setMessage(t("aifb.class.renamed"));
      router.refresh();
    }
  }

  async function archive() {
    if (!window.confirm(t("aifb.class.archiveConfirm", { name }))) return;
    if ((await call({ action: "archive" })).ok) router.push(teacherPath(locale));
  }

  return (
    <>
      <header className="aifb-head">
        <p className="aifb-eyebrow">{categoryTitle}</p>
        <h1>{name}</h1>
        <p className="aifb-class-card__code">
          <span className="aifb-muted">{t("aifb.teacher.code")}</span>{" "}
          <strong className="aifb-code">{formatClassCode(currentCode)}</strong>{" "}
          <CopyCode code={formatClassCode(currentCode)} />
        </p>
        <p className="aifb-muted">{t("aifb.teacher.howJoin")}</p>
        <p className="aifb-status" role="status" aria-live="polite">{message}</p>
      </header>

      <section className="aifb-section" aria-labelledby="aifb-unlocks">
        <h2 className="eh-h2" id="aifb-unlocks"><span className="eh-bullet" aria-hidden="true" />{t("aifb.class.unlockTitle")}</h2>
        <p className="aifb-muted">{t("aifb.class.unlockLead")}</p>
        <div className="aifb-unlock-grid">
          {levels.map((level) => {
            const ids = level.lessons.map((lesson) => lesson.id);
            const count = ids.filter((id) => open.has(id)).length;
            return (
              <fieldset key={level.id} className="aifb-unlock">
                <legend>{level.code}: {level.title} <span className="aifb-badge">{count} / {ids.length}</span></legend>
                <ul className="aifb-unlock__list">
                  {level.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <label className="aifb-unlock__item">
                        <input type="checkbox" checked={open.has(lesson.id)} disabled={busy} onChange={(e) => toggle([lesson.id], e.target.checked)} />
                        <span><strong>{lesson.kind}</strong> {lesson.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="aifb-unlock__actions">
                  <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy || count === ids.length} onClick={() => toggle(ids, true)}>{t("aifb.class.unlockAll")}</button>
                  <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy || count === 0} onClick={() => toggle(ids, false)}>{t("aifb.class.lockAll")}</button>
                </p>
              </fieldset>
            );
          })}
        </div>
      </section>

      <section className="aifb-section" aria-labelledby="aifb-students">
        <h2 className="eh-h2" id="aifb-students"><span className="eh-bullet" aria-hidden="true" />{t("aifb.class.students")} ({students.length})</h2>
        {students.length === 0 ? <p className="aifb-muted">{t("aifb.class.noStudents")}</p> : (
          <ul className="aifb-student-list">
            {students.map((student) => (
              <li key={student.userId}>
                <span>
                  <strong>{student.name || t("aifb.class.unnamed")}</strong>{" "}
                  <span className="aifb-muted">{t("aifb.class.joined", { date: date.format(new Date(student.joinedAt)) })}</span>
                </span>
                <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => removeStudent(student)}>{t("aifb.class.remove")}</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="aifb-section" aria-labelledby="aifb-class-settings">
        <h2 className="eh-h2" id="aifb-class-settings"><span className="eh-bullet" aria-hidden="true" />{t("aifb.class.settings")}</h2>
        <form className="aifb-form" onSubmit={rename}>
          <label className="aifb-form__field">
            <span>{t("aifb.teacher.name")}</span>
            <input type="text" value={newName} maxLength={80} required onChange={(e) => setNewName(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-ghost" disabled={busy || !newName.trim() || newName.trim() === name}>{t("aifb.class.rename")}</button>
        </form>
        <p className="aifb-unlock__actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={newCode}>{t("aifb.class.newCode")}</button>
          <button type="button" className="btn btn-ghost aifb-btn-danger" disabled={busy} onClick={archive}>{t("aifb.class.archive")}</button>
        </p>
      </section>
    </>
  );
}
