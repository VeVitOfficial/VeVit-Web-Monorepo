import {
  legacyAccountDb, legacyCatch, legacyOdpoved, legacyPreflight, legacyQuery,
} from "@/lib/edu-legacy-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/leaderboard.php: top 50 users by XP from the
// legacy account DB.

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const rows = await legacyQuery(
      legacyAccountDb(),
      "SELECT id, nickname, xp, level, role FROM users WHERE xp > 0 ORDER BY xp DESC LIMIT 50",
    );
    const users = rows.map((row, index) => ({
      nickname: row.nickname,
      xp: Math.trunc(Number(row.xp)),
      level: Math.trunc(Number(row.level)),
      role: row.role,
      rank: index + 1,
    }));
    return legacyOdpoved(request, users);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání leaderboardu");
  }
}