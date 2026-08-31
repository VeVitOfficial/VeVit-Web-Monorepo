import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import {
  AccountBackendUnavailableError,
  loadSessionFromCookies,
  type AccountSession,
} from "@/lib/account-session";
import {
  eduChapterLessons,
  eduCourseLessonSlugs,
  eduFinalPrivateQuestions,
  eduLoadChapter,
  eduLesson,
  QUIZ_COURSE,
  type ChapterJson,
  type QuizQuestion,
} from "@/lib/edu-quiz-content";
import { phpRound2, quizEvaluateQuestion } from "@/lib/edu-quiz-evaluator";
import { sbFindOne, sbInsert, sbRpc, sbUpdate } from "@/lib/edu-quiz-supabase";

/**
 * Port of edu/api/quiz/lib.php and its route plumbing (beginJson,
 * quiz_api_require_write_request, requireAuth). CSRF enforcement from the PHP
 * original is KEPT: quiz write requests must send X-CSRF-Token equal to the
 * HMAC-derived csrf_token from me.php, with a strict Origin allowlist.
 */

export class QuizApiError extends Error {
  constructor(readonly response: Response) {
    super("Quiz API error response");
  }
}

const CONTENT_JSON_HEADERS = { "Content-Type": "application/json" } as const;

function jsonHeaders(origin: string | null, allowedOrigin: string): Record<string, string> {
  // Port of beginJson()'s response headers (same-origin CORS echo).
  return {
    ...CONTENT_JSON_HEADERS,
    "Cache-Control": "no-store, private, max-age=0",
    Vary: "Origin",
    ...(origin !== null && origin === allowedOrigin
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        }
      : {}),
  };
}

function allowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN?.trim() || "https://vevit.cz";
}

function quizJsonErr(request: Request, msg: string, status: number, extraHeaders?: Record<string, string>): never {
  throw new QuizApiError(
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...jsonHeaders(request.headers.get("origin"), allowedOrigin()), ...extraHeaders },
    }),
  );
}

export { quizJsonErr };

/** Port of beginJson(): CORS headers, OPTIONS short-circuit, origin + content-type guards. */
function quizBeginJson(request: Request): void {
  const origin = request.headers.get("origin");
  const method = request.method.toUpperCase();
  const originAllowed = origin !== null && origin !== "" && origin === allowedOrigin();
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (unsafe && origin !== null && !originAllowed) quizJsonErr(request, "Origin not allowed", 403);
  if (method === "OPTIONS") {
    throw new QuizApiError(
      new Response(null, { status: 204, headers: jsonHeaders(origin, allowedOrigin()) }),
    );
  }
  const hasBody = (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE")
    && (request.headers.get("content-length") !== null || (request.headers.get("transfer-encoding") ?? "").toLowerCase().includes("chunked"));
  const contentType = request.headers.get("content-type");
  const hasJsonContentType = contentType !== null && contentType.trim().toLowerCase().startsWith("application/json");
  if (hasBody && !hasJsonContentType) quizJsonErr(request, "Content-Type must be application/json", 415);
}

/** Port of jsonBody(): parse the request body with the PHP error semantics. */
export async function quizJsonBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type");
  if (contentType === null || !contentType.trim().toLowerCase().startsWith("application/json")) {
    quizJsonErr(request, "Content-Type must be application/json", 415);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(await request.text());
  } catch {
    quizJsonErr(request, "Invalid JSON body", 400);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    quizJsonErr(request, "Invalid JSON body", 400);
  }
  return parsed as Record<string, unknown>;
}

async function quizCatch(request: Request, error: unknown): Promise<Response> {
  if (error instanceof QuizApiError) return error.response;
  if (error instanceof AccountBackendUnavailableError) {
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 503,
      headers: jsonHeaders(request.headers.get("origin"), allowedOrigin()),
    });
  }
  console.error("[edu:quiz] failure", error instanceof Error ? error.message : error);
  return new Response(JSON.stringify({ error: "Chyba serveru." }), {
    status: 500,
    headers: jsonHeaders(request.headers.get("origin"), allowedOrigin()),
  });
}

