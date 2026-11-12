// Žákovská vrstva AIFB (F6): konfigurace interaktivních komponent a jejich kontrola.
// Obsah vrstvy je v src/content/aifb/pupil-pilots.json. Stav "draft" = návrh (jen vývoj a náhled),
// "reviewed" = vlastník cvičení schválil a zobrazuje se i na produkci (pravidlo R7). Stav "published"
// nastavuje jen admin úpravou v aplikaci. Soubor je bez importů (klient, server, testy).

export type PupilComponent =
  | "CardSort" | "TrafficLightCards" | "QuizCard" | "AiSandbox"
  | "PromptBuilder" | "TextDetective" | "NextWord" | "ScaleLine" | "ChatSim" | "PairMatch" | "PromptLab";

export const PUPIL_COMPONENTS: readonly PupilComponent[] = [
  "CardSort", "TrafficLightCards", "QuizCard", "AiSandbox",
  "PromptBuilder", "TextDetective", "NextWord", "ScaleLine", "ChatSim", "PairMatch", "PromptLab",
];

/** Volitelný obrázek (emoji) u karty, hromádky, možnosti nebo situace; je jen ozdobný (čtečky ho nečtou). */
type WithEmoji = { emoji?: string };

export type CardSortConfig = {
  piles: ({ id: string; label: string } & WithEmoji)[];
  cards: ({ id: string; label: string } & WithEmoji)[];
  /** Volitelné správné zařazení (id karty → id hromádky). Bez něj se nehodnotí, jen se zdůvodňuje. */
  expected?: Record<string, string>;
  hint?: string;
};

export type TrafficLightConfig = {
  /** Vlastní popisky tlačítek (výchozí: „můžu říct" / „tajemství"). */
  labels?: { green: string; red: string };
  situations: ({ id: string; text: string; answer?: "green" | "red"; feedback?: string } & WithEmoji)[];
};

export type QuizConfig = {
  questions: {
    id: string;
    prompt: string;
    emoji?: string;
    options: ({ id: string; text: string } & WithEmoji)[];
    correct: string;
    explanation: string;
  }[];
};

/** Skládačka zadání: v každé části (role, úkol, podoba…) se vybírá jedna kartička; `good` = vhodná volba. */
export type PromptBuilderConfig = {
  goal: string;
  slots: { id: string; label: string; why: string; options: { id: string; text: string; good?: boolean }[] }[];
  success: string;
};

/**
 * Detektiv v textu: text je rozdělený na úseky, žák kliká na ty, které hledá (`target`).
 * errors = chyby v odpovědi, signals = varovné znaky (zpráva, web), redact = osobní údaje, které se
 * po kliknutí nahradí textem `replacement`.
 */
export type TextDetectiveConfig = {
  mode: "errors" | "signals" | "redact";
  frame?: "document" | "chat" | "email" | "web";
  header?: { from?: string; subject?: string };
  segments: { id: string; text: string; target?: boolean; replacement?: string; explanation?: string }[];
};

/** Hra na jazykový model: žák tipuje další slovo a pak vidí, jak pravděpodobná slova volí model. */
export type NextWordConfig = {
  rounds: { id: string; start: string; options: { word: string; percent: number }[]; note: string }[];
};

/** Přímka mezi dvěma póly (1..steps); správná je pozice v rozmezí min–max. */
export type ScaleLineConfig = {
  left: string;
  right: string;
  steps?: number;
  items: ({ id: string; text: string; min: number; max: number; feedback: string } & WithEmoji)[];
};

/** Rozhovor s volbou odpovědí: zpráva protistrany a několik možných reakcí, `good` = rozumná reakce. */
export type ChatSimConfig = {
  persona: { name: string; emoji: string };
  steps: { id: string; message: string; choices: { id: string; text: string; good?: boolean; feedback: string; reply?: string }[] }[];
};

/** Šablony her nad stejnými dvojicemi (jako ve Wordwallu): žák si může hru přepnout. */
export const PAIR_TEMPLATES = ["match", "quiz", "memory", "truefalse", "flash"] as const;
export type PairTemplate = (typeof PAIR_TEMPLATES)[number];

