import "server-only";

/**
 * Quiz content registry. The PHP quiz engine reads lesson/chapter JSON from
 * the repository filesystem at request time; on Vercel the serverless bundle
 * cannot rely on loose files, so the (344 kB total) content is imported
 * statically and exposed through the same lookup helpers as lib.php.
 */

import courseJson from "../../edu/content/ai-gramotnost/course.json";
import chapter01 from "../../edu/content/ai-gramotnost/chapters/01-uvod.json";
import chapter02 from "../../edu/content/ai-gramotnost/chapters/02-jak-ai-funguje.json";
import chapter03 from "../../edu/content/ai-gramotnost/chapters/03-prompt-engineering.json";
import chapter04 from "../../edu/content/ai-gramotnost/chapters/04-prakticka-integrace.json";
import chapter05 from "../../edu/content/ai-gramotnost/chapters/05-pokrocila-temata.json";
import chapter06 from "../../edu/content/ai-gramotnost/chapters/06-zaver-a-projekty.json";
import lesson101 from "../../edu/content/ai-gramotnost/lessons/1-1-co-je-ai.json";
import lesson102 from "../../edu/content/ai-gramotnost/lessons/1-2-rozdeleni-ai.json";
import lesson103 from "../../edu/content/ai-gramotnost/lessons/1-3-ml-dl-llm.json";
import lesson104 from "../../edu/content/ai-gramotnost/lessons/1-4-etika-bezpecnost.json";
import lesson201 from "../../edu/content/ai-gramotnost/lessons/2-1-neuronove-site.json";
import lesson202 from "../../edu/content/ai-gramotnost/lessons/2-2-velke-jazykove-modely.json";
import lesson203 from "../../edu/content/ai-gramotnost/lessons/2-3-porovnani-modelu.json";
import lesson204 from "../../edu/content/ai-gramotnost/lessons/2-4-multimodalni-ai.json";
import lesson301 from "../../edu/content/ai-gramotnost/lessons/3-1-uvod-prompt-engineering.json";
import lesson302 from "../../edu/content/ai-gramotnost/lessons/3-2-struktura-promptu.json";
import lesson303 from "../../edu/content/ai-gramotnost/lessons/3-3-typy-promptu.json";
import lesson304 from "../../edu/content/ai-gramotnost/lessons/3-4-iterace-a-ladeni.json";
import lesson305 from "../../edu/content/ai-gramotnost/lessons/3-5-systemove-prompty.json";
import lesson306 from "../../edu/content/ai-gramotnost/lessons/3-6-sumarizace.json";
import lesson307 from "../../edu/content/ai-gramotnost/lessons/3-7-tvorba-obsahu.json";
import lesson308 from "../../edu/content/ai-gramotnost/lessons/3-8-promptovani-pro-kod.json";
import lesson309 from "../../edu/content/ai-gramotnost/lessons/3-9-analyza-dat.json";
import lesson310 from "../../edu/content/ai-gramotnost/lessons/3-10-kreativni-ukoly.json";
import lesson311 from "../../edu/content/ai-gramotnost/lessons/3-11-preklady-lokalizace.json";
import lesson312 from "../../edu/content/ai-gramotnost/lessons/3-12-pokrocile-techniky.json";
import lesson401 from "../../edu/content/ai-gramotnost/lessons/4-1-kancelarske-nastroje.json";
import lesson402 from "../../edu/content/ai-gramotnost/lessons/4-2-prezentace-vizualni-obsah.json";
import lesson403 from "../../edu/content/ai-gramotnost/lessons/4-3-komunikace-emaily.json";
import lesson404 from "../../edu/content/ai-gramotnost/lessons/4-4-vyzkum-studium.json";
import lesson405 from "../../edu/content/ai-gramotnost/lessons/4-5-agenti-automatizace.json";
import lesson406 from "../../edu/content/ai-gramotnost/lessons/4-6-integrace-ai.json";
import lesson501 from "../../edu/content/ai-gramotnost/lessons/5-1-prace-s-api.json";
import lesson502 from "../../edu/content/ai-gramotnost/lessons/5-2-vlastni-chatbot.json";
import lesson503 from "../../edu/content/ai-gramotnost/lessons/5-3-uvod-do-rag.json";
import lesson504 from "../../edu/content/ai-gramotnost/lessons/5-4-fine-tuning.json";
import lesson505 from "../../edu/content/ai-gramotnost/lessons/5-5-budoucnost-ai.json";
import lesson506 from "../../edu/content/ai-gramotnost/lessons/5-6-lokalni-modely-soukromi.json";
import lesson601 from "../../edu/content/ai-gramotnost/lessons/6-1-kriticke-mysleni.json";
import lesson602 from "../../edu/content/ai-gramotnost/lessons/6-2-projekt-prompt.json";
import lesson603 from "../../edu/content/ai-gramotnost/lessons/6-3-projekt-workflow.json";
import lesson604 from "../../edu/content/ai-gramotnost/lessons/6-4-zaverecny-test.json";
import final6Json from "../../shared/quiz-private/final-6.json";

