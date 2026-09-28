import "server-only";

// Serverová data pro React stránky /edu/ai-gramotnost/*: katalog kurzu,
// obsah lekcí a úvodů kapitol (src/content/ai-gramotnost) a stav přihlášení.

import { AccountBackendUnavailableError, loadSessionFromCookies } from "@/lib/account-session";
import { eduCourseLessonSlugs, eduLesson, eduLoadChapter } from "@/lib/edu-quiz-content";
import type { ChapterIntro, CourseDetail, QuizLesson } from "@/components/edu/ai-gramotnost/types";

export interface AiGramSession {
  authenticated: boolean;
  csrfToken: string;
}

export async function loadAiGramSession(): Promise<AiGramSession> {
  try {
    const session = await loadSessionFromCookies();
    return session ? { authenticated: true, csrfToken: session.csrfToken } : { authenticated: false, csrfToken: "" };
  } catch (error) {
    // Nedostupný backend = stejné chování jako nepřihlášený uživatel,
    // lekce zůstávají čitelné.
    if (error instanceof AccountBackendUnavailableError) return { authenticated: false, csrfToken: "" };
    throw error;
  }
}


/** Obsah lekce pro klienta (bez zdrojového markdownu plánu). */
export function aiGramLesson(slug: string): QuizLesson | null {
  const lesson = eduLesson(slug);
  if (!lesson || !Array.isArray(lesson.questionBank)) return null;
  const { theory, questionBank, microtask, remember, title } = lesson as unknown as QuizLesson;
  return { slug: lesson.slug, title, theory, questionBank, microtask, remember };
}

/** Úvody kapitol 1–6; do klienta jdou jen texty, ne boss kvízy s odpověďmi. */
export function aiGramChapterIntros(): ChapterIntro[] {
  const intros: ChapterIntro[] = [];
  for (let number = 1; number <= 6; number += 1) {
    const chapter = eduLoadChapter(number) as (ChapterIntro & Record<string, unknown>) | null;
    if (!chapter || Number(chapter.chapter) !== number) continue;
    const { title, hook, guess, bigThree, figure, mission } = chapter;
    intros.push({ chapter: number, title, hook, guess, bigThree, figure, mission });
  }
  return intros;
}

// ── Katalog kurzu ────────────────────────────────────────────────────────
// Odvozený z obsahu (course.json + lekce + kapitoly). ID lekcí (100 + pořadí
// v course.json) jsou klíče lokálního postupu v localStorage (aigram_progress_v1).

const COURSE_DESCRIPTION = "Kompletní kurz AI gramotnosti – od základů po pokročilé techniky prompt engineeringu a integrace AI nástrojů.";

export function aiGramCourse(): CourseDetail {
  const chapters: CourseDetail["chapters"] = [];
  let totalXp = 0;
  eduCourseLessonSlugs().forEach((slug, index) => {
    const lesson = eduLesson(slug) as ({ chapter?: number; title?: string; estimatedMinutes?: number; baseXp?: number } & Record<string, unknown>) | null;
    if (!lesson) return;
    const number = Number(lesson.chapter);
    let entry = chapters.find((item) => item.id === number);
    if (!entry) {
      const chapter = eduLoadChapter(number) as { title?: string } | null;
      entry = { id: number, title: chapter?.title ?? `Kapitola ${number}`, lessons: [] };
      chapters.push(entry);
    }
    const xp = Number(lesson.baseXp) || 25;
    totalXp += xp;
    entry.lessons.push({ id: 100 + index, slug, title: String(lesson.title ?? slug), duration: Number(lesson.estimatedMinutes) || 15, xp_reward: xp });
  });
  return { title: "AI Gramotnost", description: COURSE_DESCRIPTION, total_xp: totalXp, chapters };
}