/**
 * Wrap a quiz route handler: beginJson, then auth, then the handler. Auth
 * mirrors requireAuth(): 401 on missing session, 503 on backend outage.
 */
export async function handleQuizRequest(request: Request, handler: (session: AccountSession) => Promise<Response>): Promise<Response> {
  try {
    quizBeginJson(request);
    const session = await loadSessionFromCookies();
    if (!session) quizJsonErr(request, "Unauthorized", 401);
    return await handler(session);
  } catch (error) {
    return quizCatch(request, error);
  }
}

/** bootstrap(true): auth + write-request guard (method/origin/CSRF). */
export async function handleQuizWriteRequest(request: Request, handler: (session: AccountSession) => Promise<Response>): Promise<Response> {
  return handleQuizRequest(request, async (session) => {
    quizRequireWriteRequest(request, session);
    return handler(session);
  });
}

/** beginJson-only entry point (dispatch.php: no session, secret-gated separately). */
export async function handleQuizPublicRequest(request: Request, handler: () => Promise<Response>): Promise<Response> {
  try {
    quizBeginJson(request);
    return await handler();
  } catch (error) {
    return quizCatch(request, error);
  }
}

/** Port of quiz_api_require_write_request(): method + strict origin + CSRF. */
export function quizRequireWriteRequest(request: Request, session: AccountSession): void {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    quizJsonErr(request, "Method not allowed", 405, { Allow: "POST, PUT, PATCH, DELETE" });
  }
  const origin = request.headers.get("origin");
  if (origin === null || origin === "" || origin !== allowedOrigin()) {
    quizJsonErr(request, "Origin not allowed", 403);
  }
  const submitted = request.headers.get("x-csrf-token") ?? "";
  const expected = session.csrfToken;
  if (submitted.length !== expected.length || !timingSafeEqual(Buffer.from(submitted), Buffer.from(expected))) {
    quizJsonErr(request, "Neplatný CSRF token.", 403);
  }
}

/** JSON success response with the beginJson() header set. */
export function quizJsonOk(request: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders(request.headers.get("origin"), allowedOrigin()) });
}

/** beginJson() short-circuits OPTIONS with 204 in PHP; exported per route. */
export function quizPreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: jsonHeaders(request.headers.get("origin"), allowedOrigin()) });
}

/** quiz_api_iso_now(): Y-m-d\TH:i:s\Z in UTC. */
export function quizIsoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function quizUserId(request: Request, session: AccountSession): string {
  const userId = session.user.id;
  if (typeof userId !== "string" || userId === "") {
    quizJsonErr(request, "Neplatná identita uživatele.", 503);
  }
  return userId;
}

// ── XP + validation (lib.php) ────────────────────────────────────────────────

export const QUIZ_XP: Record<string, number> = {
  warmup: 5, question: 3, trap: 5, open: 10, microtask: 10, boss: 30, peer_review: 15, hidden_badge: 25,
};

const LESSON_SLUG_RE = /^[1-6]-[0-9]+-[a-z0-9-]+$/;
const QUESTION_ID_RE = /^[1-6]-[0-9]+-q[0-9]+$/;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function quizValidateAttemptPayload(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const field of ["course", "lesson_slug", "question_id", "client_attempt_uuid", "answer"]) {
    if (!(field in body)) errors.push(`Chybí pole ${field}.`);
  }
  if (body.course !== QUIZ_COURSE) errors.push("Neplatný kurz.");
  if (typeof body.lesson_slug !== "string" || !LESSON_SLUG_RE.test(body.lesson_slug)) errors.push("Neplatná lekce.");
  if (typeof body.question_id !== "string" || !QUESTION_ID_RE.test(body.question_id)) errors.push("Neplatná otázka.");
  if (typeof body.client_attempt_uuid !== "string" || !UUID_V4_RE.test(body.client_attempt_uuid)) {
    errors.push("client_attempt_uuid musí být UUID.");
  }
  if (body.answer === null || typeof body.answer !== "object" || Array.isArray(body.answer)) errors.push("Odpověď musí být objekt.");
  if ("xp_awarded" in body || "xp" in body) errors.push("XP určuje výhradně server.");
  if ("duration_ms" in body) {
    const value = body.duration_ms;
    if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 7200000) errors.push("Neplatná délka odpovědi.");
  }
  if ("difficulty" in body && !["junior", "pro", "both"].includes(body.difficulty as string)) errors.push("Neplatná obtížnost.");
  return errors;
}

