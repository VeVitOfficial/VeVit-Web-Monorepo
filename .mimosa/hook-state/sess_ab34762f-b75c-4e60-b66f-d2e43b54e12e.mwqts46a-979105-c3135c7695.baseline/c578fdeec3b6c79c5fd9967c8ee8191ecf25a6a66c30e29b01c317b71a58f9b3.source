"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const KEY = "vv-theme";

/** Skutečně platné téma: ruční volba (data-theme), jinak nastavení systému. */
function effectiveTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Přepínač světlého a tmavého režimu. Výchozí je nastavení systému; ruční volba
 * se uloží do localStorage (klíč vv-theme) a platí na všech stránkách vevit.cz.
 */
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

export function ThemeToggle() {
  // Na serveru a při hydrataci je téma neznámé (null), po připojení se čte z dokumentu.
  const theme = useSyncExternalStore<Theme | null>(subscribe, effectiveTheme, () => null);

  const toLight = theme !== "light";
  const label = toLight ? "Přepnout na světlý režim" : "Přepnout na tmavý režim";

  return (
    <button
      type="button"
      className="vv-theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => {
        const next: Theme = effectiveTheme() === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* soukromý režim: volba platí jen do zavření stránky */
        }
        listeners.forEach((cb) => cb());
      }}
    >
      {toLight ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
