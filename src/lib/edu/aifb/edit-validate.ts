// Kontrola celého dokumentu po úpravě adminem: stejná pravidla jako validace obsahu při buildu
// (schéma, id, odkazy do průvodce, certifikace jen „planned“, teorie, kurz, žákovská cvičení).
// Uloží se jen úprava, po které je dokument platný. Schéma a id levelů dodává volající
// (soubor je bez importů JSON, aby šel spustit i v jednotkových testech).

import { AI_LESSONS } from "./ai-config.ts";
import { validateCourse, type Course } from "./course.ts";
import type { EditDoc } from "./edits.ts";
import { guideRefsIn } from "./markdown.ts";
import { validatePupilLayer, type PupilOverlay } from "./pupil.ts";
import { validateAgainstSchema } from "./schema-check.ts";
import { validateTheory, type TheoryFile } from "./theory.ts";

export type EditValidationContext = {
  /** aifb-content.schema.json */
  schema: unknown;
  /** Id všech levelů AIFB (teorie je musí pokrýt). */
  levelIds: readonly string[];
};

type CategoryDoc = {
  category?: { id?: string };
  guide?: { id: string; sections?: { id: string }[] }[];
  levels?: { id: string; certification?: { status?: string } | null }[];
};

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

function categoryErrors(doc: EditDoc, data: CategoryDoc, schema: unknown): string[] {
  const errors = validateAgainstSchema(schema, data, doc);
  if (data.category?.id !== doc) errors.push(`${doc}: category.id musí být "${doc}"`);
  for (const level of data.levels ?? []) {
    if (level.certification && level.certification.status !== "planned") errors.push(`${level.id}: certifikace musí mít stav "planned" (R4)`);
  }
  const anchors = new Set<string>();
  for (const chapter of data.guide ?? []) {
    anchors.add(chapter.id);
    for (const section of chapter.sections ?? []) anchors.add(section.id);
  }
  for (const text of collectStrings([data.guide, data.levels])) {
    for (const ref of guideRefsIn(text)) {
      if (!anchors.has(ref.anchor)) errors.push(`odkaz „${ref.text}“ vede na neexistující oddíl průvodce`);
    }
  }
  return errors;
}

function pilotErrors(data: PupilOverlay): string[] {
  const errors: string[] = [];
  for (const [lessonId, layer] of Object.entries(data.lessons ?? {})) {
    errors.push(...validatePupilLayer(lessonId, layer, { allowApproved: true }));
    if (layer.component === "AiSandbox") {
      if (lessonId.startsWith("zs1-")) errors.push(`${lessonId}: žáci 1. stupně AI nikdy nepíšou (R1)`);
      if (!AI_LESSONS[lessonId]) errors.push(`${lessonId}: AI cvičení potřebuje serverovou konfiguraci (ai-config.ts)`);
    }
  }
  return errors;
}

export function validateEditedDoc(doc: EditDoc, data: unknown, context: EditValidationContext): string[] {
  switch (doc) {
    case "zs1":
    case "zs2":
    case "ss":
      return categoryErrors(doc, data as CategoryDoc, context.schema);
    case "theory":
      return validateTheory(data as TheoryFile, context.levelIds);
    case "kurz":
      return validateCourse(data as Course);
    case "pilots":
      return pilotErrors(data as PupilOverlay);
  }
}
