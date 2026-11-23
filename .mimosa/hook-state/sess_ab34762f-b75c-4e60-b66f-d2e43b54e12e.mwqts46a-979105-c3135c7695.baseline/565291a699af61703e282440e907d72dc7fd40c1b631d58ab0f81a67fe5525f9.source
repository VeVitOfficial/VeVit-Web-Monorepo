import {
  handleQuizWriteRequest,
  quizFindQuestionInChapter,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizScheduleReviewNow,
  quizUserId,
} from "@/lib/edu-quiz-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/review-queue.php: schedule 1–5 questions for spaced
// repetition review immediately.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const rawIds = body.question_ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0 || rawIds.length > 5) {
      quizJsonErr(request, "Vyber jednu až pět otázek.", 422);
    }
    const ids = [...new Set(rawIds as unknown[])];
    try {
      for (const questionId of ids) {
        if (
          typeof questionId !== "string"
          || !/^[1-6]-[0-9]+-q[0-9]+$/.test(questionId)
          || quizFindQuestionInChapter(Number(questionId[0]), questionId) === null
        ) {
          quizJsonErr(request, "Neplatná otázka k opakování.", 422);
        }
        await quizScheduleReviewNow(userId, questionId as string);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("SRS ")) {
        quizJsonErr(request, "Opakování se nepodařilo naplánovat.", 503);
      }
      throw error;
    }
    return quizJsonOk(request, { scheduled: ids });
  });
}