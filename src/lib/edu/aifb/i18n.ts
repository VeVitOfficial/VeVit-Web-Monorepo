// Překlady pro serverové stránky AIFB (klientské komponenty používají useEduLang().t).

import { translate, type EduLocale, type EduVars } from "../i18n-data.ts";

export type AifbT = (key: string, vars?: EduVars) => string;

export function aifbT(locale: EduLocale): AifbT {
  return (key, vars) => translate(locale, key, vars);
}

/** České skloňování počtu: 1 / 2–4 / ostatní. Klíče `<base>.one|few|many`. */
export function countWord(t: AifbT, base: string, count: number): string {
  const form = count === 1 ? "one" : count >= 2 && count <= 4 ? "few" : "many";
  return `${count} ${t(`${base}.${form}`)}`;
}
