import {
  handleQuizRequest,
  handleQuizWriteRequest,
  quizIsoNow,
  quizJsonBody,
  quizJsonErr,
  quizJsonOk,
  quizPreflight,
  quizUserId,
} from "@/lib/edu-quiz-lib";
import { sbFindOne, sbInsert, sbUpdate } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/quiz/profile.php: difficulty preference (junior | pro).

export async function OPTIONS(request: Request) {
  return quizPreflight(request);
}

export async function GET(request: Request) {
  return handleQuizRequest(request, async (session) => {
    const userId = quizUserId(request, session);
    const profile = await sbFindOne<{ difficulty: string | null }>(
      "edu_quiz_profile",
      { user_id: userId },
      "difficulty,updated_at",
    );
    if (profile.error) quizJsonErr(request, "Profil se nepodařilo načíst.", 503);
    return quizJsonOk(request, { difficulty: profile.data?.difficulty ?? "junior" });
  });
}

export async function POST(request: Request) {
  return handleQuizWriteRequest(request, async (session) => {
    const body = await quizJsonBody(request);
    const difficulty = body.difficulty;
    if (!["junior", "pro"].includes(difficulty as string)) quizJsonErr(request, "Neplatná obtížnost.", 422);
    const userId = quizUserId(request, session);
    const row = { user_id: userId, difficulty, updated_at: quizIsoNow() };
    const existing = await sbFindOne("edu_quiz_profile", { user_id: userId }, "user_id");
    if (existing.error) quizJsonErr(request, "Profil se nepodařilo uložit.", 503);
    const saved = existing.data
      ? await sbUpdate("edu_quiz_profile", { user_id: userId }, row)
      : await sbInsert("edu_quiz_profile", row);
    if (saved.error) quizJsonErr(request, "Profil se nepodařilo uložit.", 503);
    return quizJsonOk(request, { difficulty });
  });
}