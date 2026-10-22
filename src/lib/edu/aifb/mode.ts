// Režimy zobrazení lekce. Režim je v URL (?rezim=...), aby šel odkaz sdílet a stránka se
// vykreslila na serveru. Soubor je bez importů (klient, server, testy).

export type LessonMode = "ucitel" | "projekce" | "zak";

export const LESSON_MODES: readonly LessonMode[] = ["ucitel", "projekce", "zak"];

export function parseMode(value: string | string[] | null | undefined): LessonMode {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "projekce" || raw === "zak" ? raw : "ucitel";
}

/** Přidá režim k adrese; výchozí režim „ucitel" zůstává bez parametru. */
export function withMode(path: string, mode: LessonMode): string {
  return mode === "ucitel" ? path : `${path}?rezim=${mode}`;
}

/** Text pro žáky je zobrazitelný, jen když ho vlastník schválil (pravidlo R7). */
export function pupilVisible(pupil: { status: string; text?: string[] }): boolean {
  return (pupil.status === "reviewed" || pupil.status === "published") && Array.isArray(pupil.text) && pupil.text.length > 0;
}