export type QuizQuestion = Record<string, unknown>;
export type LessonJson = Record<string, unknown> & { slug: string };
export type ChapterJson = Record<string, unknown>;

const LESSONS: readonly LessonJson[] = [
  lesson101, lesson102, lesson103, lesson104,
  lesson201, lesson202, lesson203, lesson204,
  lesson301, lesson302, lesson303, lesson304, lesson305, lesson306,
  lesson307, lesson308, lesson309, lesson310, lesson311, lesson312,
  lesson401, lesson402, lesson403, lesson404, lesson405, lesson406,
  lesson501, lesson502, lesson503, lesson504, lesson505, lesson506,
  lesson601, lesson602, lesson603, lesson604,
];

const CHAPTERS: Readonly<Record<number, ChapterJson | undefined>> = {
  1: chapter01, 2: chapter02, 3: chapter03, 4: chapter04, 5: chapter05, 6: chapter06,
};

export const QUIZ_COURSE = "ai-gramotnost";

/** Port of quiz_api_lesson_path()+read: exact slug match against lesson JSON. */
export function eduLesson(slug: string): LessonJson | null {
  return LESSONS.find((lesson) => lesson.slug === slug) ?? null;
}

/** Question from a lesson's questionBank, or null. */
export function eduFindQuestion(lessonSlug: string, questionId: string): QuizQuestion | null {
  const lesson = eduLesson(lessonSlug);
  if (!lesson) return null;
  const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
  const question = bank.find(
    (candidate): candidate is QuizQuestion =>
      candidate !== null && typeof candidate === "object" && (candidate as QuizQuestion).id === questionId,
  );
  return question ?? null;
}

/** Port of quiz_api_load_chapter(): boss config for one chapter. */
export function eduLoadChapter(chapterNumber: number): ChapterJson | null {
  if (chapterNumber < 1 || chapterNumber > 6) return null;
  return CHAPTERS[chapterNumber] ?? null;
}

/** Lesson slug order from course.json (used by warmup selection). */
export function eduCourseLessonSlugs(): string[] {
  const lessons = Array.isArray((courseJson as Record<string, unknown>).lessons)
    ? ((courseJson as Record<string, unknown>).lessons as Array<Record<string, unknown>>)
    : [];
  return lessons
    .map((entry) => entry.slug)
    .filter((slug): slug is string => typeof slug === "string");
}

/** Private final-6 question pool (never exposed verbatim; publicQuestion strips keys). */
export function eduFinalPrivateQuestions(): QuizQuestion[] {
  const questions = (final6Json as Record<string, unknown>).questions;
  return Array.isArray(questions) ? (questions as QuizQuestion[]) : [];
}

/** All questions of one chapter (boss pool + lessons), for final selection. */
export function eduChapterLessons(chapterNumber: number): LessonJson[] {
  return LESSONS.filter((lesson) => typeof lesson.slug === "string" && Number(lesson.slug[0]) === chapterNumber);
}