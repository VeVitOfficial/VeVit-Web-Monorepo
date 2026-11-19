// GENEROVÁNO skriptem scripts/aifb-gen-types.mjs ze src/content/aifb/aifb-content.schema.json.
// Needitovat ručně: po změně schématu spusť `npm run gen:aifb-types`.

/** Text s lehkým Markdownem: pouze **tučně** a *kurzíva*. Neoddělitelné mezery (U+00A0) za jednoznakovými předložkami zachovat. */
export type Md = string;

export type Block = {
  type: "p";
  text: Md;
} | {
  type: "heading";
  text: string;
} | {
  type: "list";
  ordered: boolean;
  title?: string;
  items: Md[];
} | {
  type: "table";
  caption: string;
  header: string[];
  rows: string[][];
} | {
  type: "callout";
  title: string;
  paras: Md[];
};

export type GuideSection = {
  number: string;
  id: string;
  title: string;
  blocks: Block[];
};

export type GuideChapter = {
  number: string;
  id: string;
  title: string;
  blocks: Block[];
  sections?: GuideSection[];
};

/** Vrstva pro žáky. V plánech pro učitele žádný text pro žáky není, proto je výchozí stav todo. */
export type Pupil = {
  status: "todo" | "draft" | "reviewed" | "published";
  text?: Md[];
  interactive?: {
    component: string;
    config?: Record<string, unknown>;
  };
};

export type Lesson = {
  id: string;
  type: "theory";
  order: 0;
  title: string;
  teacher: {
    intro: Md[];
    reviewQuestions: Md[];
    discussionTopics: Md[];
  };
  pupil: Pupil;
} | {
  id: string;
  type: "exercise";
  order: number;
  title: string;
  teacher: {
    description: Md[];
    expectedOutput: Md;
    form: Md;
    time: string;
  };
  pupil: Pupil;
};

export type Level = {
  id: string;
  order: number;
  code: string;
  title: string;
  subtitle?: string;
  unitLabel: "Blok" | "Level";
  grades?: string;
  recommendedPlacement?: string;
  derivedFrom?: string;
  themes: string;
  intro: Md[];
  goals: Md[];
  hours: string;
  hoursNote?: string;
  schedule: {
    header: string[];
    rows: string[][];
  };
  scheduleNote: Md[];
  lessons: Lesson[];
  lessonCount: number;
  teacherNotes: Md[];
  status: "content-ready";
  certification: null | {
    name: string | null;
    status: "planned";
  };
  /** Návrh vizuálu pro téma pirate-map (x, y v % plochy mapy). */
  visual?: {
    islandName?: string;
    icon?: string;
    x?: number;
    y?: number;
    hint?: string;
    proposal?: boolean;
  };
};

/** AIFB – obsah kategorie (aifb-content-*.json) */
export type AifbContent = {
  schemaVersion: "1.0";
  version: string;
  language: "cs";
  category: {
    id: "zs1" | "zs2" | "ss";
    title: string;
    subtitle: string;
    grades: string;
    unit: "Blok" | "Level";
    theme: "pirate-map" | "trail" | "clean";
    usageMode: "teacher-led" | "teacher-led-then-individual" | "individual";
    audience: string;
    source: {
      document: string;
      note: string;
    };
  };
  /** Kapitoly pro učitele (úvod, pravidla, ochrana údajů, doporučený postup). Čísla kapitol se zobrazují, protože se na ně text odkazuje (např. „oddíl 7.2“). */
  guide: GuideChapter[];
  levels: Level[];
};