export function quizValidateFinalReflection(reflection: unknown): string[] {
  if (!Array.isArray(reflection) || reflection.length !== 3) return ["Doplň všechny tři reflexe a sebehodnocení 0–5."];
  for (const entry of reflection) {
    if (
      entry === null || typeof entry !== "object"
      || typeof (entry as Record<string, unknown>).text !== "string"
      || ((entry as Record<string, unknown>).text as string).trim().length < 10
      || !Number.isInteger((entry as Record<string, unknown>).score)
      || ((entry as Record<string, unknown>).score as number) < 0 || ((entry as Record<string, unknown>).score as number) > 5
    ) {
      return ["Doplň všechny tři reflexe a sebehodnocení 0–5."];
    }
  }
  return [];
}

export function quizXpForQuestion(question: QuizQuestion): number {
  const type = typeof question.type === "string" ? question.type : "";
  if (type === "prompt_lab" || type === "open_rubric") return QUIZ_XP.open;
  if (type === "microtask") return QUIZ_XP.microtask;
  return question.trap === true ? QUIZ_XP.trap : QUIZ_XP.question;
}

export function quizFindQuestion(lessonSlug: string, questionId: string): QuizQuestion | null {
  const lesson = eduLesson(lessonSlug);
  if (!lesson || lesson.slug !== lessonSlug) return null;
  const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
  const question = bank.find(
    (candidate): candidate is QuizQuestion =>
      candidate !== null && typeof candidate === "object" && (candidate as QuizQuestion).id === questionId,
  );
  return question ?? null;
}

// ── Milestones ───────────────────────────────────────────────────────────────

export function quizMilestoneChapter(milestone: string): number | null {
  return { "boss-1": 1, "boss-2": 2, "boss-3": 3, "boss-4": 4, "boss-5": 5, "final-6": 6 }[milestone] ?? null;
}

function chapterNumber(questionId: string): number | null {
  const chapter = Number(questionId[0]);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 6) return null;
  return chapter;
}

function findQuestionInChapter(chapterNumber: number, questionId: string): QuizQuestion | null {
  if (new RegExp(`^${chapterNumber}-[0-9]+-q[0-9]+$`).test(questionId) === false) return null;
  if (chapterNumber === 6 && questionId.startsWith("6-4-")) {
    const privateQuestions = eduFinalPrivateQuestions();
    const match = privateQuestions.find((candidate) => candidate.id === questionId);
    return match ?? null;
  }
  for (const lesson of eduChapterLessons(chapterNumber)) {
    const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
    const question = bank.find(
      (candidate): candidate is QuizQuestion =>
        candidate !== null && typeof candidate === "object" && (candidate as QuizQuestion).id === questionId,
    );
    if (question) return question;
  }
  return null;
}

/** quiz_api_find_question_in_chapter(): lesson bank or private final-6 pool. */
export function quizFindQuestionInChapter(chapterNumber: number, questionId: string): QuizQuestion | null {
  return findQuestionInChapter(chapterNumber, questionId);
}

function bossQuizOf(milestone: string): Record<string, unknown> | null {
  const chapterNumber = quizMilestoneChapter(milestone);
  const chapter = chapterNumber === null ? null : eduLoadChapter(chapterNumber);
  const boss = chapter?.bossQuiz;
  return boss !== null && typeof boss === "object" && !Array.isArray(boss) ? (boss as Record<string, unknown>) : null;
}

