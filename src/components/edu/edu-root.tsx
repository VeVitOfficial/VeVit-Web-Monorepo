"use client";

// Client shell pro /edu/* React routy – ekvivalent legacy app shell z
// edu/index.html. Poskytuje EduLangProvider (locale z x-vv-locale hlavičky),
// EduThemeProvider (prefers-color-scheme + localStorage), BreadcrumbsProvider
// (nahrazuje setBreadcrumbs), ToastProvider (nahrazuje toast() z dom.js),
// Navbar a obsahovou oblast #app.
//
// Vendor/sdílené skripty (KaTeX, Lucide, DOMPurify, content-sanitizer,
// sandbox-runner, app-switcher, session) se načítají přes next/script, aby
// zůstaly dostupné komponentám stage 2 (lesson content, cvičení, Wikipedia).
// Sdílené pill skripty běží lazyOnload (po hydrataci), vendor knihovny
// afterInteractive.

import Script from "next/script";
import { useEffect } from "react";
import type { ReactNode } from "react";

// Modulové skripty vkládáme imperativně mimo React render — React varuje
// (a v client-only renderu <script> ani nespustí), pokud se <script> vrací
// přímo z JSX.
const MODULE_SCRIPTS = ["/assets/shared/app-switcher.js?v=20260825b"] as const;
function useModuleScripts() {
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
}
import { EduLangProvider } from "./i18n";
import { EduThemeProvider } from "./theme-provider";
import { BreadcrumbsProvider } from "./breadcrumbs";
import { ToastProvider } from "./ui";
import { Navbar } from "./navbar";
import type { EduLocale } from "@/lib/edu/i18n-data";

export function EduRoot({
  locale,
  children,
}: {
  locale: EduLocale;
  children: ReactNode;
}) {
  useModuleScripts();
  return (
    <EduLangProvider locale={locale}>
      <EduThemeProvider>
        <BreadcrumbsProvider>
          <ToastProvider>
            <div className="min-h-full flex flex-col bg-background text-foreground font-sans">
              <div id="navbar">
                <Navbar />
              </div>
              <div id="app" className="flex-1">
                {children}
              </div>
            </div>

            {/* Vendor knihovny pro stage 2 (math, ikony, sanitizace, sandbox). */}
            <Script src="/assets/vendor/lucide/lucide.min.js" strategy="afterInteractive" />
            <Script src="/assets/vendor/katex/katex.min.js" strategy="afterInteractive" />
            <Script src="/edu/assets/js/vendor/dompurify.min.js" strategy="afterInteractive" />
            <Script src="/edu/assets/js/content-sanitizer.js" strategy="afterInteractive" />
            <Script src="/edu/assets/js/sandbox-runner.js" strategy="afterInteractive" />

            {/* Sdílené pill skripty – po hydrataci (data-vevit-* placeholdery
                v Navbar už jsou v DOM). app-switcher.js je ES modul, vkládaný
                imperativně (viz useModuleScripts výše). */}
            <Script src="/assets/shared/session.js" strategy="lazyOnload" />
          </ToastProvider>
        </BreadcrumbsProvider>
      </EduThemeProvider>
    </EduLangProvider>
  );
}