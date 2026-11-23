// Pravidla průvodce pro učitele: upozornění na ochranu údajů u lekcí s AI, oddíly vhodné k tisku
// a kopírování (dopis rodičům) a formát velikosti souboru. Soubor je bez importů (testy, klient, server).

/** Oddíl průvodce s pravidly ochrany údajů, na který lekce s AI odkazuje. */
export const DATA_PROTECTION_ANCHOR: Record<string, string> = {
  zs1: "g7-2", // 7.2 Jaká data ve výuce nikdy nepoužíváme
  zs2: "g1-4", // 1.4 Pravidla bezpečné a odpovědné práce
  ss: "g1-4",
};

/** Oddíly, u kterých průvodce nabízí tisk a zkopírování textu (dopis rodičům a časté otázky, 1. stupeň). */
export const PRINTABLE_SECTIONS: Record<string, string[]> = {
  zs1: ["g7-3"],
};

/**
 * Upozornění na ochranu údajů se ukazuje u cvičení, kde se pracuje s nástrojem AI:
 * na 1. stupni v blocích C a D (nástroj ukazuje učitel, žáci do něj nepíšou), na 2. stupni
 * a SŠ u všech cvičení (od úrovně 1 se pracuje s konverzačním nástrojem).
 */
export function showsDataProtection(categoryId: string, levelId: string, lessonType: "theory" | "exercise"): boolean {
  if (lessonType !== "exercise") return false;
  if (categoryId === "zs1") return levelId === "zs1-blok-c" || levelId === "zs1-blok-d";
  return categoryId === "zs2" || categoryId === "ss";
}

/** Velikost souboru: 52253 → „51 kB", 2 500 000 → „2,4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
