"use client";

// Port edu/js/store/lang.js + edu/js/i18n.js do Reactu.
// Poskytuje EduLangProvider (init z x-vv-locale hlavičky, kterou nastavuje
// proxy) a hook useEduLang() vracející { lang, setLang, t, lessonsUnit,
// lessonsLabel }. setLang aktualizuje cookie (vevit-lang) i localStorage
// a dispatchuje legacy události vevit:langchange / vevit:localechange, aby
// zůstaly konzistentní serverové i legacy stránky.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  EDU_SUPPORTED_LOCALES,
  languages,
  lessonsLabel as lessonsLabelFor,
  lessonsUnit as lessonsUnitFor,
  translate,
  type EduLocale,
} from "@/lib/edu/i18n-data";

export type { EduLocale } from "@/lib/edu/i18n-data";

export const EDU_LANG_COOKIE = "vevit-lang";
export const EDU_LANG_STORAGE = "vevit-lang";

function valid(code: string | null | undefined): EduLocale {
  return code && (EDU_SUPPORTED_LOCALES as readonly string[]).includes(code)
    ? (code as EduLocale)
    : "cs";
}

export interface EduLangContextValue {
  lang: EduLocale;
  setLang: (code: EduLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  lessonsUnit: (count: number) => string;
  lessonsLabel: (count: number) => string;
  languages: typeof languages;
}

const EduLangContext = createContext<EduLangContextValue | null>(null);

function writeCookie(name: string, value: string): void {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    // server rendering / omezené cookies — ignorujeme
  }
}

export function EduLangProvider({
  locale,
  children,
}: {
  /** Locale z hlavičky x-vv-locale (server page → await headers()). */
  locale: EduLocale;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<EduLocale>(() => valid(locale));

  // Synchronizace <html lang> a persistence při změně.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code: EduLocale) => {
    const next = valid(code);
    setLangState(next);
    try {
      localStorage.setItem(EDU_LANG_STORAGE, next);
    } catch {
      // anonymní / zakázané úložiště — ignorujeme
    }
    writeCookie(EDU_LANG_COOKIE, next);
    // Legacy interop: re-render legacy komponent + locale change signál.
    window.dispatchEvent(new CustomEvent("vevit:langchange"));
    window.dispatchEvent(new CustomEvent("vevit:localechange", { detail: { locale: next } }));
  }, []);

  const value = useMemo<EduLangContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      lessonsUnit: (count: number) => lessonsUnitFor(count, lang),
      lessonsLabel: (count: number) => lessonsLabelFor(count, lang),
      languages,
    }),
    [lang, setLang],
  );

  return <EduLangContext.Provider value={value}>{children}</EduLangContext.Provider>;
}

/** Hook pro přístup k edu jazykovému kontextu. */
export function useEduLang(): EduLangContextValue {
  const ctx = useContext(EduLangContext);
  if (!ctx) {
    throw new Error("useEduLang musí být volán uvnitř <EduLangProvider>");
  }
  return ctx;
}

export { languages } from "@/lib/edu/i18n-data";