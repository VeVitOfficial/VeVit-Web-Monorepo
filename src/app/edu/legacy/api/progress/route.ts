import {
  legacyAccountDb, legacyCatch, legacyChyba, legacyEduDb, legacyOdpoved, legacyPreflight,
  legacyQuery, legacyVyzadujPrihlaseni,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/lekce.php (handleProgress branch): mark a lesson
// completed, award XP with the tier multiplier and sync it into the legacy
// account DB users table (level = floor(sqrt(xp / 100)) + 1).

const TIER_MULTIPLIERS: Record<string, number> = {
  free: 1.0,
  bronze: 1.2,
  silver: 1.5,
  gold: 2.0,
  platinum: 2.5,
};

function phpInt(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function phpRound(value: number): number {
  // PHP round() is half away from zero.
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = legacyVyzadujPrihlaseni(request);
    let body: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(await request.text());
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
    } catch {
      body = {};
    }
    if (!Object.prototype.hasOwnProperty.call(body, "lesson_id")) legacyChyba(request, "Chybí lesson_id", 400);

    const lessonId = phpInt(body.lesson_id);
    const skore = Object.prototype.hasOwnProperty.call(body, "skore") ? phpInt(body.skore) : null;

    const db = legacyEduDb();
    const lessonRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, course_id, xp_reward, lesson_type FROM lessons WHERE id = ?",
      [lessonId],
    );
    if (lessonRows.length === 0) legacyChyba(request, "Lekce nenalezena", 404);
    const lesson = lessonRows[0];

    const xpBase = phpInt(lesson.xp_reward);
    const userTier = typeof user.tier === "string" ? (user.tier as string) : "free";
    const multiplier = TIER_MULTIPLIERS[userTier] ?? 1.0;
    const xpZiskano = phpRound(xpBase * multiplier);

    // Duplicate check (UNIQUE KEY also guards) — return current XP without re-adding.
    const existing = await legacyQuery(db, "SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?", [
      user.id,
      lessonId,
    ]);
    if (existing.length > 0) {
      const accountInfo = await legacyQuery<RowDataPacket & Record<string, unknown>>(
        legacyAccountDb(),
        "SELECT id, nickname, xp, level, role FROM users WHERE id = ?",
        [user.id],
      );
      return legacyOdpoved(request, {
        xp_ziskano: 0,
        xp_celkem: accountInfo.length > 0 ? phpInt(accountInfo[0].xp) : 0,
        level: accountInfo.length > 0 ? phpInt(accountInfo[0].level) : 1,
        level_up: false,
        message: "Lekce již dokončena",
      });
    }

    await legacyQuery(
      db,
      "INSERT INTO user_progress (user_id, lesson_id, course_id, xp_ziskano, skore) VALUES (?, ?, ?, ?, ?)",
      [user.id, lessonId, lesson.course_id, xpZiskano, skore],
    );

    // XP sync into the account DB — non-fatal on failure (progress is saved).
    let levelUp = false;
    let oldLevel = 1;
    try {
      const accDb = legacyAccountDb();
      await legacyQuery(accDb, "UPDATE users SET xp = xp + ? WHERE id = ?", [xpZiskano, user.id]);
      const accRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
        accDb,
        "SELECT xp, level FROM users WHERE id = ?",
        [user.id],
      );
      const newXp = accRows.length > 0 ? phpInt(accRows[0].xp) : xpZiskano;
      oldLevel = accRows.length > 0 ? phpInt(accRows[0].level) : 1;
      const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
      if (newLevel > oldLevel) {
        levelUp = true;
        await legacyQuery(accDb, "UPDATE users SET level = ? WHERE id = ?", [newLevel, user.id]);
      }
    } catch (error) {
      console.error("Account XP update error:", error instanceof Error ? error.message : error);
    }

    const accountInfo = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      legacyAccountDb(),
      "SELECT id, nickname, xp, level, role FROM users WHERE id = ?",
      [user.id],
    );
    return legacyOdpoved(request, {
      xp_ziskano: xpZiskano,
      xp_base: xpBase,
      multiplier,
      tier: userTier,
      xp_celkem: accountInfo.length > 0 ? phpInt(accountInfo[0].xp) : xpZiskano,
      level: accountInfo.length > 0 ? phpInt(accountInfo[0].level) : 1,
      level_up: levelUp,
    });
  } catch (error) {
    return legacyCatch(request, error, "Chyba při ukládání progressu");
  }
}