/** Spojovačka: ke každé levé kartě patří právě jedna pravá. Stejné dvojice jdou hrát v několika šablonách. */
export type PairMatchConfig = {
  /** Šablona, ve které se hra otevře (výchozí `match`). */
  template?: PairTemplate;
  pairs: ({ id: string; left: string; right: string } & WithEmoji)[];
};

export type AiSandboxConfig =
  | { mode: "prompt-rescue"; vaguePrompts: string[] }
  | { mode: "fact-check"; topicLabel: string };

/** Podmínka, kterou aplikace hned vyhodnotí na zadání žáka (promptChecks) nebo na odpovědi AI (answerChecks). */
export type LabCheck = {
  id: string;
  /** Krátký popis podmínky, ukazuje se jako odškrtávací řádek („Řekneš, pro koho to je“). */
  label: string;
  /** Rada, když podmínka není splněná („Napiš, kdo odpověď bude číst“). */
  hint: string;
  kind: "pattern" | "notPattern" | "minWords" | "maxWords" | "maxSentences" | "minBullets";
  /** Regulární výraz (pattern/notPattern): bez rozlišení velikosti písmen i diakritiky. */
  pattern?: string;
  n?: number;
};

/**
 * Trénink zadání s AI v krátkých kolech (styl Umíme to): žák napíše zadání, AI odpoví (živě, jinak
 * uložená ukázka) a aplikace hned odškrtne splněné podmínky. Systémový prompt a uložená odpověď jsou
 * jen na serveru (`PupilLayer.server`) a klientovi se nikdy neposílají.
 */
export type PromptLabConfig = {
  rounds: {
    id: string;
    emoji?: string;
    scenario: string;
    /** Jak má vypadat dobrá odpověď (ukazuje se u kola). */
    goal: string;
    placeholder?: string;
    promptChecks: LabCheck[];
    answerChecks?: LabCheck[];
  }[];
};

export type PromptLabServer = {
  rounds: Record<string, { system: string; fallback: string; maxWords: number }>;
};

