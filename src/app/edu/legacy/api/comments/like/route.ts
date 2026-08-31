import {
  legacyCatch, legacyChyba, legacyEduDb, legacyPreflight, legacyQuery, legacyRawJson,
  legacyVyzadujPrihlaseni,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/comments.php (handleLike branch): insert-like /
// duplicate-key-unlike toggle followed by a likes-count recomputation.

function phpIntOr(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = legacyVyzadujPrihlaseni(request);
    let body: unknown;
    try {
      body = JSON.parse(await request.text());
    } catch {
      body = null;
    }
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      legacyChyba(request, "Chybí comment_id", 400);
    }
    const input = body as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(input, "comment_id")) {
      legacyChyba(request, "Chybí comment_id", 400);
    }
    const commentId = phpIntOr(input.comment_id, 0);
    if (commentId <= 0) legacyChyba(request, "Neplatné comment_id", 400);

    const db = legacyEduDb();
    let liked = true;
    try {
      await legacyQuery(db, "INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, NOW())", [
        commentId,
        user.id,
      ]);
      liked = true;
    } catch (error) {
      const code = (error as { code?: string; errno?: number }).code ?? "";
      const errno = (error as { errno?: number }).errno ?? 0;
      if (code === "ER_DUP_ENTRY" || errno === 1062) {
        await legacyQuery(db, "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?", [commentId, user.id]);
        liked = false;
      } else {
        throw error;
      }
    }

    await legacyQuery(
      db,
      "UPDATE lesson_comments SET likes = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?) WHERE id = ?",
      [commentId, commentId],
    );
    const likeRows = await legacyQuery<RowDataPacket & { likes: number }>(
      db,
      "SELECT likes FROM lesson_comments WHERE id = ?",
      [commentId],
    );
    const likes = likeRows.length > 0 ? Math.trunc(Number(likeRows[0].likes)) : 0;

    return legacyRawJson(request, { ok: true, liked, likes }, 200);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při likování");
  }
}