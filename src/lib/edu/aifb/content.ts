import "server-only";

// Načítání obsahu AIFB. Katalog (8 kB) se importuje staticky, protože ho potřebuje hub;
// obsah kategorie (70–90 kB) se načte až při vstupu do kategorie. JSON se jen čte,
// nikdy se nepřepisuje ani nepřeformátovává (hardRule R6). Soubory jsou součástí bundlu
// stejně jako obsah původního kurzu (serverless na Vercelu nepracuje s volnými soubory).

import { notFound } from "next/navigation";
import catalogJson from "@/content/aifb/aifb-catalog.json";
import downloadsJson from "@/content/aifb/downloads.json";
import pupilPilotsJson from "@/content/aifb/pupil-pilots.json";
import theoryJson from "@/content/aifb/aifb-theory.json";
import type { AifbContent, Catalog, CategoryId, Level, Lesson } from "./types.ts";
import { isCategoryId } from "./types.ts";
import { lessonIdFromSlug, levelIdFromSlug } from "./routes.ts";
import type { PupilLayer, PupilOverlay } from "./pupil.ts";
import { resolveTheory, type ResolvedTheory, type TheoryFile } from "./theory.ts";

const catalog = catalogJson as unknown as Catalog;

const loaders: Record<CategoryId, () => Promise<AifbContent>> = {
  zs1: async () => (await import("@/content/aifb/aifb-content-zs1.json")).default as unknown as AifbContent,
  zs2: async () => (await import("@/content/aifb/aifb-content-zs2.json")).default as unknown as AifbContent,
  ss: async () => (await import("@/content/aifb/aifb-content-ss.json")).default as unknown as AifbContent,
};

const cache = new Map<CategoryId, Promise<AifbContent>>();

export function getCatalog(): Catalog {
  return catalog;
}

/** Obsah kategorie, nebo null pro neznámé / nevýukové id (např. „kurz"). */
export function loadCategory(id: string): Promise<AifbContent> | null {
  if (!isCategoryId(id)) return null;
  let pending = cache.get(id);
  if (!pending) {
    pending = loaders[id]();
    // Při selhání se chyba necachuje, další požadavek zkusí načtení znovu.
    pending.catch(() => cache.delete(id));
    cache.set(id, pending);
  }
  return pending;
}

export function findLevel(content: AifbContent, slug: string): Level | undefined {
  const id = levelIdFromSlug(content.category.id, slug);
  return content.levels.find((level) => level.id === id);
}

export function findLesson(level: Level, slug: string): Lesson | undefined {
  const id = lessonIdFromSlug(level.id, slug);
  return level.lessons.find((lesson) => lesson.id === id);
}

/** Pro stránky: obsah kategorie, nebo 404 (neznámé id i „kurz", který nemá obsah AIFB). */
export async function requireCategory(id: string): Promise<AifbContent> {
  const pending = loadCategory(id);
  if (!pending) notFound();
  return pending;
}

export type DownloadFile = { category: string; path: string; file: string; format: string; bytes: number };

/** Soubory ke stažení pro kategorii (jen ty, které jsou v downloads.json a existují v public/). */
export function getDownloads(categoryId: string): DownloadFile[] {
  return (downloadsJson.files as DownloadFile[]).filter((item) => item.category === categoryId);
}

/** Pilotní žákovská vrstva lekce (návrh); originální obsah se nemění, vrstva je ve vlastním souboru. */
export function getPupilLayer(lessonId: string): PupilLayer | undefined {
  return (pupilPilotsJson as unknown as PupilOverlay).lessons[lessonId];
}

/**
 * Návrhy (draft) textů pro žáky se ukazují jen mimo produkci (vývoj, náhledová nasazení) nebo po
 * nastavení AIFB_PREVIEW_DRAFTS=1, s upozorněním. Na produkci zůstávají skryté (pravidlo R7).
 */
export function draftPreviewEnabled(): boolean {
  if (process.env.AIFB_PREVIEW_DRAFTS === "1") return true;
  // Produkční běh má vždy NODE_ENV=production, takže lokální `next dev` je bezpečně rozpoznatelný
  // i s .env.local staženým z produkce (VERCEL_ENV=production).
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

/** Teorie levelu (text před lekcemi). */
export function getTheory(levelId: string): ResolvedTheory | null {
  return resolveTheory(theoryJson as unknown as TheoryFile, levelId);
}
