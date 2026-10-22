"use client";

// Úložiště místního průběhu AIFB (localStorage, klíč vevit.edu.aifb.progress.v1).
// Čtení i zápis jsou v try/catch: bez úložiště (soukromé okno, zablokovaná data) průběh platí
// do obnovení stránky a nic se nerozbije. Na serveru se vrací prázdný průběh.

import { useSyncExternalStore } from "react";
import {
  PROGRESS_KEY,
  emptyProgress,
  parseProgress,
  setLessonStatus,
  type AifbProgress,
  type LessonStatus,
} from "@/lib/edu/aifb/progress";

const EMPTY = emptyProgress();
let cache: AifbProgress | null = null;
const listeners = new Set<() => void>();

function load(): AifbProgress {
  if (cache) return cache;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(PROGRESS_KEY);
  } catch {
    // úložiště nedostupné
  }
  cache = parseProgress(stored) ?? emptyProgress();
  return cache;
}

function save(next: AifbProgress) {
  cache = next;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // průběh platí jen do obnovení stránky
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PROGRESS_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAifbProgress(): AifbProgress {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** Aktuální uložený průběh (čte přímo úložiště; po hydrataci je vždy aktuální, na rozdíl od hodnoty z renderu). */
export function getProgressNow(): AifbProgress {
  return load();
}

export function setStatus(lessonId: string, status: LessonStatus | null) {
  save(setLessonStatus(load(), lessonId, status));
}

export function replaceProgress(next: AifbProgress) {
  save(next);
}

export function resetProgress() {
  save(emptyProgress());
}
