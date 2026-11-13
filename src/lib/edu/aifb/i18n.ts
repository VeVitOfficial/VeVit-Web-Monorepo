// Překlady pro serverové stránky AIFB (klientské komponenty používají useEduLang().t).

import { translate, type EduLocale, type EduVars } from "../i18n-data.ts";

export type AifbT = (key: string, vars?: EduVars) => string;

export function aifbT(locale: EduLocale): AifbT {
  return (key, vars) => translate(locale, key, vars);
}

export { countWord } from "./count-word.ts";
