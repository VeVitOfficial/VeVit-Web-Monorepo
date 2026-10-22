// Žákovská vrstva AIFB (F6): konfigurace interaktivních komponent a jejich kontrola.
// Obsah vrstvy je v src/content/aifb/pupil-pilots.json a je vždy ve stavu "draft" (pravidlo R7);
// stav reviewed/published nastavuje jen vlastník. Soubor je bez importů (klient, server, testy).

export type PupilComponent = "CardSort" | "TrafficLightCards" | "QuizCard" | "AiSandbox";

export const PUPIL_COMPONENTS: readonly PupilComponent[] = ["CardSort", "TrafficLightCards", "QuizCard", "AiSandbox"];

export type CardSortConfig = {
  piles: { id: string; label: string }[];
  cards: { id: string; label: string }[];
  /** Volitelné správné zařazení (id karty → id hromádky). Bez něj se nehodnotí, jen se zdůvodňuje. */
  expected?: Record<string, string>;
  hint?: string;
};

export type TrafficLightConfig = {
  situations: { id: string; text: string; answer?: "green" | "red"; feedback?: string }[];
};

export type QuizConfig = {
  questions: {
    id: string;
    prompt: string;
    options: { id: string; text: string }[];
    correct: string;
    explanation: string;
  }[];
};

export type AiSandboxConfig =
  | { mode: "prompt-rescue"; vaguePrompts: string[] }
  | { mode: "fact-check"; topicLabel: string };

export type PupilLayer = {
  status: "draft" | "reviewed" | "published";
  component?: PupilComponent;
  text?: string[];
  config?: CardSortConfig | TrafficLightConfig | QuizConfig | AiSandboxConfig;
  /** Poznámky pro vlastníka (co je potřeba potvrdit); žákům se nikdy neukazují. */
  reviewNotes?: string[];
};

export type PupilOverlay = {
  version: string;
  note: string;
  lessons: Record<string, PupilLayer>;
};

const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const unique = (values: string[]) => new Set(values).size === values.length;

/** Vrací seznam chyb konfigurace (prázdný = platné). */
export function validatePupilLayer(lessonId: string, layer: PupilLayer): string[] {
  const errors: string[] = [];
  const where = `pupil-pilots ${lessonId}`;
  if (layer.status !== "draft") errors.push(`${where}: stav musí být "draft" (reviewed/published nastavuje jen vlastník)`);
  if (layer.text !== undefined && !(Array.isArray(layer.text) && layer.text.every(isString))) errors.push(`${where}: text musí být pole řetězců`);
  if (layer.component === undefined) return errors;
  if (!PUPIL_COMPONENTS.includes(layer.component)) {
    errors.push(`${where}: neznámá komponenta "${layer.component}"`);
    return errors;
  }
  const config = layer.config as Record<string, unknown> | undefined;
  if (!config) {
    errors.push(`${where}: chybí config`);
    return errors;
  }
  if (layer.component === "CardSort") {
    const c = config as unknown as CardSortConfig;
    if (!Array.isArray(c.piles) || c.piles.length < 2 || !c.piles.every((p) => isString(p.id) && isString(p.label))) errors.push(`${where}: piles`);
    if (!Array.isArray(c.cards) || c.cards.length < 2 || !c.cards.every((p) => isString(p.id) && isString(p.label))) errors.push(`${where}: cards`);
    else if (!unique(c.cards.map((card) => card.id))) errors.push(`${where}: duplicitní id karet`);
    if (c.expected && Array.isArray(c.piles) && Array.isArray(c.cards)) {
      const pileIds = new Set(c.piles.map((p) => p.id));
      const cardIds = new Set(c.cards.map((p) => p.id));
      for (const [card, pile] of Object.entries(c.expected)) {
        if (!cardIds.has(card) || !pileIds.has(pile)) errors.push(`${where}: expected odkazuje na neexistující kartu/hromádku (${card}→${pile})`);
      }
    }
  } else if (layer.component === "TrafficLightCards") {
    const c = config as unknown as TrafficLightConfig;
    if (!Array.isArray(c.situations) || c.situations.length < 2 || !c.situations.every((s) => isString(s.id) && isString(s.text) && (s.answer === undefined || s.answer === "green" || s.answer === "red"))) {
      errors.push(`${where}: situations`);
    } else if (!unique(c.situations.map((s) => s.id))) errors.push(`${where}: duplicitní id situací`);
  } else if (layer.component === "QuizCard") {
    const c = config as unknown as QuizConfig;
    if (!Array.isArray(c.questions) || c.questions.length === 0) errors.push(`${where}: questions`);
    else {
      for (const q of c.questions) {
        const ids = Array.isArray(q.options) ? q.options.map((o) => o.id) : [];
        if (!isString(q.id) || !isString(q.prompt) || ids.length < 2 || !unique(ids) || !ids.includes(q.correct) || !isString(q.explanation)) {
          errors.push(`${where}: otázka ${q.id} nemá platné možnosti, správnou odpověď nebo vysvětlení`);
        }
      }
    }
  } else if (layer.component === "AiSandbox") {
    const c = config as unknown as AiSandboxConfig;
    if (c.mode === "prompt-rescue") {
      if (!Array.isArray(c.vaguePrompts) || c.vaguePrompts.length < 1 || !c.vaguePrompts.every(isString)) errors.push(`${where}: vaguePrompts`);
    } else if (c.mode === "fact-check") {
      if (!isString(c.topicLabel)) errors.push(`${where}: topicLabel`);
    } else errors.push(`${where}: neznámý režim AiSandbox`);
  }
  return errors;
}
