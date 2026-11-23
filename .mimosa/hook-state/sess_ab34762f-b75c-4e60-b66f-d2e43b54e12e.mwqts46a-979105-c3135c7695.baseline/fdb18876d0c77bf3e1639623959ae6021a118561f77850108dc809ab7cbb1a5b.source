import {
  handleQuizWriteRequest,
  phpMbLength,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import {
  eduFindQuestion,
  type QuizQuestion,
} from "@/lib/edu-quiz-content";
import { sbFindOne, sbInsert } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/submission.php: idempotent text submission for
// prompt_lab / open_rubric questions (deduped per user+lesson+question).

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const body = await quizJsonBody(request);
    const kind = body.kind;
    const lessonSlug = body.lesson_slug;
    const questionId = body.question_id;
    const text = body.body;
    if (
      !["open", "prompt_lab"].includes(kind as string)
      || typeof lessonSlug !== "string"
      || typeof questionId !== "string"
      || typeof text !== "string"
      || !/^[1-6]-[0-9]+-q[0-9]+$/.test(questionId)
    ) {
      quizJsonErr(request, "Neplatné odevzdání.", 422);
    }
    const sourceQuestion = eduFindQuestion(lessonSlug as string, questionId as string);
    const expectedKind = (sourceQuestion as QuizQuestion | null)?.type === "prompt_lab"
      ? "prompt_lab"
      : (sourceQuestion as QuizQuestion | null)?.type === "open_rubric"
        ? "open"
        : null;
    if (expectedKind === null || kind !== expectedKind) {
      quizJsonErr(request, "Otázka nepřijímá textové odevzdání.", 422);
    }
    const trimmedText = String(body.body).trim();
    if (trimmedText === "" || phpMbLength(trimmedText) > 12000) {
      quizJsonErr(request, "Text odevzdání má neplatnou délku.", 422);
    }
    const source = (sourceQuestion ?? {}) as QuizQuestion;
    const payload = source.payload !== null && typeof source.payload === "object"
      ? (source.payload as QuizQuestion)
      : {};
    const rubric = Array.isArray(payload.rubric) ? [...(payload.rubric as unknown[])] : [];
    const selfRubric = body.self_rubric !== null && typeof body.self_rubric === "object" && !Array.isArray(body.self_rubric)
      ? (body.self_rubric as Record<string, unknown>)
      : {};
    const scores = Array.isArray(selfRubric.scores) ? [...(selfRubric.scores as unknown[])] : [];
    let validScores = rubric.length > 0 && scores.length === rubric.length;
    for (const score of scores) {
      if (!Number.isInteger(score) || (score as number) < 0 || (score as number) > 5) validScores = false;
    }
    if (!validScores) quizJsonErr(request, "Vyplň sebehodnocení 0–5 u všech kritérií.", 422);

    const userId = quizUserId(request, session);
    const existing = await sbFindOne(
      "edu_quiz_submission",
      { user_id: userId, lesson_slug: lessonSlug as string, question_id: questionId as string },
      "id,kind,body,self_rubric,status,created_at",
    );
    if (existing.error) quizJsonErr(request, "Odevzdání se nepodařilo ověřit.", 503);
    if (existing.data) {
      return quizJsonOk(request, { submission: existing.data, duplicate: true });
    }
    const result = await sbInsert("edu_quiz_submission", {
      user_id: userId,
      lesson_slug: lessonSlug as string,
      question_id: questionId as string,
      kind: kind as string,
      body: trimmedText,
      self_rubric: selfRubric,
    });
    if (result.error) quizJsonErr(request, "Odevzdání se nepodařilo uložit.", 503);
    return quizJsonOk(request, { submission: result.data, duplicate: false }, 201);
  });
}