export type PupilLayer = {
  status: "draft" | "reviewed" | "published";
  component?: PupilComponent;
  /** Tematická hlavička cvičení („mise“): obrázek a krátký název. */
  theme?: { emoji: string; title: string };
  text?: string[];
  config?: CardSortConfig | TrafficLightConfig | QuizConfig | AiSandboxConfig
    | PromptBuilderConfig | TextDetectiveConfig | NextWordConfig | ScaleLineConfig | ChatSimConfig | PairMatchConfig | PromptLabConfig;
  /** Jen server (PromptLab): systémové prompty a uložené odpovědi; z vrstvy se před odesláním klientovi odstraní (`publicLayer`). */
  server?: PromptLabServer;
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

/**
 * Vrací seznam chyb konfigurace (prázdný = platné). Soubor v repozitáři smí mít stav "draft" nebo
 * "reviewed" (schváleno vlastníkem); "published" ukládá jen admin úpravou v aplikaci (`allowApproved`).
 */
export function validatePupilLayer(lessonId: string, layer: PupilLayer, options: { allowApproved?: boolean } = {}): string[] {
  const errors: string[] = [];
  const where = `pupil-pilots ${lessonId}`;
  const statuses = options.allowApproved ? ["draft", "reviewed", "published"] : ["draft", "reviewed"];
  if (!statuses.includes(layer.status)) errors.push(`${where}: stav musí být "draft" nebo "reviewed" (published nastavuje jen admin v aplikaci)`);
  if (layer.text !== undefined && !(Array.isArray(layer.text) && layer.text.every(isString))) errors.push(`${where}: text musí být pole řetězců`);
  if (layer.theme !== undefined && !(isString(layer.theme?.emoji) && isString(layer.theme?.title))) errors.push(`${where}: theme musí mít emoji a title`);
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
    if (c.labels !== undefined && !(isString(c.labels.green) && isString(c.labels.red))) errors.push(`${where}: labels`);
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
  } else if (layer.component === "PromptBuilder") {
    const c = config as unknown as PromptBuilderConfig;
    if (!isString(c.goal) || !isString(c.success) || !Array.isArray(c.slots) || c.slots.length < 2) errors.push(`${where}: goal, success a aspoň dvě části zadání`);
    else {
      if (!unique(c.slots.map((slot) => slot.id))) errors.push(`${where}: duplicitní id částí`);
      for (const slot of c.slots) {
        const options = Array.isArray(slot.options) ? slot.options : [];
        if (!isString(slot.id) || !isString(slot.label) || !isString(slot.why) || options.length < 2 || !options.every((o) => isString(o.id) && isString(o.text)) || !unique(options.map((o) => o.id)) || !options.some((o) => o.good === true) || options.every((o) => o.good === true)) {
          errors.push(`${where}: část ${slot.id} musí mít aspoň dvě možnosti, vhodnou i nevhodnou, a vysvětlení`);
        }
      }
    }
  } else if (layer.component === "TextDetective") {
    const c = config as unknown as TextDetectiveConfig;
    const segments = Array.isArray(c.segments) ? c.segments : [];
    if (!["errors", "signals", "redact"].includes(c.mode)) errors.push(`${where}: neznámý režim TextDetective`);
    if (c.frame !== undefined && !["document", "chat", "email", "web"].includes(c.frame)) errors.push(`${where}: neznámý rámec`);
    if (segments.length < 3 || !segments.every((s) => isString(s.id) && isString(s.text)) || !unique(segments.map((s) => s.id))) errors.push(`${where}: segments`);
    else {
      const targets = segments.filter((s) => s.target === true);
      if (targets.length === 0 || targets.length === segments.length) errors.push(`${where}: text musí mít hledané i nehledané úseky`);
      if (!targets.every((s) => isString(s.explanation))) errors.push(`${where}: hledaný úsek potřebuje vysvětlení`);
      if (c.mode === "redact" && !targets.every((s) => isString(s.replacement))) errors.push(`${where}: v režimu redact potřebuje hledaný úsek náhradu`);
    }
  } else if (layer.component === "NextWord") {
    const c = config as unknown as NextWordConfig;
    const rounds = Array.isArray(c.rounds) ? c.rounds : [];
    if (rounds.length === 0 || !unique(rounds.map((r) => r.id))) errors.push(`${where}: rounds`);
    for (const round of rounds) {
      const options = Array.isArray(round.options) ? round.options : [];
      if (!isString(round.id) || !isString(round.start) || !isString(round.note) || options.length < 2 || !options.every((o) => isString(o.word) && Number.isFinite(o.percent) && o.percent >= 0 && o.percent <= 100) || !unique(options.map((o) => o.word))) {
        errors.push(`${where}: kolo ${round.id} nemá platná slova a procenta`);
      }
    }
  } else if (layer.component === "ScaleLine") {
    const c = config as unknown as ScaleLineConfig;
    const steps = c.steps ?? 5;
    const items = Array.isArray(c.items) ? c.items : [];
    if (!isString(c.left) || !isString(c.right) || !Number.isInteger(steps) || steps < 3 || steps > 7) errors.push(`${where}: left, right a 3–7 kroků`);
    if (items.length < 2 || !unique(items.map((i) => i.id)) || !items.every((i) => isString(i.id) && isString(i.text) && isString(i.feedback) && Number.isInteger(i.min) && Number.isInteger(i.max) && i.min >= 1 && i.max <= steps && i.min <= i.max)) {
      errors.push(`${where}: items (text, feedback a rozmezí min–max v rozsahu přímky)`);
    }
  } else if (layer.component === "ChatSim") {
    const c = config as unknown as ChatSimConfig;
    const steps = Array.isArray(c.steps) ? c.steps : [];
    if (!isString(c.persona?.name) || !isString(c.persona?.emoji)) errors.push(`${where}: persona`);
    if (steps.length === 0 || !unique(steps.map((s) => s.id))) errors.push(`${where}: steps`);
    for (const step of steps) {
      const choices = Array.isArray(step.choices) ? step.choices : [];
      if (!isString(step.id) || !isString(step.message) || choices.length < 2 || !unique(choices.map((ch) => ch.id)) || !choices.every((ch) => isString(ch.id) && isString(ch.text) && isString(ch.feedback)) || !choices.some((ch) => ch.good === true)) {
        errors.push(`${where}: krok ${step.id} musí mít aspoň dvě reakce se zpětnou vazbou a jednu rozumnou`);
      }
    }
  } else if (layer.component === "PairMatch") {
    const c = config as unknown as PairMatchConfig;
    const pairs = Array.isArray(c.pairs) ? c.pairs : [];
    if (pairs.length < 3 || !pairs.every((p) => isString(p.id) && isString(p.left) && isString(p.right)) || !unique(pairs.map((p) => p.id)) || !unique(pairs.map((p) => p.right))) errors.push(`${where}: aspoň tři dvojice s jedinečnou pravou stranou`);
    if (c.template !== undefined && !PAIR_TEMPLATES.includes(c.template)) errors.push(`${where}: neznámá šablona "${String(c.template)}"`);
  } else if (layer.component === "PromptLab") {
    const c = config as unknown as PromptLabConfig;
    const rounds = Array.isArray(c.rounds) ? c.rounds : [];
    if (rounds.length === 0 || !unique(rounds.map((r) => r.id))) errors.push(`${where}: rounds`);
    const checkErrors = (check: LabCheck) => {
      if (!isString(check.id) || !isString(check.label) || !isString(check.hint)) return "id, label a hint";
      if (!["pattern", "notPattern", "minWords", "maxWords", "maxSentences", "minBullets"].includes(check.kind)) return "druh podmínky";
      if (check.kind === "pattern" || check.kind === "notPattern") {
        if (!isString(check.pattern)) return "pattern";
        try { new RegExp(check.pattern, "iu"); } catch { return "pattern (neplatný výraz)"; }
      } else if (!Number.isFinite(check.n) || (check.n as number) < 1) return "n";
      return null;
    };
    for (const round of rounds) {
      if (!isString(round.id) || !isString(round.scenario) || !isString(round.goal)) errors.push(`${where}: kolo ${round.id} potřebuje id, scenario a goal`);
      const promptChecks = Array.isArray(round.promptChecks) ? round.promptChecks : [];
      const answerChecks = Array.isArray(round.answerChecks) ? round.answerChecks : [];
      if (promptChecks.length === 0) errors.push(`${where}: kolo ${round.id} potřebuje aspoň jednu podmínku na zadání`);
      for (const check of [...promptChecks, ...answerChecks]) {
        const problem = checkErrors(check);
        if (problem) errors.push(`${where}: kolo ${round.id}, podmínka ${check.id}: ${problem}`);
      }
      if (!unique([...promptChecks, ...answerChecks].map((check) => check.id))) errors.push(`${where}: kolo ${round.id} má opakované id podmínky`);
      const server = layer.server?.rounds?.[round.id];
      if (!server || !isString(server.system) || !isString(server.fallback) || !(server.maxWords >= 5 && server.maxWords <= 300)) errors.push(`${where}: kolo ${round.id} nemá na serveru system, fallback a maxWords (5–300)`);
    }
  }
  return errors;
}

