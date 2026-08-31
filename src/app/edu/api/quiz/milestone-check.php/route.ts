import {
  handleQuizWriteRequest,
  quizFindQuestionInChapter,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizMilestoneAllowsQuestion,
  quizPreflight,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { quizEvaluateQuestion } from "@/lib/edu-quiz-evaluator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/milestone-check.php: evaluate a single boss/final
// question that belongs to the user's current milestone attempt.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const milestone = body.milestone;
    const questionId = body.question_id;
    const answer = body.answer;
    const attempt = body.attempt;
    if (
      typeof milestone !== "string"
      || typeof questionId !== "string"
      || answer === null || typeof answer !== "object" || Array.isArray(answer)
      || !Number.isInteger(attempt)
      || !quizMilestoneAllowsQuestion(milestone as string, userId, questionId as string, attempt as number)
    ) {
      quizJsonErr(request, "Otázka do tohoto milníku nepatří.", 422);
    }
    const question = quizFindQuestionInChapter(Number(questionId[0]), questionId as string);
    if (question === null) quizJsonErr(request, "Otázka neexistuje.", 404);
    const result = quizEvaluateQuestion(answer as Record<string, unknown>, question);
    if (result.valid !== true) {
      quizJsonErr(request, String(result.detail.error ?? "Neplatná odpověď."), 422);
    }
    return quizJsonOk(request, { result, why: question.why ?? "" });
  });
}