function finalPool(): QuizQuestion[] {
  const pool = new Map<string, QuizQuestion>();
  for (let chapter = 1; chapter <= 6; chapter++) {
    for (const lesson of eduChapterLessons(chapter)) {
      const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
      for (const question of bank) {
        if (question === null || typeof question !== "object") continue;
        const id = (question as QuizQuestion).id;
        if (typeof id !== "string") continue;
        const actual = findQuestionInChapter(chapter, id);
        if (actual !== null) pool.set(id, actual);
      }
    }
  }
  return [...pool.values()];
}

function finalQuestionIds(userId: string, attempt: number): string[] | null {
  const required: Record<string, number> = {
    mcq: 8, sort_buckets: 4, order: 3, hallucination_hunt: 3, branching: 3, prompt_lab: 2, poll: 2,
  };
  const pool = finalPool();
  const selected: string[] = [];
  const chapterCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const [type, count] of Object.entries(required)) {
    let candidates = pool.filter(
      (question) => question.type === type
        && (type !== "mcq" || question.trap === true)
        && !selected.includes(typeof question.id === "string" ? question.id : ""),
    );
    for (let index = 0; index < count; index++) {
      candidates = candidates.sort((a, b) => {
        const chapterA = chapterNumber(String(a.id));
        const chapterB = chapterNumber(String(b.id));
        const byCoverage = (chapterCounts[chapterA ?? 0] ?? 0) - (chapterCounts[chapterB ?? 0] ?? 0);
        if (byCoverage !== 0) return byCoverage;
        const hashA = createHash("sha256").update(`${userId}|final-6|${attempt}|${a.id}`).digest("hex");
        const hashB = createHash("sha256").update(`${userId}|final-6|${attempt}|${b.id}`).digest("hex");
        return hashA < hashB ? -1 : hashA > hashB ? 1 : 0;
      });
      const question = candidates.shift();
      if (question === undefined) return null;
      const id = String(question.id);
      selected.push(id);
      chapterCounts[chapterNumber(id) ?? 0]++;
    }
  }
  return selected;
}

export function quizMilestoneQuestionIds(milestone: string, userId: string, attempt = 1): string[] | null {
  const chapterNum = quizMilestoneChapter(milestone);
  const boss = bossQuizOf(milestone);
  if (boss === null) return null;
  if (milestone === "final-6") return finalQuestionIds(userId, attempt);
  const poolIds = Array.isArray(boss.poolQuestionIds)
    ? boss.poolQuestionIds.filter((id): id is string => typeof id === "string")
    : [];
  const count = typeof boss.count === "number" ? Math.trunc(boss.count) : 10;
  if (poolIds.length < count || count !== 10) return null;
  const pool = [...poolIds].sort((left, right) => {
    const hash = (id: string) => createHash("sha256").update(`${userId}|${milestone}|${attempt}|${id}`).digest("hex");
    return hash(left) < hash(right) ? -1 : hash(left) > hash(right) ? 1 : 0;
  });
  const selected: string[] = [];
  const seenTypes = new Set<string>();
  for (const id of pool) {
    const question = findQuestionInChapter(chapterNum ?? 0, id);
    const type = typeof question?.type === "string" ? question.type : null;
    if (type === null || seenTypes.has(type)) continue;
    selected.push(id);
    seenTypes.add(type);
    if (selected.length >= Math.min(5, count)) break;
  }
  for (const id of pool) {
    if (selected.length >= count) break;
    if (!selected.includes(id)) selected.push(id);
  }
  return selected;
}

export function quizMilestoneQuestions(milestone: string, userId: string, attempt = 1): QuizQuestion[] | null {
  const chapterNumberValue = quizMilestoneChapter(milestone);
  const ids = quizMilestoneQuestionIds(milestone, userId, attempt);
  if (chapterNumberValue === null || ids === null) return null;
  const questions: QuizQuestion[] = [];
  for (const id of ids) {
    const question = findQuestionInChapter(chapterNumberValue, id);
    if (question === null) return null;
    questions.push(question);
  }
  return questions;
}

