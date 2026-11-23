// Klientsky bezpečná část edu i18n: typy, seznam jazyků a čisté funkce nad předaným slovníkem.
// Samotné slovníky (všech 7 jazyků) jsou v i18n-data.ts a do klienta se nebundlují: server
// předá klientu jen aktuální jazyk + cs (EduRoot → eduDictFor).

export type EduLocale = "cs" | "en" | "es" | "de" | "uk" | "fr" | "sk";

export const EDU_SUPPORTED_LOCALES: readonly EduLocale[] = [
  "cs", "en", "es", "de", "uk", "fr", "sk",
];

export const languages = [
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
] as const;

export type EduDictionary = Record<string, string>;
export type EduVars = Record<string, string | number>;

export type EduDicts = Partial<Record<EduLocale, EduDictionary>>;

// Čistá (stateless) verze t() — lang se předává explicitně z React kontextu.
// Fallback na cs slovník, pokud klíč v lokalizovaném slovníku chybí.
export function translateIn(dicts: EduDicts, lang: EduLocale, key: string, vars?: EduVars): string {
  const dict: EduDictionary = dicts[lang] || dicts.cs || {};
  let text = dict[key] || dicts.cs?.[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{{${k}}}`, String(v));
    }
  }
  return text;
}

// Vrati samotnou jednotku pro pocet lekcí (bez cisla) – napr. "lekcí", "lekce", "lessons"
export function lessonsUnitIn(dicts: EduDicts, count: number, lang: EduLocale = "cs"): string {
  const l = lang || "cs";
  const key =
    count === 1 ? "course.lessons_one" : l === "cs" || l === "uk"
      ? count >= 2 && count <= 4 ? "course.lessons_few" : "course.lessons_many"
      : "course.lessons_many";
  return translateIn(dicts, l, key, { count }).replace(/^\d+\s*/, "");
}

// Česká/plurální formace pro počet lekcí (cs/uk mají one/few/many; ostatní few/many)
export function lessonsLabelIn(dicts: EduDicts, count: number, lang: EduLocale = "cs"): string {
  const l = lang || "cs";
  const key =
    count === 1 ? "course.lessons_one" : l === "cs" || l === "uk"
      ? count >= 2 && count <= 4
        ? "course.lessons_few"
        : "course.lessons_many"
      : "course.lessons_many";
  return translateIn(dicts, l, key, { count });
}
