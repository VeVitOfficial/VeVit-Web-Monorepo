// Klient kvízového API /edu/api/quiz/* (port quiz/api-client.mjs + offline-queue.mjs).
// Zápisy posílají X-CSRF-Token z přihlášené session (viz AiGramShell).

import type { Dict, MilestoneConfig } from "./types";

export class QuizApiError extends Error {}

async function request<T = Dict>(csrfToken: string, path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const method = options.method ?? "GET";
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = csrfToken;
  }
  const response = await fetch(`/edu/api/quiz/${path}`, {
    method,
    credentials: "same-origin",
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const body = (await response.json().catch(() => ({ error: "Neplatná odpověď serveru." }))) as Dict;
  if (!response.ok) throw new QuizApiError(typeof body.error === "string" ? body.error : "Požadavek se nepodařilo dokončit.");
  return body as T;
}

export function createQuizApi(csrfToken: string) {
  const get = <T = Dict>(path: string) => request<T>(csrfToken, path);
  const post = <T = Dict>(path: string, body: unknown) => request<T>(csrfToken, path, { method: "POST", body });
  return {
    state: () => get("state.php"),
    profile: () => get("profile.php"),
    setDifficulty: (difficulty: string) => post("profile.php", { difficulty }),
    evaluate: (attempt: Dict) => post("evaluate.php", attempt),
    microtask: (entry: Dict) => post("microtask.php", entry),
    scheduleReview: (questionIds: string[]) => post("review-queue.php", { question_ids: questionIds }),
    peerReviews: () => get("peer-review.php"),
    savePeerReview: (submissionId: unknown, scores: (number | null)[]) => post("peer-review.php", { submission_id: submissionId, scores }),
    poll: (questionId: string) => get(`poll.php?question_id=${encodeURIComponent(questionId)}`),
    milestoneConfig: (milestone: string, attempt = 1) =>
      get<MilestoneConfig>(`milestone-config.php?milestone=${encodeURIComponent(milestone)}&attempt=${encodeURIComponent(attempt)}`),
    milestone: (milestone: string, answers: Dict, attempt = 1, reflection: unknown[] = []) =>
      post("milestone.php", { milestone, answers, attempt, reflection }),
    checkMilestone: (milestone: string, questionId: string, answer: unknown, attempt = 1) =>
      post("milestone-check.php", { milestone, question_id: questionId, answer, attempt }),
    calibration: () => get("calibration.php"),
    warmup: (lessonSlug: string) => get(`warmup.php?lesson_slug=${encodeURIComponent(lessonSlug)}`),
    saveWarmup: (payload: Dict) => post("warmup.php", payload),
    selfAssessment: () => get("self-assessment.php"),
    saveSelfAssessment: (estimate: number) => post("self-assessment.php", { estimate }),
    prediction: (body: string) => post("predictions/create.php", { body }),
  };
}

export type QuizApi = ReturnType<typeof createQuizApi>;

// ── Offline fronta pokusů (localStorage) ─────────────────────────────────
const QUEUE_KEY = "vevit-edu-quiz-offline-v1";

function readQueue(): Dict[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeQueue(items: Dict[]) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Plné nebo zakázané úložiště: pokus zůstane jen na stránce.
  }
}

export function enqueueAttempt(attempt: Dict): number {
  const items = readQueue();
  if (!items.some((item) => item.client_attempt_uuid === attempt.client_attempt_uuid)) items.push(attempt);
  writeQueue(items);
  return items.length;
}

export async function flushOfflineQueue(api: QuizApi) {
  const remaining: Dict[] = [];
  let sent = 0;
  for (const item of readQueue()) {
    try {
      await (item._endpoint === "microtask" ? api.microtask(item) : api.evaluate(item));
      sent += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return { sent, remaining: remaining.length };
}

export function newAttemptId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}
