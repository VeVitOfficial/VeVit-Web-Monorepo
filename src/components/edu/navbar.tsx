"use client";

// Port edu/js/components/navbar.js do Reactu.
// Header (brand + breadcrumbs + navigace + theme toggle + lang switcher +
// app-switcher/session placeholdery). ClassNames identické s legacy, aby
// public/edu/css/styles.css + public/assets/shared/*.css aplikovaly styly.
//
// Rozdíly oproti legacy:
//   - setBreadcrumbs() → useEduBreadcrumbs() kontext
//   - theme toggle → useEduTheme() kontext
//   - lang switcher → useEduLang().setLang + nativní <select> (legacy
//     používala data-vevit-language span + /assets/shared/localization.js)
//   - session / app-switcher zůstávají jako <span data-vevit-*> placeholdery
//     a edu-root načítá sdílené skripty, takže fungují jako v legacy

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useEduLang } from "./i18n";
import { useEduTheme } from "./theme-provider";
import { useEduBreadcrumbs } from "./breadcrumbs";

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function Navbar() {
  const { lang, setLang, t, languages } = useEduLang();
  const { theme, toggleTheme } = useEduTheme();
  const { breadcrumbs } = useEduBreadcrumbs();
  const pathname = usePathname() ?? "/edu";

  // Edu React routy začínají /edu/... — pro aktivní stav ořezeme prefix.
  const rel = pathname.startsWith("/edu") ? pathname.slice(4) : pathname;
  const isDashboard = rel === "/dashboard" || rel === "/" || rel === "";
  const isProgramming = rel.startsWith("/programovani");
  const isSearch = rel.startsWith("/hledat");
  const isAiLiteracy = rel.startsWith("/ai-gramotnost");

  // Scroll surface (edu-navbar--scrolled) — port bindNavbarScroll().
  useEffect(() => {
    function onScroll() {
      document.querySelector(".edu-navbar")?.classList.toggle("edu-navbar--scrolled", window.scrollY > 6);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="edu-navbar">
      <div className="edu-navbar__inner">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="vv-app-brand" aria-label="VeVit Edu">
            <Link href="/home">VeVit</Link>
            <Link href="/edu">Edu</Link>
          </span>
          {breadcrumbs.length ? (
            <nav className="hidden md:flex items-center gap-2 text-xs text-[var(--color-muted)] ml-4">
              {breadcrumbs.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 ? <span className="text-[var(--color-text-muted)]">/</span> : null}
                  {c.href ? (
                    <Link href={c.href} className="hover:text-[var(--color-foreground)] transition-colors">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">{c.label}</span>
                  )}
                </div>
              ))}
            </nav>
          ) : null}
        </div>
        <nav className="edu-navbar__links" aria-label="Navigace VeVit Edu">
          <Link
            href="/edu/dashboard"
            className={`edu-navbar__link${isDashboard ? " edu-navbar__link--active" : ""}`}
          >
            Přehled
          </Link>
          <Link
            href="/edu/programovani"
            className={`edu-navbar__link${isProgramming ? " edu-navbar__link--active" : ""}`}
          >
            {t("nav.programming")}
          </Link>
          <a
            href="/edu/ai-gramotnost/"
            data-full-reload="true"
            className={`edu-navbar__link${isAiLiteracy ? " edu-navbar__link--active" : ""}`}
          >
            AI gramotnost
          </a>
          <Link
            href="/edu/hledat"
            className={`edu-navbar__link${isSearch ? " edu-navbar__link--active" : ""}`}
          >
            Vyhledat
          </Link>
        </nav>
        <div className="edu-navbar__actions">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as typeof lang)}
            aria-label="Změnit jazyk"
            className="edu-navbar__lang"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
          <button
            id="theme-btn"
            type="button"
            className="edu-navbar__icon-button"
            aria-label="Změnit motiv"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <span data-vevit-app-switcher data-vevit-app="Edu" />
          <span data-vevit-session>
            <span className="vv-session vv-session--loading">Ověřuji přihlášení…</span>
          </span>
        </div>
      </div>
    </header>
  );
}