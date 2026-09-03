"use client";

import Script from "next/script";
import { useEffect } from "react";

// Port home/assets/js/support.js — initCurrentYear + initContactEmail.
// Na support stránce nejsou lucide/ui.js/localization.js (žádné data-lucide
// ani data-ui-text), takže se načítají jen session.js a app-switcher.js.
// initContactEmail: desktop (hover+fine pointer) kopíruje mail do schránky;
// na stránce může být víc [data-contact-email] odkazů (quick-links + FAQ).
const SUPPORT_SCRIPTS = [
  "/assets/shared/session.js",
] as const;
// app-switcher.js je ES modul — legacy ho načítal s type="module".
// next/script vkládá klasický <script> → SyntaxError, proto plain tag.
const SUPPORT_MODULE_SCRIPTS = [
  "/assets/shared/app-switcher.js?v=20260825b",
] as const;

export function SupportBehaviors() {
  useEffect(() => {
    /* ---------- Dynamic copyright year ---------- */
    const yearEl = document.querySelector<HTMLElement>("[data-current-year]");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ---------- Contact email: desktop copy (multiple links) ---------- */
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("[data-contact-email]"),
    );
    const cleanups: Array<() => void> = [];
    if (
      links.length &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      const status = document.querySelector<HTMLElement>("[data-email-copy-status]");
      links.forEach((link) => {
        const onClick = async (event: Event) => {
          event.preventDefault();
          const email = link.href.replace(/^mailto:/i, "").split("?")[0];
          try {
            await navigator.clipboard.writeText(email);
            if (status) {
              status.hidden = false;
              status.textContent = `E-mail ${email} byl zkopírován.`;
              status.classList.add("is-success");
              status.classList.remove("is-error");
            }
          } catch {
            if (status) {
              status.hidden = false;
              status.textContent = `E-mail se nepodařilo zkopírovat. Adresa je ${email}.`;
              status.classList.add("is-error");
              status.classList.remove("is-success");
            }
          }
        };
        link.addEventListener("click", onClick);
        cleanups.push(() => link.removeEventListener("click", onClick));
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Modulové skripty vkládáme imperativně mimo React render — React varuje
  // (a v client-only renderu <script> ani nespustí), pokud se <script> vrací
  // přímo z JSX.
  useEffect(() => {
    const injected: HTMLScriptElement[] = [];
    for (const src of SUPPORT_MODULE_SCRIPTS) {
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

  return (
    <>
      {SUPPORT_SCRIPTS.map((src) => (
        <Script key={src} src={src} strategy="afterInteractive" />
      ))}
    </>
  );
}