/** Vrstva pro prohlížeč: bez serverových částí (systémové prompty, uložené odpovědi). */
export function publicLayer(layer: PupilLayer): PupilLayer {
  if (layer.server === undefined) return layer;
  const { server: _server, ...rest } = layer;
  void _server;
  return rest;
}

/**
 * Serverová brána AI cvičení: endpoint obslouží jen lekci, jejíž žákovská vrstva existuje, je typu
 * AiSandbox nebo PromptLab a je schválená (reviewed/published); návrh (draft) jen ve vývoji a náhledových nasazeních.
 * Na produkci tak nikdo nevolá model dřív, než vlastník vrstvu schválí (pravidlo R7).
 */
export function aiLessonAvailable(layer: { status: string; component?: string } | undefined, previewEnabled: boolean): boolean {
  return layer !== undefined && (layer.component === "AiSandbox" || layer.component === "PromptLab") && (layer.status !== "draft" || previewEnabled);
}

/** Text pro žáky z originálního obsahu (pupil.text) se zobrazí, jen když ho vlastník schválil (R7). */
export function pupilVisible(pupil: { status: string; text?: string[] }): boolean {
  return (pupil.status === "reviewed" || pupil.status === "published") && Array.isArray(pupil.text) && pupil.text.length > 0;
}
