"use client";

// Port edu/js/store/theme.js – prefers-color-scheme + uložená preference.
// Stejný localStorage klíč (vevit-theme) a třídy (light/dark) na <html>
// jako legacy, takže přepínač zůstává konzistentní napříč sekcemi.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "vevit-theme";

export type EduTheme = "light" | "dark";

export interface EduThemeContextValue {
  theme: EduTheme;
  setTheme: (theme: EduTheme) => void;
  toggleTheme: () => EduTheme;
}

const EduThemeContext = createContext<EduThemeContextValue | null>(null);

function readStored(): EduTheme {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Bez uložené preference respektujeme systémový prefers-color-scheme.
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
  return prefersLight ? "light" : "dark";
}

function applyTheme(theme: EduTheme): void {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem(KEY, theme);
}

export function EduThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<EduTheme>("dark");

  // Inicializace na klientu po hydrataci (SSR default dark).
  // setState v useEffect musí být asynchronní (react-hooks v6 lint).
  useEffect(() => {
    const initial = readStored();
    applyTheme(initial);
    Promise.resolve().then(() => setThemeState(initial));
  }, []);

  const setTheme = useCallback((next: EduTheme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback((): EduTheme => {
    const next: EduTheme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    applyTheme(next);
    return next;
  }, [theme]);

  const value = useMemo<EduThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <EduThemeContext.Provider value={value}>{children}</EduThemeContext.Provider>;
}

export function useEduTheme(): EduThemeContextValue {
  const ctx = useContext(EduThemeContext);
  if (!ctx) {
    throw new Error("useEduTheme musí být volán uvnitř <EduThemeProvider>");
  }
  return ctx;
}