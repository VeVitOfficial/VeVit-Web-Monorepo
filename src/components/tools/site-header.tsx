"use client";

// Hlavička EveryTool.cz (redesign dle index.html): logo s barevnou značkou,
// kategorie v nav, přepínač tématu, jazyk, session slot a tlačítko Premium.
//
// VOLBA: Language switcher, app switcher a session.js se načítají z legacy
//   skriptů /assets/shared/*.js přes imperativně vložené module skripty
//   (React by <script> v JSX nespustil). Skripty hledají sloty
//   <span data-vevit-language>, <span data-vevit-app-switcher> a
//   <span data-vevit-session> — session.js runtime vymění fallback odkaz
//   za menu účtu, když je uživatel přihlášený.
import { useEffect } from "react";
import { type Locale, categoryLabel } from "@/components/tools/registry/data";
import { ET_CATEGORY_COLORS, ET_NAV_CATEGORIES } from "@/components/tools/et-colors";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  locale: Locale;
  strings: { categories: string; login: string; login_title: string; brand_name: string };
}

const CATEGORY_FALLBACK: Record<string, string> = {
  pdf: "PDF", image: "Obrázky", media: "Média", text: "Text", ai: "AI", dev: "Dev", security: "Bezpečnost", calc: "Kalkulačky",
};

// Modulové skripty vkládáme imperativně mimo React render — React varuje
// (a v client-only renderu <script> ani nespustí), pokud se <script> vrací
// přímo z JSX.
const MODULE_SCRIPTS = [
  "/assets/shared/app-switcher.js?v=20260928b",
  "/assets/shared/localization.js?v=20261113a",
  "/assets/shared/session.js?v=20261117a",
] as const;
const SESSION_CSS = "/assets/shared/session.css?v=20260928a";

export function SiteHeader({ locale, strings }: Props) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${SESSION_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = SESSION_CSS;
      document.head.appendChild(link);
    }
    const injected: HTMLScriptElement[] = [];
    for (const src of MODULE_SCRIPTS) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      document.body.appendChild(script);
      injected.push(script);
    }
    return () => {
      injected.forEach((script) => script.remove());
    };
  }, []);

  const base = `/${locale}/tools`;

  return (
    <header className="site-header et-hdr">
      <div className="et-wrap et-hdr-in">
        <a className="et-logo" href={`${base}/`} aria-label="EveryTool.cz – domů">
          <span className="et-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span className="et-logo-t">
            <b>{strings.brand_name}<span>.cz</span></b>
            <small>by <span className="et-vevit">VeVit</span> web applications</small>
          </span>
        </a>
        <nav className="et-nav" aria-label={strings.categories}>
          {ET_NAV_CATEGORIES.map((cat) => (
            <a key={cat} href={`${base}/?category=${cat}#et-katalog`}>
              <span className="et-dot" style={{ background: ET_CATEGORY_COLORS[cat] }} aria-hidden="true"></span>
              {categoryLabel(cat, locale) ?? CATEGORY_FALLBACK[cat]}
            </a>
          ))}
        </nav>
        <div className="et-actions">
          <span data-vevit-language className="et-lang-slot"></span>
          <ThemeToggle />
          <span data-vevit-app-switcher data-vevit-app="Tools" className="et-switcher-slot"></span>
          {/* session.js replaces the fallback with the account menu once signed in. */}
          <span data-vevit-session>
            <a className="et-btn et-login-btn" href={`/${locale}/account/login`} title={strings.login_title}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
              {strings.login}
            </a>
          </span>
          <a href={`${base}/#et-premium`} className="et-btn et-btn-dark">
            <span className="et-crown" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" /></svg>
            </span>
            Premium
          </a>
        </div>
      </div>
    </header>
  );
}
