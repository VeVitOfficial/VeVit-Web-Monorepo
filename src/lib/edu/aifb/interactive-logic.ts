// Čistá logika interaktivních cvičení (bez Reactu): třídění karet, semafor, kvíz, věty pro hledání chyb.
// Odděleno od komponent, aby šla pokrýt jednotkovými testy. Bez importů kromě typů.

import type { CardSortConfig, PairMatchConfig, PromptBuilderConfig, QuizConfig, ScaleLineConfig, TextDetectiveConfig, TrafficLightConfig } from "./pupil.ts";

export type Placement = Record<string, string>; // id karty → id hromádky

export function placeCard(placement: Placement, cardId: string, pileId: string | null): Placement {
  const next = { ...placement };
  if (pileId === null) delete next[cardId];
  else next[cardId] = pileId;
  return next;
}

export function cardsLeft(config: CardSortConfig, placement: Placement): number {
  return config.cards.filter((card) => placement[card.id] === undefined).length;
}

/** Karty zařazené jinak, než je v `expected`; bez `expected` se nehodnotí (prázdný seznam). */
export function misplacedCards(config: CardSortConfig, placement: Placement): string[] {
  if (!config.expected) return [];
  return config.cards.filter((card) => placement[card.id] !== undefined && placement[card.id] !== config.expected?.[card.id]).map((card) => card.id);
}

export type Light = "green" | "red";

export function trafficCorrect(config: TrafficLightConfig, answers: Record<string, Light>): { answered: number; graded: number; correct: number } {
  let graded = 0;
  let correct = 0;
  for (const situation of config.situations) {
    const answer = answers[situation.id];
    if (answer === undefined || situation.answer === undefined) continue;
    graded += 1;
    if (answer === situation.answer) correct += 1;
  }
  return { answered: Object.keys(answers).length, graded, correct };
}

export function quizScore(config: QuizConfig, answers: Record<string, string>): { answered: number; correct: number; total: number } {
  let correct = 0;
  for (const question of config.questions) {
    if (answers[question.id] === question.correct) correct += 1;
  }
  return { answered: Object.keys(answers).length, correct, total: config.questions.length };
}

/** Hvězdičky za cvičení: 3 = vše napoprvé, 2 = aspoň 60 %, 1 = dokončeno. Bez hodnocených položek 3. */
export function starsFor(correct: number, total: number): 1 | 2 | 3 {
  if (total <= 0 || correct >= total) return 3;
  return correct / total >= 0.6 ? 2 : 1;
}

/** Skládačka zadání: části, ve kterých je vybraná vhodná kartička. */
export function promptSlotsRight(config: PromptBuilderConfig, picked: Record<string, string>): string[] {
  return config.slots.filter((slot) => slot.options.find((option) => option.id === picked[slot.id])?.good === true).map((slot) => slot.id);
}

/** Text zadání složený z vybraných kartiček (v pořadí částí). */
export function assemblePrompt(config: PromptBuilderConfig, picked: Record<string, string>): string {
  return config.slots.map((slot) => slot.options.find((option) => option.id === picked[slot.id])?.text).filter(Boolean).join(" ");
}

/** Detektiv: kolik hledaných úseků je nalezeno a kolik zbývá. */
export function detectiveProgress(config: TextDetectiveConfig, found: readonly string[]): { total: number; found: number; done: boolean } {
  const targets = config.segments.filter((segment) => segment.target === true).map((segment) => segment.id);
  const hit = targets.filter((id) => found.includes(id)).length;
  return { total: targets.length, found: hit, done: hit === targets.length };
}

/** Přímka: 0 = trefa, -1 = je potřeba víc doleva, 1 = víc doprava. */
export function scaleHit(item: ScaleLineConfig["items"][number], position: number): -1 | 0 | 1 {
  if (position < item.min) return 1;
  if (position > item.max) return -1;
  return 0;
}

/** Spojovačka: stálé (ne náhodné) promíchání pravého sloupce, aby se server a prohlížeč shodly. */
export function pairRightOrder(config: PairMatchConfig): string[] {
  // FNV-1a nad textem pravé karty: pořadí nezávisí na pořadí dvojic v konfiguraci.
  const weight = (text: string) => [...text].reduce((hash, ch) => Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const weights = new Map(config.pairs.map((pair) => [pair.id, weight(pair.right)]));
  const order = config.pairs.map((pair) => pair.id).sort((a, b) => (weights.get(a) ?? 0) - (weights.get(b) ?? 0) || a.localeCompare(b));
  // Když by promíchání vyšlo stejně jako levý sloupec, posuň ho o jedna.
  return order.every((id, i) => id === config.pairs[i].id) ? [...order.slice(1), order[0]] : order;
}

/** Rozdělí text na věty pro označování pochybností (tečka/otazník/vykřičník + mezera). */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