export function quizMilestoneAllowsQuestion(milestone: string, userId: string, questionId: string, attempt = 1): boolean {
  const ids = quizMilestoneQuestionIds(milestone, userId, attempt);
  if (ids !== null && ids.includes(questionId)) return true;
  if (milestone !== "final-6") return false;
  return QUESTION_ID_RE.test(questionId)
    && !questionId.startsWith("6-4-")
    && findQuestionInChapter(chapterNumber(questionId) ?? 0, questionId) !== null;
}

export function quizPublicQuestion(question: QuizQuestion): QuizQuestion {
  return quizPublicQuestionImpl(question, String(question.id ?? question.type));
}

// ── Warmup selection (sorted candidate scoring identical to lib.php) ────────

export function quizWarmupQuestions(
  lessonSlug: string,
  userId: string,
  attempts: Array<Record<string, unknown>> = [],
  reviews: Array<Record<string, unknown>> = [],
): QuizQuestion[] {
  const slugs = eduCourseLessonSlugs().filter((slug) => typeof slug === "string");
  const current = slugs.indexOf(lessonSlug);
  if (current <= 0) return [];
  const failed = new Set<string>();
  for (const attempt of attempts) {
    if (attempt.is_correct === false && typeof attempt.question_id === "string") failed.add(attempt.question_id);
  }
  const due = new Set<string>();
  const now = Date.now();
  for (const review of reviews) {
    if (typeof review.question_id === "string" && Date.parse(String(review.due_at ?? "")) <= now) due.add(review.question_id);
  }
  const candidates: Array<{ score: number; hash: string; question: QuizQuestion }> = [];
  for (const slug of slugs.slice(0, current)) {
    const lesson = eduLesson(slug);
    if (!lesson) continue;
    const bank = Array.isArray(lesson.questionBank) ? lesson.questionBank : [];
    for (const question of bank) {
      if (question === null || typeof question !== "object") continue;
      const id = (question as QuizQuestion).id;
      if (typeof id !== "string") continue;
      let score = 0;
      if (failed.has(id)) score += 100;
      if ((question as QuizQuestion).trap === true) score += 50;
      if (due.has(id)) score += 25;
      if (Array.isArray((question as QuizQuestion).spacedRepeatIn) && ((question as QuizQuestion).spacedRepeatIn as string[]).includes(lessonSlug)) score += 15;
      const hash = createHash("sha256").update(`${userId}|${lessonSlug}|${id}`).digest("hex");
      candidates.push({ score, hash, question: question as QuizQuestion });
    }
  }
  candidates.sort((a, b) => (b.score - a.score) || (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0));
  return candidates.slice(0, 3).map((candidate) => candidate.question);
}

// ── Calibration ──────────────────────────────────────────────────────────────

export function quizCalibrationSummary(rounds: Array<Record<string, unknown>>): Record<string, unknown> {
  const expected: Record<number, number> = { 5: 50, 15: 75, 30: 90 };
  const buckets = new Map<number, { stake: number; confidence_pct: number; count: number; correct: number; accuracy_pct: number }>();
  for (const [stake, confidence] of Object.entries(expected)) {
    buckets.set(Number(stake), { stake: Number(stake), confidence_pct: confidence, count: 0, correct: 0, accuracy_pct: 0 });
  }
  for (const round of rounds) {
    const stake = Math.trunc(Number(round.stake ?? 0));
    const bucket = buckets.get(stake);
    if (!bucket || typeof round.correct !== "boolean") continue;
    bucket.count++;
    if (round.correct) bucket.correct++;
  }
  let weightedError = 0;
  let count = 0;
  for (const bucket of buckets.values()) {
    if (bucket.count > 0) bucket.accuracy_pct = Math.round((100 * bucket.correct) / bucket.count);
    weightedError += Math.abs(bucket.accuracy_pct - bucket.confidence_pct) * bucket.count;
    count += bucket.count;
  }
  const mae = count ? phpRound2(weightedError / count) : 100.0;
  return {
    round_count: count,
    mean_absolute_error_pct: mae,
    calibrated: count >= 10 && mae <= 20,
    buckets: [...buckets.values()],
  };
}

