import {
  handleQuizRequest,
  handleQuizWriteRequest,
  quizFindQuestionInChapter,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
  type QuizQuestion,
} from "@/lib/edu-quiz-lib";
import { sbFindOne, sbRpc } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/peer-review.php: fetch up to two open submissions for
// review (GET) and record a scored peer review (POST, XP via RPC).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function rubricOf(question: QuizQuestion | null): unknown[] {
  const payload = question !== null && question.payload !== null && typeof question.payload === "object"
    ? (question.payload as QuizQuestion)
    : null;
  return payload !== null && Array.isArray(payload.rubric) ? [...(payload.rubric as unknown[])] : [];
}

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const result = await sbRpc<Record<string, unknown>[]>("get_edu_quiz_peer_review_candidates", {
      p_reviewer_id: userId,
      p_limit: 2,
    });
    if (result.error) quizJsonErr(request, "Peer review se nepodařilo načíst.", 503);
    const reviews: Record<string, unknown>[] = [];
    for (const row of result.data ?? []) {
      if (row === null || typeof row !== "object") continue;
      const questionId = row.question_id;
      if (typeof questionId !== "string" || !/^[1-6]-[0-9]+-q[0-9]+$/.test(questionId)) continue;
      const question = quizFindQuestionInChapter(Number(questionId[0]), questionId);
      const rubric = rubricOf(question);
      if (rubric.length === 0) continue;
      reviews.push({
        submission_id: row.submission_id,
        lesson_slug: row.lesson_slug,
        question_id: questionId,
        body: row.body,
        rubric: rubric.map((item) => ({
          label: typeof item === "string"
            ? item
            : String((item as Record<string, unknown>).label ?? (item as Record<string, unknown>).text ?? "Kritérium"),
          hint: item !== null && typeof item === "object" ? String((item as Record<string, unknown>).hint ?? "") : "",
        })),
      });
    }
    return quizJsonOk(request, { reviews: reviews.slice(0, 2) });
  });
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const body = await quizJsonBody(request);
    const submissionId = body.submission_id;
    const scores = body.scores;
    if (
      typeof submissionId !== "string"
      || !UUID_RE.test(submissionId)
      || !Array.isArray(scores)
    ) {
      quizJsonErr(request, "Neplatné peer review.", 422);
    }
    const submission = await sbFindOne<Record<string, unknown>>(
      "edu_quiz_submission",
      { id: submissionId },
      "user_id,lesson_slug,question_id,status",
    );
    if (submission.error) quizJsonErr(request, "Peer review se nepodařilo ověřit.", 503);
    const row = submission.data;
    if (
      row === null
      || row.user_id === userId
      || row.status !== "submitted"
      || typeof row.question_id !== "string"
      || !/^[1-6]-[0-9]+-q[0-9]+$/.test(row.question_id)
    ) {
      quizJsonErr(request, "Odevzdání není dostupné k hodnocení.", 409);
    }
    const question = quizFindQuestionInChapter(Number(row.question_id[0]), row.question_id);
    const rubric = rubricOf(question);
    const scoreList = [...(scores as unknown[])];
    let valid = rubric.length > 0 && scoreList.length === rubric.length;
    for (const score of scoreList) {
      if (!Number.isInteger(score) || (score as number) < 0 || (score as number) > 5) valid = false;
    }
    if (!valid) quizJsonErr(request, "Vyplň hodnocení 0–5 u všech kritérií.", 422);
    const saved = await sbRpc<Record<string, unknown>[]>("record_edu_quiz_peer_review", {
      p_reviewer_id: userId,
      p_submission_id: submissionId,
      p_scores: scoreList,
    });
    if (saved.error || !Array.isArray(saved.data) || saved.data.length === 0) {
      quizJsonErr(request, "Peer review se nepodařilo uložit.", 503);
    }
    const record = saved.data[0];
    return quizJsonOk(request, {
      reviewed: record.reviewed === true,
      xp_awarded: Math.trunc(Number(record.xp_awarded ?? 0)) || 0,
    });
  });
}