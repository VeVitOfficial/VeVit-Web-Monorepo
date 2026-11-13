// Server-side locale helper pro /edu/* React routy.
// src/proxy.ts přepisuje /<lang>/edu/... → /edu/<lang>/..., locale je tedy segment cesty
// (params.locale). Díky tomu se stránky bez session generují staticky pro každý jazyk.

import { EDU_SUPPORTED_LOCALES, type EduLocale } from "./i18n-data";

const SUPPORTED = EDU_SUPPORTED_LOCALES as readonly string[];

export function toEduLocale(value: string | undefined): EduLocale {
  return value && SUPPORTED.includes(value) ? (value as EduLocale) : "cs";
}

export async function readEduLocale(params: Promise<{ locale: string }>): Promise<EduLocale> {
  return toEduLocale((await params).locale);
}

/** Pro generateStaticParams layoutu /edu/[locale]. */
export function eduLocaleParams(): { locale: EduLocale }[] {
  return EDU_SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** Props stránek pod /edu/[locale] bez dalších dynamických segmentů. */
export type LocaleParams = { params: Promise<{ locale: string }> };
