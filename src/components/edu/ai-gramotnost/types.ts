// Datové typy AI gramotnosti (obsah ze src/content/ai-gramotnost + katalog
// kurzu z src/lib/edu-gramotnost-content.ts).

export type Dict = Record<string, unknown>;

export interface QuizQuestion {
  id: string;
  type: string;
  prompt?: string;
  helpText?: string;
  difficulty?: string;
  why?: string;
  juniorWhy?: string;
  proWhy?: string;
  trap?: boolean;
  tags?: string[];
  payload?: Dict;
  [key: string]: unknown;
}

export interface TheoryBlock {
  title?: string;
  md?: string;
  junior?: string;
  pro?: string;
}

export interface QuizLesson {
  slug: string;
  title: string;
  theory?: { blocks?: TheoryBlock[] };
  questionBank: QuizQuestion[];
  microtask?: { md?: string; proof?: string };
  remember?: string[];
  [key: string]: unknown;
}

export interface ChapterIntro {
  chapter: number;
  title?: string;
  hook?: { md?: string };
  guess?: { md?: string };
  bigThree?: string[];
  figure?: { src?: string; alt?: string; caption?: string };
  mission?: { md?: string };
}

export interface CourseLesson {
  id: number;
  slug: string;
  title: string;
  duration?: number;
  xp_reward?: number;
}

export interface CourseChapter {
  id: number;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseDetail {
  title: string;
  description?: string;
  total_xp?: number;
  chapters: CourseChapter[];
}

export interface EvalResult {
  valid: boolean;
  correct: boolean | null;
  scorePct: number;
  detail: Dict;
}

export type Difficulty = "junior" | "pro";

export interface MilestoneConfig {
  milestone: string;
  attempt?: number;
  lives?: number;
  adaptive?: boolean;
  questions?: QuizQuestion[];
  adaptive_pool?: QuizQuestion[];
}
