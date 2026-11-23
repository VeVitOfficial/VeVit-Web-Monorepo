import {
  handleQuizRequest,
  quizMilestoneChapter,
  quizMilestoneQuestions,
  quizPublicQuestion,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
  type QuizQuestion,
} from "@/lib/edu-quiz-lib";
import { eduChapterLessons, eduLoadChapter } from "@/lib/edu-quiz-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/milestone-config.php: boss/final configuration —
// server-selected public questions, lives, threshold and (final only) the
// adaptive re-answer pool with chapter tags.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

/** PHP FILTER_VALIDATE_INT: digits only, no leading zeros, optional sign. */
function phpFilterInt(value: string): number | null {
  if (!/^[+-]?[0-9]+$/.test(value)) return null;
  if (/^[+-]?0[0-9]+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}

function withChapterTag(question: QuizQuestion, tag: string): QuizQuestion {
  const tags = Array.isArray(question.tags) ? (question.tags as unknown[]) : [];
  return { ...question, tags: [...new Set([...tags, tag])] };
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const params = new URL(request.url).searchParams;
    const milestone = params.get("milestone") ?? "";
    if (quizMilestoneChapter(milestone) === null) quizJsonErr(request, "Neplatný milník.", 422);
    const attemptValue = phpFilterInt(params.get("attempt") ?? "1");
    const attempt = attemptValue !== null && attemptValue >= 1 && attemptValue <= 20 ? attemptValue : null;
    if (attempt === null) quizJsonErr(request, "Neplatný pokus.", 422);
    const questions = quizMilestoneQuestions(milestone, userId, attempt);
    const chapterNumber = quizMilestoneChapter(milestone) as number;
    const chapter = eduLoadChapter(chapterNumber);
    const boss = chapter !== null && chapter.bossQuiz !== null && typeof chapter.bossQuiz === "object"
      ? (chapter.bossQuiz as Record<string, unknown>)
      : null;
    if (questions === null || boss === null) quizJsonErr(request, "Milník zatím nemá serverovou definici.", 409);

    const adaptivePool: QuizQuestion[] = [];
    if (milestone === "final-6") {
      for (let chapterIdx = 1; chapterIdx <= 6; chapterIdx++) {
        for (const lesson of eduChapterLessons(chapterIdx)) {
          const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
          for (const question of bank) {
            if (question === null || typeof question !== "object") continue;
            const id = question.id;
            if (typeof id !== "string" || id.startsWith("6-4-")) continue;
            adaptivePool.push(quizPublicQuestion(withChapterTag(question, `chapter-${chapterIdx}`)));
          }
        }
      }
    }

    return quizJsonOk(request, {
      milestone,
      attempt,
      questions: questions.map((question) =>
        quizPublicQuestion(withChapterTag(question, `chapter-${String(question.id)[0]}`))),
      lives: Math.trunc(Number(boss.lives ?? 0)),
      pass_score_pct: Math.trunc(Number(boss.passScorePct ?? 70)),
      adaptive: boss.adaptive === true,
      adaptive_pool: adaptivePool,
    });
  });
}