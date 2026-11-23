// Typy AIFB: obsah kategorií je generovaný ze schématu (types.generated.ts), zde jsou
// jen pojmenované aliasy a typy katalogu (katalog nemá vlastní schéma).

import type { AifbContent, GuideChapter, GuideSection, Lesson } from "./types.generated.ts";

export type { AifbContent, Block, GuideChapter, GuideSection, Lesson, Md, Pupil } from "./types.generated.ts";

export type Level = AifbContent["levels"][number];
export type CategoryMeta = AifbContent["category"];
export type TheoryLesson = Extract<Lesson, { type: "theory" }>;
export type ExerciseLesson = Extract<Lesson, { type: "exercise" }>;
export type Theme = CategoryMeta["theme"];
export type CategoryId = CategoryMeta["id"];
export type Certification = Level["certification"];
export type Visual = NonNullable<Level["visual"]>;

export const CONTENT_CATEGORY_IDS = ["zs1", "zs2", "ss"] as const satisfies readonly CategoryId[];

export function isCategoryId(value: string): value is CategoryId {
  return (CONTENT_CATEGORY_IDS as readonly string[]).includes(value);
}

export type CatalogLevel = {
  id: string;
  order: number;
  code: string;
  title: string;
  subtitle: string | null;
  grades: string | null;
  hours: string;
  lessonCount: number;
  certification: { name: string | null; status: "planned" } | null;
  route: string;
};

export type CatalogCategory = {
  id: string;
  title: string;
  subtitle: string;
  grades: string;
  theme: Theme;
  usageMode: string;
  status: "content-ready" | "existing";
  route: string;
  contentFile: string | null;
  unit: string;
  legacyCourse?: boolean;
  note?: string;
  levels: CatalogLevel[];
  totals: { levels: number; lessons: number };
};

export type Catalog = {
  schemaVersion: string;
  version: string;
  language: "cs";
  hub: { route: string; title: string; subtitle: string; note: string };
  categories: CatalogCategory[];
  totals: { categoriesWithContent: number; levels: number; lessons: number };
};

export type GuideEntry = { chapter: GuideChapter; section?: GuideSection };
