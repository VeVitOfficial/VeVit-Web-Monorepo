// Čistá logika interaktivních cvičení (bez Reactu): třídění karet, semafor, kvíz, věty pro hledání chyb.
// Odděleno od komponent, aby šla pokrýt jednotkovými testy. Bez importů kromě typů.

import type { CardSortConfig, QuizConfig, TrafficLightConfig } from "./pupil.ts";

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

/** Rozdělí text na věty pro označování pochybností (tečka/otazník/vykřičník + mezera). */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
