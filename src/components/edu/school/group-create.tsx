"use client";

// Založení třídy učitele: název, kurz (kategorie AIFB) a žáci. Buď celá kmenová třída (noví žáci
// té kmenové třídy se přidají sami), nebo vybraní žáci z kmenových tříd přidělených správcem.

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useEduLang } from "../i18n";
import { schoolGroupPath } from "@/lib/edu/school/school";
import { postSchool } from "./api-client";

export type PickClass = { id: string; name: string; category: string; schoolId: string };
export type PickStudent = { userId: string; name: string; classId: string };

export function GroupCreate({
  locale, schools, courses, classes, students, csrfToken,
}: {
  locale: string;
  schools: { id: string; name: string }[];
  courses: { id: string; title: string }[];
  classes: PickClass[];
  students: PickStudent[];
  csrfToken: string | null;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [course, setCourse] = useState(courses[0]?.id ?? "");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const schoolClasses = useMemo(() => classes.filter((c) => c.schoolId === schoolId), [classes, schoolId]);
  const pickable = students.filter((s) => schoolClasses.some((c) => c.id === s.classId));
  const className = (id: string) => schoolClasses.find((c) => c.id === id)?.name ?? "";

  function chooseSource(id: string) {
    setSource(id);
    const klass = schoolClasses.find((c) => c.id === id);
    if (klass) {
      setCourse(klass.category);
      if (!name.trim()) setName(klass.name);
    }
  }

  function toggle(userId: string, on: boolean) {
    const next = new Set(picked);
    if (on) next.add(userId);
    else next.delete(userId);
    setPicked(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !course || !schoolId) return;
    setBusy(true);
    const result = await postSchool("ucitel", {
      action: "create_group", school_id: schoolId, name: name.trim(), category: course,
      source_class_id: source || null, student_ids: source ? [] : [...picked],
    }, csrfToken);
    setBusy(false);
    if (result.ok && typeof result.id === "string") router.push(schoolGroupPath(locale, result.id));
    else setMessage(t("school.failed"));
  }

  if (schoolClasses.length === 0 && schools.length <= 1) {
    return <p className="aifb-callout" role="note">{t("school.teacher.noAssigned")}</p>;
  }

  return (
    <form className="aifb-class-card" onSubmit={submit}>
      <p className="aifb-class-card__title">{t("school.groups.createTitle")}</p>
      <div className="aifb-form">
        {schools.length > 1 ? (
          <label className="aifb-form__field">
            <span>{t("school.groups.school")}</span>
            <select value={schoolId} onChange={(e) => { setSchoolId(e.target.value); setSource(""); setPicked(new Set()); }}>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        ) : null}
        <label className="aifb-form__field">
          <span>{t("school.groups.from")}</span>
          <select value={source} onChange={(e) => chooseSource(e.target.value)}>
            <option value="">{t("school.groups.fromPick")}</option>
            {schoolClasses.map((c) => <option key={c.id} value={c.id}>{t("school.groups.fromClass", { name: c.name })}</option>)}
          </select>
        </label>
        <label className="aifb-form__field">
          <span>{t("school.groups.name")}</span>
          <input type="text" value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} placeholder={t("school.groups.namePlaceholder")} />
        </label>
        <label className="aifb-form__field">
          <span>{t("school.groups.course")}</span>
          <select value={course} onChange={(e) => setCourse(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
      </div>
      {source ? (
        <p className="aifb-muted">{t("school.groups.fromHint", { name: className(source) })}</p>
      ) : (
        <fieldset className="aifb-unlock">
          <legend>{t("school.groups.pickStudents")} <span className="aifb-badge">{picked.size}</span></legend>
          {pickable.length === 0 ? <p className="aifb-muted">{t("school.groups.noStudents")}</p> : (
            <ul className="school-pick">
              {pickable.map((s) => (
                <li key={s.userId}>
                  <label className="aifb-unlock__item">
                    <input type="checkbox" checked={picked.has(s.userId)} onChange={(e) => toggle(s.userId, e.target.checked)} />
                    <span>{s.name} <span className="aifb-muted">{className(s.classId)}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      )}
      <p className="aifb-unlock__actions">
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>{t("school.groups.create")}</button>
      </p>
      <p className="aifb-status" role="status" aria-live="polite">{message}</p>
    </form>
  );
}
