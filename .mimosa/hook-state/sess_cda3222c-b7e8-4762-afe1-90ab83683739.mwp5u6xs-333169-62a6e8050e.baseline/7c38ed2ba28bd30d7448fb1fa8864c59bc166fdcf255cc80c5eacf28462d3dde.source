"use client";

// "Kde jste skončili" (Fáze 2, bod 4 zadání) — nedávno navštívené a oblíbené
// nástroje, čistě v localStorage, žádný účet. Ukládání je vzor podle
// src/lib/cart.ts (jeden JSON klíč, guard na typeof window, custom event pro
// sync mezi komponentami). Čtení jde přes useSyncExternalStore — jedna
// hvězdička na kartě může změnit stav, který čte řádek "Kde jste skončili"
// jinde na stránce, a SSR/hydratace nemají localStorage vůbec.
import { useCallback, useSyncExternalStore } from "react";

const RECENTS_KEY = "vevit_tools_recents";
const FAVORITES_KEY = "vevit_tools_favorites";
const MAX_RECENTS = 12;
const CHANGE_EVENT = "vevit-tools-library-change";
const EMPTY: readonly string[] = [];

function readSlugs(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

// Cache drží stabilní referenci mezi rendery, ať useSyncExternalStore
// nevidí "novou" hodnotu (a tedy nekonečnou smyčku) při každém volání.
let favoritesCache: string[] = readSlugs(FAVORITES_KEY);
let recentsCache: string[] = readSlugs(RECENTS_KEY);

function writeSlugs(key: string, slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    /* localStorage nedostupné (soukromý režim apod.) — ticho selže */
  }
  favoritesCache = readSlugs(FAVORITES_KEY);
  recentsCache = readSlugs(RECENTS_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getRecents(): string[] {
  return readSlugs(RECENTS_KEY);
}

/** Zaznamená návštěvu nástroje — nejnovější první, bez duplicit, max MAX_RECENTS. */
export function pushRecent(slug: string) {
  const next = [slug, ...readSlugs(RECENTS_KEY).filter((s) => s !== slug)].slice(0, MAX_RECENTS);
  writeSlugs(RECENTS_KEY, next);
}

export function getFavorites(): string[] {
  return readSlugs(FAVORITES_KEY);
}

export function toggleFavorite(slug: string) {
  const current = readSlugs(FAVORITES_KEY);
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
  writeSlugs(FAVORITES_KEY, next);
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

/** Hook jen pro oblíbené (hvězdička na kartě). */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, () => favoritesCache, getServerSnapshot);
  return {
    favorites,
    isFavorite: useCallback((slug: string) => favorites.includes(slug), [favorites]),
    toggleFavorite,
  };
}

/** Hook pro recenty + oblíbené společně — "Kde jste skončili" řádek. */
export function useToolsLibrary() {
  const recents = useSyncExternalStore(subscribe, () => recentsCache, getServerSnapshot);
  const favorites = useSyncExternalStore(subscribe, () => favoritesCache, getServerSnapshot);
  return { recents, favorites };
}