export function quizBadgeForCalibration(summary: Record<string, unknown>): string | null {
  return summary.calibrated === true && Math.trunc(Number(summary.round_count ?? 0)) >= 10 ? "kalibrovany" : null;
}

// ── Badges + SRS ─────────────────────────────────────────────────────────────

export function quizBadgeForVerifiedMilestone(milestone: string, passed: boolean): string | null {
  if (!passed) return null;
  return { "boss-1": "archeolog-ai", "boss-2": "mechanik-neuronu", "boss-3": "promptovy-kovar", "boss-4": "integrator", "boss-5": "stavitel", "final-6": "skeptik-s-certifikatem" }[milestone] ?? null;
}

function quizMilestoneLessonSlug(milestone: string): string | null {
  return {
    "boss-1": "1-4-etika-bezpecnost",
    "boss-2": "2-4-multimodalni-ai",
    "boss-3": "3-12-pokrocile-techniky",
    "boss-4": "4-6-integrace-ai",
    "boss-5": "5-6-lokalni-modely-soukromi",
    "final-6": "6-4-zaverecny-test",
  }[milestone] ?? null;
}

/** Server-only verified boss/final marker. The client never sends badge keys. */
export async function quizAwardVerifiedMilestone(
  userId: string,
  milestone: string,
  passed: boolean,
  meta: Record<string, unknown> = {},
): Promise<boolean> {
  const badgeKey = quizBadgeForVerifiedMilestone(milestone, passed);
  if (badgeKey === null) return false;
  const lessonSlug = quizMilestoneLessonSlug(milestone);
  return quizAwardBadge(userId, badgeKey, { ...meta, milestone, lesson_slug: lessonSlug });
}

export function quizValidateMilestonePayload(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!["boss-1", "boss-2", "boss-3", "boss-4", "boss-5", "final-6"].includes(body.milestone as string)) errors.push("Neplatný milník.");
  if (body.answers === null || typeof body.answers !== "object" || Array.isArray(body.answers)) errors.push("Odpovědi milníku musí být objekt.");
  return errors;
}

function lessonPathValid(lessonSlug: string | null): boolean {
  return typeof lessonSlug === "string" && LESSON_SLUG_RE.test(lessonSlug);
}

export async function quizAwardBadge(userId: string, badgeKey: string, meta: Record<string, unknown> = {}): Promise<boolean> {
  const lessonSlug = typeof meta.lesson_slug === "string" ? meta.lesson_slug : null;
  if (!lessonPathValid(lessonSlug)) throw new Error("Badge lesson unavailable");
  const { data, error } = await sbRpc<Array<{ awarded: boolean }> | { awarded: boolean }>("award_edu_quiz_badge", {
    p_user_id: userId,
    p_badge_key: badgeKey,
    p_meta: meta,
    p_lesson_slug: lessonSlug,
  });
  if (error || !Array.isArray(data)) throw new Error("Badge save failed");
  const row = data[0] ?? (data as unknown[])[0] ?? null;
  return row !== null && typeof row === "object" && (row as Record<string, unknown>).awarded === true;
}

export async function quizUpdateReviewQueue(userId: string, questionId: string, correct: boolean): Promise<void> {
  const existing = await sbFindOne<{ id: number; interval_days: number | null; ease: number | null }>(
    "edu_quiz_review_queue",
    { user_id: userId, question_id: questionId },
    "id,interval_days,ease",
  );
  if (existing.error) throw new Error("SRS unavailable");
  const oldInterval = Math.trunc(Number(existing.data?.interval_days ?? 1));
  const interval = correct ? Math.min(60, Math.max(2, oldInterval * 2)) : 1;
  const row: Record<string, unknown> = {
    user_id: userId,
    question_id: questionId,
    due_at: new Date(Date.now() + interval * 86400_000).toISOString().replace(/\.\d{3}Z$/, "Z"),
    interval_days: interval,
    ease: correct ? 2.5 : 2.0,
    last_result: correct,
    updated_at: quizIsoNow(),
  };
  const saved = existing.data
    ? await sbUpdate("edu_quiz_review_queue", { id: existing.data.id }, row)
    : await sbInsert("edu_quiz_review_queue", row);
  if (saved.error) throw new Error("SRS save failed");
}

