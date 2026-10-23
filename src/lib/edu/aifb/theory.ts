// Teorie AIFB: samostatný text pro každý blok / level, který stojí před lekcemi.
// Obsah je v src/content/aifb/aifb-theory.json (témata sdílená 2. stupněm a SŠ, SŠ může mít sekce navíc).
// Soubor je bez importů (server, klient, testy, validace).

export const FIGURE_IDS = [
  "ai-around-us", "secret-box", "learn-from-examples", "ask-check", "prompt-recipe",
  "next-word", "hallucination", "privacy-sort",
  "prompt-blocks", "markdown-json",
  "workflow", "api-request",
  "context-window", "function-calling",
  "eval-loop",
  "rag", "agents",
  "fair-data", "ai-made", "human-loop", "prompt-injection",
] as const;

export type FigureId = (typeof FIGURE_IDS)[number];

export type TheoryBlock =
  | { type: "p"; text: string }
  | { type: "list"; ordered: boolean; title?: string; items: string[] }
  | { type: "terms"; items: { term: string; text: string }[] }
  | { type: "callout"; tone: "tip" | "warning" | "info"; title: string; text: string }
  | { type: "figure"; figure: FigureId; caption: string }
  | { type: "example"; title: string; text: string };

export type TheorySection = { id: string; heading: string; blocks: TheoryBlock[] };

export type TheoryDoc = { lead: string; sections: TheorySection[]; summary: string[] };

export type TheoryFile = {
  version: string;
  status: "draft" | "reviewed" | "published";
  note: string;
  topics: Record<string, TheoryDoc>;
  levels: Record<string, { topic: string; extra?: TheorySection[] }>;
};

export type ResolvedTheory = TheoryDoc & { status: TheoryFile["status"] };

/** Teorie levelu: sekce tématu + případné sekce navíc (SŠ). Null, když level teorii nemá. */
export function resolveTheory(file: TheoryFile, levelId: string): ResolvedTheory | null {
  const entry = file.levels[levelId];
  const topic = entry ? file.topics[entry.topic] : undefined;
  if (!entry || !topic) return null;
  return { lead: topic.lead, summary: topic.summary, sections: [...topic.sections, ...(entry.extra ?? [])], status: file.status };
}

function textOf(block: TheoryBlock): string {
  switch (block.type) {
    case "p": return block.text;
    case "list": return block.items.join(" ");
    case "terms": return block.items.map((item) => `${item.term} ${item.text}`).join(" ");
    case "callout": return `${block.title} ${block.text}`;
    case "figure": return block.caption;
    case "example": return block.text;
  }
}

/** Odhad doby čtení (200 slov za minutu, nejméně 1 minuta). */
export function readingMinutes(doc: TheoryDoc): number {
  const words = [doc.lead, ...doc.summary, ...doc.sections.flatMap((section) => [section.heading, ...section.blocks.map(textOf)])]
    .join(" ")
    .split(/\s+/u)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function blockErrors(where: string, block: TheoryBlock): string[] {
  const errors: string[] = [];
  switch (block.type) {
    case "p":
      if (!nonEmpty(block.text)) errors.push(`${where}: prázdný odstavec`);
      break;
    case "list":
      if (!Array.isArray(block.items) || block.items.length === 0 || !block.items.every(nonEmpty)) errors.push(`${where}: seznam bez položek`);
      break;
    case "terms":
      if (!Array.isArray(block.items) || block.items.length === 0 || !block.items.every((item) => nonEmpty(item.term) && nonEmpty(item.text))) errors.push(`${where}: pojmy`);
      break;
    case "callout":
      if (!["tip", "warning", "info"].includes(block.tone) || !nonEmpty(block.title) || !nonEmpty(block.text)) errors.push(`${where}: upozornění`);
      break;
    case "figure":
      if (!(FIGURE_IDS as readonly string[]).includes(block.figure)) errors.push(`${where}: neznámý obrázek "${block.figure}"`);
      if (!nonEmpty(block.caption)) errors.push(`${where}: obrázek bez popisku`);
      break;
    case "example":
      if (!nonEmpty(block.title) || !nonEmpty(block.text)) errors.push(`${where}: ukázka`);
      break;
    default:
      errors.push(`${where}: neznámý typ bloku`);
  }
  return errors;
}

/** Kontrola souboru teorie: každý level má teorii, sekce mají unikátní id, bloky jsou platné. */
export function validateTheory(file: TheoryFile, levelIds: readonly string[]): string[] {
  const errors: string[] = [];
  if (!["draft", "reviewed", "published"].includes(file.status)) errors.push("aifb-theory: neplatný stav");
  for (const levelId of levelIds) {
    const entry = file.levels[levelId];
    if (!entry) {
      errors.push(`aifb-theory: level "${levelId}" nemá teorii`);
      continue;
    }
    const topic = file.topics[entry.topic];
    if (!topic) {
      errors.push(`aifb-theory: level "${levelId}" odkazuje na neexistující téma "${entry.topic}"`);
      continue;
    }
    if (!nonEmpty(topic.lead) || !Array.isArray(topic.summary) || topic.summary.length === 0) errors.push(`aifb-theory ${entry.topic}: chybí úvod nebo shrnutí`);
    const sections = [...topic.sections, ...(entry.extra ?? [])];
    const ids = new Set<string>();
    for (const section of sections) {
      const where = `aifb-theory ${levelId}#${section.id}`;
      if (ids.has(section.id)) errors.push(`${where}: duplicitní id sekce`);
      ids.add(section.id);
      if (!nonEmpty(section.heading) || !Array.isArray(section.blocks) || section.blocks.length === 0) errors.push(`${where}: sekce bez nadpisu nebo obsahu`);
      for (const block of section.blocks ?? []) errors.push(...blockErrors(where, block));
    }
  }
  for (const levelId of Object.keys(file.levels)) {
    if (!levelIds.includes(levelId)) errors.push(`aifb-theory: neznámý level "${levelId}"`);
  }
  return errors;
}
