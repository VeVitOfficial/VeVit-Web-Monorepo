import {
  gramInput, gramJsonResponse, gramotnostDbOrNull, gramotnostLocale, gramPreflight, gramQuery,
} from "@/lib/edu-gramotnost-config";
import {
  contentExercise, contentExercisesByLesson,
} from "@/lib/edu-gramotnost-content";
import { evaluateExercise } from "@/lib/edu-gramotnost-evaluate";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/ai-gramotnost/api/exercises.php: exercise listing + answer
// submission with server-side evaluation (DB rows when the gramotnost
// MariaDB is configured, bundled static content otherwise). Plain JSON,
// CORS `*`, no auth.

function phpIntCast(value: unknown): number {
  // PHP (int) cast: leading integer digits, else 0.
  if (typeof value === "number") return Math.trunc(value);
  const match = /^[+-]?\d+/.exec(String(value ?? "").trim());
  const parsed = match !== null ? Number.parseInt(match[0], 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function safeJsonParse(text: unknown): unknown {
  if (typeof text !== "string" || text === "") return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return gramPreflight();
}

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "";
  const locale = gramotnostLocale(request);
  const db = gramotnostDbOrNull();

  if (action === "list") {
    const lessonId = phpIntCast(url.searchParams.get("lesson_id") ?? "0");
    let list: unknown[] = [];
    if (db !== null) {
      try {
        const rows = await gramQuery<RowDataPacket & Record<string, unknown>>(
          db,
          "SELECT id, sort_order, title, type, prompt, config, explanation, xp_reward "
          + "FROM exercises WHERE lesson_id = ? ORDER BY sort_order, id",
          [lessonId],
        );
        list = rows.map((exercise) => ({
          ...exercise,
          config: safeJsonParse(exercise.config),
        }));
      } catch {
        // empty — PHP swallows Throwable and falls through to the fallback
      }
    }
    if (list.length === 0) list = contentExercisesByLesson(locale, lessonId);
    return gramJsonResponse(list);
  }

  if (action === "submit") {
    const data = gramInput(await request.text());
    const exId = phpIntCast(data.exercise_id ?? "0");
    const answer = data.answer ?? null;

    let exercise: Record<string, unknown> | null = null;
    let correct: unknown = [];
    let cfg: unknown = [];
    let xpReward = 0;
    let typeValue: unknown = "multiple_choice";
    if (db !== null) {
      try {
        const rows = await gramQuery<RowDataPacket & Record<string, unknown>>(
          db,
          "SELECT * FROM exercises WHERE id = ?",
          [exId],
        );
        if (rows.length > 0) exercise = { ...rows[0] };
      } catch {
        exercise = null;
      }
    }
    if (exercise !== null) {
      correct = safeJsonParse(exercise.correct_answer);
      cfg = exercise.config ? safeJsonParse(exercise.config) : [];
      xpReward = phpIntCast(exercise.xp_reward);
      typeValue = exercise.type ?? "multiple_choice";
    } else {
      const contentExerciseRow = contentExercise(exId);
      if (contentExerciseRow === null) {
        return gramJsonResponse({ error: "Cvičení nenalezeno" }, 404);
      }
      correct = contentExerciseRow.correct_answer;
      cfg = contentExerciseRow.config;
      xpReward = phpIntCast(contentExerciseRow.xp_reward);
      typeValue = contentExerciseRow.type ?? "multiple_choice";
    }

    const result = evaluateExercise(typeValue, answer, correct, cfg);
    return gramJsonResponse({
      is_correct: result.is_correct,
      score: result.score,
      feedback: result.feedback,
      correct_answer: correct,
      xp_reward: xpReward,
    });
  }

  return gramJsonResponse({ error: "Unknown action" }, 404);
}

export async function GET(request: Request): Promise<Response> {
  return handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}