export async function quizScheduleReviewNow(userId: string, questionId: string): Promise<void> {
  const existing = await sbFindOne<{ id: number }>(
    "edu_quiz_review_queue",
    { user_id: userId, question_id: questionId },
    "id",
  );
  if (existing.error) throw new Error("SRS unavailable");
  const row: Record<string, unknown> = {
    user_id: userId,
    question_id: questionId,
    due_at: quizIsoNow(),
    interval_days: 1,
    ease: 2.0,
    last_result: null,
    updated_at: quizIsoNow(),
  };
  const saved = existing.data
    ? await sbUpdate("edu_quiz_review_queue", { id: existing.data.id }, row)
    : await sbInsert("edu_quiz_review_queue", row);
  if (saved.error) throw new Error("SRS save failed");
}

// ── Milestone submission verification (server-side, never client-provided) ──

export async function quizVerifyMilestoneSubmission(
  milestone: string,
  answersRaw: Record<string, unknown>,
  userId: string,
  attempt: number,
): Promise<{
  passed: boolean;
  scorePct: number;
  questionCount: number;
  livesLeft?: number;
  adaptiveRequired?: number;
  adaptiveCorrect?: number;
} | null> {
  const boss = bossQuizOf(milestone);
  const chapterNumberValue = quizMilestoneChapter(milestone);
  const questionIds = quizMilestoneQuestionIds(milestone, userId, attempt);
  const threshold = typeof boss?.passScorePct === "number" ? Math.trunc(boss.passScorePct) : null;
  if (questionIds === null || questionIds.length === 0 || threshold === null || threshold < 0 || threshold > 100) return null;
  const answersSafe = answersRaw ?? {};
  const correctIds: string[] = [];
  const wrongQuestionIds: string[] = [];
  for (const questionId of questionIds) {
    const answer = answersSafe[questionId];
    if (answer === null || typeof answer !== "object" || Array.isArray(answer)) {
      return { passed: false, scorePct: 0, questionCount: questionIds.length };
    }
    const question = findQuestionInChapter(chapterNumberValue ?? Number(questionId[0]), questionId);
    if (question === null) return null;
    const result = quizEvaluateQuestion(answer as Record<string, unknown>, question);
    if (result.valid !== true) {
      return { passed: false, scorePct: 0, questionCount: questionIds.length };
    }
    if (result.correct !== false && result.scorePct >= 100) correctIds.push(questionId);
    else wrongQuestionIds.push(questionId);
  }
  const correct = correctIds.length;
  const score = phpRound2((100 * correct) / questionIds.length);
  const lives = Math.trunc(Number(boss?.lives ?? 0));
  const withinLives = lives <= 0 || questionIds.length - correct <= lives;
  let adaptiveRequired = 0;
  let adaptiveCorrectCount = 0;
  let adaptiveValid = true;
  if (milestone === "final-6") {
    adaptiveRequired = Math.min(5, wrongQuestionIds.length);
    const extraIds = Object.keys(answersSafe).filter((id) => !questionIds.includes(id));
    if (extraIds.length !== adaptiveRequired) adaptiveValid = false;
    const requiredByChapter = new Map<number, number>();
    for (const wrongId of wrongQuestionIds.slice(0, adaptiveRequired)) {
      const chapter = chapterNumber(wrongId) ?? 0;
      requiredByChapter.set(chapter, (requiredByChapter.get(chapter) ?? 0) + 1);
    }
    const correctByChapter = new Map<number, number>();
    for (const extraId of extraIds) {
      if (typeof extraId !== "string" || extraId.startsWith("6-4-")) {
        adaptiveValid = false;
        continue;
      }
      const extraAnswer = answersSafe[extraId];
      if (extraAnswer === null || typeof extraAnswer !== "object") {
        adaptiveValid = false;
        continue;
      }
      const extraQuestion = findQuestionInChapter(chapterNumber(extraId) ?? 0, extraId);
      if (extraQuestion === null) {
        adaptiveValid = false;
        continue;
      }
      const extraResult = quizEvaluateQuestion(extraAnswer as Record<string, unknown>, extraQuestion);
      const extraCorrect = extraResult.valid === true && extraResult.correct !== false && extraResult.scorePct >= 100;
      if (!extraCorrect) {
        adaptiveValid = false;
        continue;
      }
      adaptiveCorrectCount++;
      const chapter = chapterNumber(extraId) ?? 0;
      correctByChapter.set(chapter, (correctByChapter.get(chapter) ?? 0) + 1);
    }
    for (const [chapter, requiredCount] of requiredByChapter) {
      if ((correctByChapter.get(chapter) ?? 0) < requiredCount) adaptiveValid = false;
    }
  }
  return {
    passed: score >= threshold && withinLives && adaptiveValid,
    scorePct: score,
    questionCount: questionIds.length,
    livesLeft: Math.max(0, lives - (questionIds.length - correct)),
    adaptiveRequired,
    adaptiveCorrect: adaptiveCorrectCount,
  };
}

