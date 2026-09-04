"use client";

// React port sdíleného headeru nástrojů (tools/includes/header.php).
// Brand + Kategorie dropdown + login + language switcher + app switcher.
//
// VOLBA: Language switcher a app switcher se načítají z legacy skriptů
//   /assets/shared/localization.js a /assets/shared/app-switcher.js
// přes next/script (po renderu). Tyto skripty hledají v DOM elementy
//   <span data-vevit-language> a <span data-vevit-app-switcher data-vevit-app="Tools">
// a injektují do nich UI. Portovat je do Reactu by znamenalo duplikovat
// cizí komplexní logiku — zůstáváme u legacy skriptů, stejně jako je proxy.ts
// a ostatní sekce. Další batch agenti je mohou portovat centrálně.
//
// ClassName zůstává totožná s legacy, aby public/tools/assets/css/style.css
// (a /assets/shared/app-switcher.css) styl fungoval beze změny.
import { useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS, CATEGORY_ORDER, type Category, type Locale } from "@/components/tools/registry/data";
import { categoryLabel } from "@/components/tools/registry/data";

interface Props {
  locale: Locale;
  strings: { categories: string; newest: string; login: string; login_title: string; brand_name: string; brand_suffix: string };
}

const CATEGORY_DOT_LABEL: Record<Category, string> = {
  pdf: "PDF", image: "Obrázky", media: "Média", text: "Text", ai: "AI", dev: "Dev", security: "Bezpečnost", calc: "Kalkulačky",
};

// Modulové skripty vkládáme imperativně mimo React render — React varuje
// (a v client-only renderu <script> ani nespustí), pokud se <script> vrací
// přímo z JSX.
const MODULE_SCRIPTS = [
  "/assets/shared/app-switcher.js?v=20260825b",
  "/assets/shared/localization.js?v=20260826f",
] as const;

export function SiteHeader({ locale, strings }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const base = `/${locale}/tools`;

  return (
    <header className="site-header glass">
      <div className="container bar">
        <div className="header-left">
          <a className="brand" href={`${base}/`}>
            <span className="brand-logo" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
              </svg>
            </span>
            <span className="brand-mark">
              <span className="brand-name">{strings.brand_name}</span>
              <span className="brand-suffix">{strings.brand_suffix}</span>
            </span>
          </a>
          <div className="cat-wrap" style={{ position: "relative" }} ref={wrapRef}>
            <button
              className="cat-toggle"
              id="cat-toggle"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((v) => !v)}
              type="button"
            >
              {strings.categories}{" "}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className={`cat-dropdown glass-strong${open ? "" : " hidden"}`} id="cat-menu" role="menu">
              <a href={`${base}#nove`} role="menuitem" onClick={() => setOpen(false)}>
                <span className="dot" style={{ background: "var(--color-emerald)" }}></span> {strings.newest}
              </a>
              <div className="sep"></div>
              {CATEGORY_ORDER.map((cat) => (
                <a key={cat} href={`${base}#${cat}`} role="menuitem" onClick={() => setOpen(false)}>
                  <span className="dot" style={{ background: CATEGORY_COLORS[cat] }}></span>{" "}
                  {categoryLabel(cat, locale) ?? CATEGORY_DOT_LABEL[cat]}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="header-right vv-app-actions">
          <span data-vevit-language></span>
          <span data-vevit-app-switcher data-vevit-app="Tools"></span>
          <a
            className="login-btn"
            href={`/${locale}/account/login`}
            title={strings.login_title}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>{" "}
            {strings.login}
          </a>
        </div>
      </div>

    </header>
  );
}