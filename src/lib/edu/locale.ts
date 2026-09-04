// Server-side locale helper pro /edu/* React routy.
// Locale se čte z hlavičky x-vv-locale, kterou nastavuje src/proxy.ts
// při rewrite z /<lang>/edu/... → /edu/... (URL prefix se při rewrite
// ztrácí, takže usePathname() by vždy vrátil /edu bez locale).

import { headers } from "next/headers";
import { EDU_SUPPORTED_LOCALES, type EduLocale } from "./i18n-data";

const SUPPORTED = EDU_SUPPORTED_LOCALES as readonly string[];

export async function readEduLocale(): Promise<EduLocale> {
  const value = (await headers()).get("x-vv-locale");
  return value && SUPPORTED.includes(value) ? (value as EduLocale) : "cs";
}