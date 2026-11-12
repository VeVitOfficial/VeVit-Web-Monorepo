// PromptLab: hodnocení zadání žáka a odpovědi AI podle podmínek kola. Bez importů ze serveru,
// aby šlo použít v prohlížeči i v testech. Shoda se hledá bez ohledu na velikost písmen a diakritiku
// (žák smí psát „pro deti“ i „pro děti“).

import { splitSentences } from "./interactive-logic.ts";
import type { LabCheck, PromptLabConfig } from "./pupil.ts";

/** Malá písmena bez diakritiky; pro porovnání textu žáka s výrazy v podmínkách. */
export function foldText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/u).length;
}

function bulletCount(text: string): number {
  return text.split("\n").filter((line) => /^\s*(?:[-*•–]|\d+[.)])\s+\S/u.test(line)).length;
}

/** Výraz z podmínky: jen bez diakritiky (velikost písmen řeší příznak i), aby zůstaly třídy jako \S. */
function foldPattern(pattern: string): string {
  return pattern.normalize("NFD").replace(/\p{M}/gu, "");
}

export function checkPasses(check: LabCheck, text: string): boolean {
  switch (check.kind) {
    case "pattern":
    case "notPattern": {
      let matches = false;
      try {
        matches = new RegExp(foldPattern(check.pattern ?? ""), "iu").test(foldText(text));
      } catch {
        matches = false;
      }
      return check.kind === "pattern" ? matches : !matches;
    }
    case "minWords":
      return wordCount(text) >= (check.n ?? 1);
    case "maxWords":
      return wordCount(text) <= (check.n ?? 1);
    case "maxSentences":
      return splitSentences(text).length <= (check.n ?? 1);
    case "minBullets":
      return bulletCount(text) >= (check.n ?? 1);
  }
}

export type CheckResult = { check: LabCheck; ok: boolean };

export function evaluateChecks(checks: readonly LabCheck[], text: string): CheckResult[] {
  return checks.map((check) => ({ check, ok: checkPasses(check, text) }));
}

export const allOk = (results: readonly CheckResult[]): boolean => results.every((result) => result.ok);

/** 3 hvězdičky napoprvé, 2 na druhý pokus, jinak 1. */
export function roundStars(attempts: number): 1 | 2 | 3 {
  return attempts <= 1 ? 3 : attempts === 2 ? 2 : 1;
}

/** Od kolikátého pokusu smí žák kolo přeskočit (a vrátí se na konec série). */
export const SKIP_AFTER_ATTEMPTS = 2;

export type LabState = {
  /** Fronta kol (indexy do config.rounds); přeskočená kola se přidají na konec jen jednou. */
  queue: number[];
  position: number;
  attempts: Record<string, number>;
  stars: Record<string, number>;
  requeued: number[];
};

export function initialLab(config: PromptLabConfig): LabState {
  return { queue: config.rounds.map((_, index) => index), position: 0, attempts: {}, stars: {}, requeued: [] };
}

/** Přeskočí aktuální kolo; poprvé se vrátí na konec série, podruhé se jen odloží bez hvězdiček. */
export function skipRound(state: LabState): LabState {
  const index = state.queue[state.position];
  const again = !state.requeued.includes(index);
  return {
    ...state,
    position: state.position + 1,
    queue: again ? [...state.queue, index] : state.queue,
    requeued: again ? [...state.requeued, index] : state.requeued,
  };
}

export function solveRound(state: LabState, roundId: string, attempts: number): LabState {
  const earned = state.stars[roundId] ?? 0;
  return { ...state, stars: { ...state.stars, [roundId]: Math.max(earned, roundStars(attempts)) } };
}

export const labFinished = (state: LabState): boolean => state.position >= state.queue.length;

/** Počet kol vyřešených napoprvé a celkový počet kol (pro závěrečnou kartu). */
export function labScore(config: PromptLabConfig, state: LabState): { correct: number; total: number } {
  const correct = config.rounds.filter((round) => state.stars[round.id] === 3).length;
  return { correct, total: config.rounds.length };
}
