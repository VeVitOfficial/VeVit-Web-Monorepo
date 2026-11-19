import {
  handleQuizRequest,
  handleQuizWriteRequest,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { sbGet, sbInsert } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/self-assessment.php: entry estimate (0–8) stored as an
// open submission on 1-1-co-je-ai / entry-self-assessment.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const rows = await sbGet<Record<string, unknown>>(
      "edu_quiz_submission",
      { user_id: userId, lesson_slug: "1-1-co-je-ai", question_id: "entry-self-assessment" },
      "body,created_at",
      100,
    );
    if (rows.error) quizJsonErr(request, "Vstupní odhad se nepodařilo načíst.", 503);
    const data = [...(rows.data ?? [])].sort((a, b) => {
      const left = String(b.created_at ?? "");
      const right = String(a.created_at ?? "");
      return left < right ? -1 : left > right ? 1 : 0;
    });
    const body = data.length > 0 ? String(data[0].body ?? "") : null;
    const estimate = body === null ? null : Math.trunc(Number(body)) || 0;
    return quizJsonOk(request, { estimate });
  });
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const body = await quizJsonBody(request);
    const estimate = body.estimate;
    if (!Number.isInteger(estimate) || (estimate as number) < 0 || (estimate as number) > 8) {
      quizJsonErr(request, "Odhad musí být od 0 do 8.", 422);
    }
    const userId = quizUserId(request, session);
    const saved = await sbInsert("edu_quiz_submission", {
      user_id: userId,
      lesson_slug: "1-1-co-je-ai",
      question_id: "entry-self-assessment",
      kind: "open",
      body: String(estimate),
      self_rubric: { scale: 8 },
    });
    if (saved.error) quizJsonErr(request, "Vstupní odhad se nepodařilo uložit.", 503);
    return quizJsonOk(request, { estimate }, 201);
  });
}