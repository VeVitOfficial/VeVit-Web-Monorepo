import { handleQuizWriteRequest, phpMbLength, quizJsonBody, quizJsonErr,
  quizPreflight, quizJsonOk, quizUserId } from "@/lib/edu-quiz-lib";
import { sbInsert } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/predictions/create.php: store a time-capsule
// prediction, delivered one year later via dispatch.

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const body = await quizJsonBody(request);
    const text = String(body.body ?? "").trim();
    if (phpMbLength(text) < 1 || phpMbLength(text) > 4000) {
      quizJsonErr(request, "Předpověď má neplatnou délku.", 422);
    }
    const userId = quizUserId(request, session);
    const deliver = new Date();
    deliver.setUTCFullYear(deliver.getUTCFullYear() + 1);
    const deliverAt = deliver.toISOString().replace(/\.\d{3}Z$/, "Z");
    const saved = await sbInsert<Record<string, unknown>>("edu_quiz_prediction", {
      user_id: userId,
      body: text,
      deliver_at: deliverAt,
    });
    if (saved.error) quizJsonErr(request, "Předpověď se nepodařilo uložit.", 503);
    return quizJsonOk(request, { prediction: saved.data }, 201);
  });
}