// ── Public question projection (port of public-question.php) ────────────────

function quizPublicRotate(items: unknown[], seed: string): unknown[] {
  const list = [...items];
  const count = list.length;
  if (count < 2) return list;
  const hash = createHash("sha256").update(seed).digest("hex");
  const offset = 1 + (parseInt(hash.slice(0, 8), 16) % (count - 1));
  return [...list.slice(offset), ...list.slice(0, offset)];
}

const STRIP_KEYS = new Set(["correct", "answer", "isFalse", "source", "correctValue"]);

function stripAnswerKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    for (const item of value) copy.push(stripAnswerKeys(item));
    return copy;
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (STRIP_KEYS.has(key)) continue;
    result[key] = stripAnswerKeys(item);
  }
  return result;
}

function quizPublicQuestionImpl(question: QuizQuestion, id: string): QuizQuestion {
  const payloadRaw = question.payload;
  const payload: Record<string, unknown> = payloadRaw !== null && typeof payloadRaw === "object" && !Array.isArray(payloadRaw)
    ? { ...(payloadRaw as Record<string, unknown>) }
    : {};
  const type = String(question.type ?? "");

  if (type === "order" && Array.isArray(payload.items)) {
    payload.items = quizPublicRotate(payload.items, `${id}:order`);
  }

  if (type === "match" && Array.isArray(payload.pairs)) {
    const rights: string[] = [];
    const publicPairs: Array<Record<string, string>> = [];
    for (const pair of payload.pairs as unknown[]) {
      if (pair === null || typeof pair !== "object") continue;
      const record = pair as Record<string, unknown>;
      publicPairs.push({ left: String(record.left ?? "") });
      if ("right" in record) rights.push(String(record.right));
    }
    const distractors = Array.isArray(payload.distractorsRight) ? (payload.distractorsRight as unknown[]) : [];
    for (const right of distractors) rights.push(String(right));
    payload.pairs = publicPairs;
    payload.rightOptions = quizPublicRotate(rights, `${id}:match`);
    delete payload.distractorsRight;
  }

  if (type === "branching") delete payload.correctEndings;

  return {
    ...question,
    payload: stripAnswerKeys(payload),
    serverEvaluated: true,
  };
}

export type { ChapterJson, QuizQuestion };
export { QUIZ_COURSE } from "@/lib/edu-quiz-content";
export { phpMbLength, wordCount } from "@/lib/edu-quiz-evaluator";