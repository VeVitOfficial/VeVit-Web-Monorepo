// Online kurz pro všechny: šest modulů složených z témat všech tří kategorií AIFB.
// Obsah je ve vlastním souboru src/content/aifb/aifb-kurz.json (originální obsahové soubory se nemění).
// Každý modul má teorii (stejné bloky a ilustrace jako teorie levelů) a lekce s cvičeními na stránce.
// Id: kurz-m1-teorie, kurz-m1-cv1… (stejný tvar jako id lekcí AIFB, takže funguje místní průběh i XP).

import { validatePupilLayer, type CardSortConfig, type QuizConfig, type TrafficLightConfig } from "./pupil.ts";
import { validateTheory, type TheoryDoc } from "./theory.ts";

export const COURSE_ID = "kurz";

export type CourseActivity =
  | { component: "CardSort"; config: CardSortConfig }
  | { component: "TrafficLightCards"; config: TrafficLightConfig }
  | { component: "QuizCard"; config: QuizConfig };

export type CourseLesson = {
  id: string;
  order: number;
  title: string;
  minutes: number;
  intro: string;
  steps: string[];
  outcome: string;
  tip?: string;
  activity?: CourseActivity;
};

export type CourseModule = {
  id: string;
  order: number;
  code: string;
  title: string;
  subtitle: string;
  minutes: number;
  /** Kategorie AIFB, ze kterých modul vychází (zs1, zs2, ss). */
  sources: string[];
  goals: string[];
  theory: TheoryDoc;
  lessons: CourseLesson[];
};

export type Course = {
  version: string;
  status: "draft" | "reviewed" | "published";
  note: string;
  title: string;
  subtitle: string;
  lead: string;
  audience: string;
  howItWorks: string[];
  modules: CourseModule[];
};

export const theoryIdOf = (module: { id: string }) => `${module.id}-teorie`;

/** Id všech lekcí modulu včetně teorie (pro průběh a XP). */
export function moduleLessonIds(module: CourseModule): string[] {
  return [theoryIdOf(module), ...module.lessons.map((lesson) => lesson.id)];
}

export function moduleSlug(moduleId: string): string {
  return moduleId.startsWith(`${COURSE_ID}-`) ? moduleId.slice(COURSE_ID.length + 1) : moduleId;
}

export function findModule(course: Course, slug: string): CourseModule | undefined {
  return course.modules.find((module) => module.id === `${COURSE_ID}-${slug}`);
}

export function findCourseLesson(module: CourseModule, slug: string): CourseLesson | undefined {
  return module.lessons.find((lesson) => lesson.id === `${module.id}-${slug}`);
}

export function courseTotals(course: Course): { modules: number; lessons: number; minutes: number } {
  return {
    modules: course.modules.length,
    lessons: course.modules.reduce((sum, module) => sum + module.lessons.length, 0),
    minutes: course.modules.reduce((sum, module) => sum + module.minutes, 0),
  };
}

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

/** Kontrola kurzu: id a pořadí bez děr, neprázdné texty, platná teorie a konfigurace cvičení. */
export function validateCourse(course: Course): string[] {
  const errors: string[] = [];
  if (!["draft", "reviewed", "published"].includes(course.status)) errors.push("aifb-kurz: neplatný stav");
  for (const field of ["title", "subtitle", "lead", "audience"] as const) {
    if (!nonEmpty(course[field])) errors.push(`aifb-kurz: chybí ${field}`);
  }
  if (!Array.isArray(course.modules) || course.modules.length === 0) return [...errors, "aifb-kurz: žádné moduly"];
  course.modules.forEach((module, index) => {
    const where = `aifb-kurz ${module.id}`;
    if (module.order !== index + 1 || module.id !== `${COURSE_ID}-m${index + 1}`) errors.push(`${where}: id nebo pořadí neodpovídá pozici ${index + 1}`);
    if (!nonEmpty(module.title) || !nonEmpty(module.code) || !(module.minutes > 0)) errors.push(`${where}: název, kód nebo délka`);
    if (!Array.isArray(module.goals) || module.goals.length === 0 || !module.goals.every(nonEmpty)) errors.push(`${where}: cíle`);
    if (!Array.isArray(module.sources) || module.sources.length === 0 || !module.sources.every((id) => ["zs1", "zs2", "ss"].includes(id))) errors.push(`${where}: zdrojové kategorie`);
    const theoryErrors = validateTheory(
      { version: course.version, status: course.status, note: "", topics: { [module.id]: module.theory }, levels: { [module.id]: { topic: module.id } } },
      [module.id],
    );
    errors.push(...theoryErrors.map((error) => error.replace("aifb-theory", "aifb-kurz")));
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
      errors.push(`${where}: žádné lekce`);
      return;
    }
    module.lessons.forEach((lesson, i) => {
      const at = `aifb-kurz ${lesson.id}`;
      if (lesson.order !== i + 1 || lesson.id !== `${module.id}-cv${i + 1}`) errors.push(`${at}: id nebo pořadí neodpovídá pozici ${i + 1}`);
      if (lesson.order > 5) errors.push(`${at}: nejvýš 5 lekcí v modulu (tvar id průběhu)`);
      if (!nonEmpty(lesson.title) || !nonEmpty(lesson.intro) || !nonEmpty(lesson.outcome) || !(lesson.minutes > 0)) errors.push(`${at}: název, úvod, výsledek nebo délka`);
      if (!Array.isArray(lesson.steps) || lesson.steps.length === 0 || !lesson.steps.every(nonEmpty)) errors.push(`${at}: postup`);
      if (lesson.tip !== undefined && !nonEmpty(lesson.tip)) errors.push(`${at}: prázdný tip`);
      if (lesson.activity) {
        if ((lesson.activity.component as string) === "AiSandbox") errors.push(`${at}: kurz nepoužívá cvičení s AI`);
        errors.push(...validatePupilLayer(lesson.id, { status: "draft", ...lesson.activity }).map((error) => error.replace("pupil-pilots", "aifb-kurz")));
      }
    });
  });
  return errors;
}
