"use client";

// Hook pro zjištění aktuálního edu locale z React kontextu.
// Serverová stránka čte hlavičku x-vv-locale (await headers()) a předává
// locale do EduLangProvider; tento hook vrací lang z kontextu pro komponenty,
// které potřebují jen řetězec (např. metadata klienta, odkazy).

import { useEduLang } from "./i18n";
import type { EduLocale } from "@/lib/edu/i18n-data";

export function useEduLocale(): EduLocale {
  return useEduLang().lang;
}