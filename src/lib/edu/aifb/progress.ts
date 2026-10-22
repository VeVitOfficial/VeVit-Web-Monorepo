// Místní průběh AIFB (jen v prohlížeči, bez účtu, bez osobních údajů).
// Tvar: { version: 1, lessons: { "<lessonId>": { status: "started" | "done", at: ISO datum } } }.
// XP se vždy odvozuje z hotových lekcí (nikdy se neukládá) podle pravidel z ./xp.ts.
// Soubor je čistý (bez importů kromě ./xp.ts), aby šel testovat i spustit mimo prohlížeč.

import { XP_LEVEL_BONUS, xpForLesson } from "./xp.ts";

export const PROGRESS_KEY = "vevit.edu.aifb.progress.v1";
export const MAX_IMPORT_BYTES = 200_000;

export type LessonStatus = "started" | "done";
export type LessonState = "todo" | LessonStatus;
export type AifbProgress = {
  version: 1;
  lessons: Record<string, { status: LessonStatus; at: string }>;
};

/** Id lekce: <kategorie>-<level...>-teorie | -cv1..cv5. Cokoli jiného se při importu zahodí. */
const LESSON_ID = /^(?:zs1|zs2|ss)-[a-z0-9]+(?:-[a-z0-9]+)*-(?:teorie|cv[1-5])$/;

export function emptyProgress(): AifbProgress {
  return { version: 1, lessons: {} };
}

export function lessonTypeOf(lessonId: string): "theory" | "exercise" {
  return lessonId.endsWith("-teorie") ? "theory" : "exercise";
}

/** Id lekcí levelu: teorie + cvičení 1..(count-1); odpovídá invariantům obsahu (6 lekcí). */
export function lessonIdsForLevel(levelId: string, lessonCount: number): string[] {
  const ids = [`${levelId}-teorie`];
  for (let n = 1; n < lessonCount; n += 1) ids.push(`${levelId}-cv${n}`);
  return ids;
}

export function lessonStateOf(progress: AifbProgress, lessonId: string): LessonState {
  return progress.lessons[lessonId]?.status ?? "todo";
}

/** Nastaví stav lekce (null = zpět na „nezačato"). Vrací novou instanci, vstup nemění. */
export function setLessonStatus(
  progress: AifbProgress,
  lessonId: string,
  status: LessonStatus | null,
  now: string = new Date().toISOString(),
): AifbProgress {
  const lessons = { ...progress.lessons };
  if (status === null) delete lessons[lessonId];
  else lessons[lessonId] = { status, at: now };
  return { version: 1, lessons };
}

export function levelProgress(progress: AifbProgress, lessonIds: readonly string[]): { done: number; total: number } {
  return { done: lessonIds.filter((id) => progress.lessons[id]?.status === "done").length, total: lessonIds.length };
}

/** XP z hotových lekcí + bonus za každý zcela dokončený level. */
export function computeXp(progress: AifbProgress, levels: readonly { lessonIds: readonly string[] }[]): number {
  let xp = 0;
  for (const level of levels) {
    const { done, total } = levelProgress(progress, level.lessonIds);
    for (const id of level.lessonIds) {
      if (progress.lessons[id]?.status === "done") xp += xpForLesson(lessonTypeOf(id));
    }
    if (total > 0 && done === total) xp += XP_LEVEL_BONUS;
  }
  return xp;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

/** Přísně ověří uložený nebo importovaný průběh; neplatný vstup vrací null. Neznámá pole zahazuje. */
export function parseProgress(text: string | null | undefined): AifbProgress | null {
  if (!text || text.length > MAX_IMPORT_BYTES) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || (data as { version?: unknown }).version !== 1) return null;
  const raw = (data as { lessons?: unknown }).lessons;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > 500) return null;
  const lessons: AifbProgress["lessons"] = {};
  for (const [id, value] of entries) {
    if (!LESSON_ID.test(id) || typeof value !== "object" || value === null) continue;
    const { status, at } = value as { status?: unknown; at?: unknown };
    if ((status === "started" || status === "done") && isIsoDate(at)) lessons[id] = { status, at };
  }
  return { version: 1, lessons };
}

/** Obsah souboru pro export: jen verze a lekce, nic dalšího (žádná jména ani e-maily). */
export function serializeProgress(progress: AifbProgress): string {
  return JSON.stringify({ version: 1, lessons: progress.lessons }, null, 2);
}
