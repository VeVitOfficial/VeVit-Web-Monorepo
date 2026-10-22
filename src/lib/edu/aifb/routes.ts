// Adresy sekce AIFB. Ve všech URL se používají stabilní id z obsahu, zkrácená o předponu:
//   level  zs1-blok-a      → "blok-a"      (kategorie zs1)
//   lekce  zs1-blok-a-cv3  → "cv3", zs1-blok-a-teorie → "teorie"
// Id se nikdy nepřečíslovávají (plán, informationArchitecture.idRules).
// Soubor je bez importů, aby šel použít na serveru, v klientu i v testech.

export const AIFB_BASE = "edu/ai-gramotnost";
export const GUIDE_SEGMENT = "pro-ucitele";

export function levelSlug(categoryId: string, levelId: string): string {
  return levelId.startsWith(`${categoryId}-`) ? levelId.slice(categoryId.length + 1) : levelId;
}

export function lessonSlug(levelId: string, lessonId: string): string {
  return lessonId.startsWith(`${levelId}-`) ? lessonId.slice(levelId.length + 1) : lessonId;
}

export function levelIdFromSlug(categoryId: string, slug: string): string {
  return `${categoryId}-${slug}`;
}

export function lessonIdFromSlug(levelId: string, slug: string): string {
  return `${levelId}-${slug}`;
}

export const hubPath = (locale: string) => `/${locale}/${AIFB_BASE}`;
export const categoryPath = (locale: string, categoryId: string) => `${hubPath(locale)}/aifb/${categoryId}`;
export const levelPath = (locale: string, categoryId: string, level: string) => `${categoryPath(locale, categoryId)}/${level}`;
export const lessonPath = (locale: string, categoryId: string, level: string, lesson: string) =>
  `${levelPath(locale, categoryId, level)}/${lesson}`;
export const guidePath = (locale: string, categoryId: string, anchor?: string) =>
  `${categoryPath(locale, categoryId)}/${GUIDE_SEGMENT}${anchor ? `#${anchor}` : ""}`;
