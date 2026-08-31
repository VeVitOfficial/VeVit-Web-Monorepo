"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { accountLocaleFromPath } from "@/lib/account-i18n";

/**
 * Port of the `data-vevit-language` pill from
 * public/assets/shared/localization.js: two visible options — the user's base
 * language (users.language, en maps to cs) and English. Clicking switches the
 * URL locale prefix (/<lang>/account/…) — the base language itself is changed
 * in Preferences.
 */

const SUPPORTED_LOCALES = [
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "sk", label: "Slovenčina", flag: "🇸🇰" },
] as const;

const SECTION_RE = /^\/(?:home|account|edu|store|tools)(?:\/|$)/;

export function LanguagePill({
  baseLanguage,
  currentUrl,
  locale,
}: {
  baseLanguage: string;
  currentUrl: string;
  /** Explicitní locale z layoutu — rewrite v proxy odstraňuje URL prefix. */
  locale?: string;
}) {
  const router = useRouter();
  const urlLocale = locale ?? accountLocaleFromPath(currentUrl);
  const base = SUPPORTED_LOCALES.some(({ code }) => code === baseLanguage) ? baseLanguage : "cs";
  const items = [
    ...SUPPORTED_LOCALES.filter(({ code }) => code === base),
    ...SUPPORTED_LOCALES.filter(({ code }) => code === "en" && code !== base),
  ];

  // Keep <html lang> in sync — the legacy pill set it during render().
  useEffect(() => {
    document.documentElement.lang = urlLocale;
  }, [urlLocale]);

  function choose(code: string) {
    if (code === urlLocale) return;
    const path = currentUrl.replace(/^\/(cs|en|de|es|uk|fr|sk)(?=\/|$)/, "");
    const sectionPath = SECTION_RE.test(path) ? path : "/home";
    writeLocaleCookie(code);
    router.push(`/${code}${sectionPath}`);
  }

  const activeIndex = Math.max(0, items.findIndex(({ code }) => code === urlLocale));
  return (
    <div
      className="vv-locale"
      aria-label="Jazyk rozhraní"
      style={{ ["--vv-locale-count" as string]: String(items.length), ["--vv-locale-index" as string]: String(activeIndex) }}
    >
      <span className="vv-locale__slider" aria-hidden="true" />
      {items.map((locale) => (
        <button
          key={locale.code}
          type="button"
          className={`vv-locale__btn${locale.code === urlLocale ? " is-active" : ""}`}
          aria-pressed={locale.code === urlLocale}
          aria-label={locale.label}
          title={locale.label}
          onClick={() => choose(locale.code)}
        >
          {locale.flag} {locale.label}
        </button>
      ))}
    </div>
  );
}

/** URL for the pill that includes the pathname (server layout passes no URL). */
export function useCurrentUrl(): string {
  return usePathname() ?? "/account/";
}

export function writeLocaleCookie(code: string) {
  // Parity with writeCookie() in localization.js — the server-side sections
  // read the vevit-lang cookie to pick the locale prefix for redirects.
  document.cookie = `vevit-lang=${code}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; Secure`;
}
