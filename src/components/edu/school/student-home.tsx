// Portál žáka: zadané úkoly (s termínem a stavem) a lekce, které učitel odemkl, po kurzech a levelech.
// Jiné lekce žák nevidí. Stav lekcí je ze serveru (průběh žáka ve škole).

import Link from "next/link";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { SchoolCourse } from "@/lib/edu/school/lessons";
import { assignmentState } from "@/lib/edu/school/school";
import type { StudentAssignment } from "@/lib/edu/school/store";

const STATE_KEY = { todo: "aifb.status.todo", started: "aifb.status.started", done: "aifb.status.done" } as const;

export function StudentHome({
  t, locale, firstName, courses, unlocked, assignments, progress,
}: {
  t: AifbT;
  locale: string;
  firstName: string;
  courses: SchoolCourse[];
  unlocked: ReadonlySet<string>;
  assignments: StudentAssignment[];
  progress: ReadonlyMap<string, "started" | "done">;
}) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const lessons = new Map(courses.flatMap((c) => c.levels.flatMap((l) => l.lessons.map((lesson) => [lesson.id, { ...lesson, level: l, course: c }] as const))));
  const tasks = assignments
    .filter((a) => lessons.has(a.lessonId))
    .map((a) => ({ ...a, state: assignmentState(progress.get(a.lessonId) === "done", a.dueAt) }))
    .sort((a, b) => (a.state === "done" ? 1 : 0) - (b.state === "done" ? 1 : 0) || (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"));
  const visibleCourses = courses
    .map((course) => ({ ...course, levels: course.levels.map((l) => ({ ...l, lessons: l.lessons.filter((x) => unlocked.has(x.id)) })).filter((l) => l.lessons.length) }))
    .filter((course) => course.levels.length);

  return (
    <>
      <header className="aifb-head">
        <h1>{t("school.student.title", { name: firstName })}</h1>
        <p className="aifb-lead">{t("school.student.lead")}</p>
      </header>

      <section className="aifb-section" aria-labelledby="school-tasks">
        <h2 className="eh-h2" id="school-tasks"><span className="eh-bullet" aria-hidden="true" />{t("school.student.tasks")}</h2>
        {tasks.length === 0 ? <p className="aifb-muted">{t("school.student.noTasks")}</p> : (
          <ul className="school-tasks">
            {tasks.map((task) => {
              const lesson = lessons.get(task.lessonId)!;
              return (
                <li key={`${task.groupName}-${task.lessonId}`} className="school-task" data-state={task.state}>
                  <span className="school-task__title">
                    <Link href={lesson.href}>{lesson.level.code}: {lesson.kind}{lesson.title ? ` – ${lesson.title}` : ""}</Link>
                  </span>
                  <span className="aifb-badge">{t(`school.task.${task.state}`)}</span>
                  <p className="school-task__meta">
                    {lesson.course.title} · {task.groupName}
                    {task.dueAt ? ` · ${t("school.task.due", { date: date.format(new Date(task.dueAt)) })}` : ""}
                    {task.note ? ` · ${task.note}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="aifb-section" aria-labelledby="school-lessons">
        <h2 className="eh-h2" id="school-lessons"><span className="eh-bullet" aria-hidden="true" />{t("school.student.lessons")}</h2>
        {visibleCourses.length === 0 ? <p className="aifb-muted">{t("school.student.noLessons")}</p> : visibleCourses.map((course) => (
          <div key={course.category} className="aifb-section">
            <h3>{course.title}</h3>
            {course.levels.map((level) => (
              <div key={level.id} className="aifb-class-card school-card">
                <p className="aifb-class-card__title">{level.code}: {level.title}</p>
                <ul className="aifb-link-list">
                  {level.lessons.map((lesson) => {
                    const state = progress.get(lesson.id) ?? "todo";
                    return (
                      <li key={lesson.id} className="school-row">
                        <Link href={lesson.href}>{lesson.kind}{lesson.title ? ` – ${lesson.title}` : ""}</Link>
                        <span className="aifb-state" data-state={state}>{state === "done" ? "✓ " : ""}{t(STATE_KEY[state])}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
