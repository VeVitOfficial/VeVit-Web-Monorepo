import {
  legacyCatch, legacyChyba, legacyEduDb, legacyEsc, legacyGetVevitUser,
  legacyOdpoved, legacyPreflight, legacyQuery, legacyRawJson, legacyVyzadujPrihlaseni,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/comments.php (base routes): GET list with replies,
// POST new comment with the 5-per-10-minutes rate limit, DELETE soft delete.
// The POST /comments/like branch lives in the ../comments/like route.

function phpIntOr(value: unknown, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

type DbPool = ReturnType<typeof legacyEduDb>;

async function userLiked(db: DbPool, commentId: number, userId: string): Promise<boolean> {
  try {
    const rows = await legacyQuery<RowDataPacket>(
      db,
      "SELECT 1 AS liked FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

function sanitizeComment(row: Record<string, unknown>, liked: boolean): Record<string, unknown> {
  return {
    ...row,
    user_liked: liked,
    user_nick: legacyEsc(String(row.user_nick)),
    user_avatar: legacyEsc(String(row.user_avatar)),
    content: legacyEsc(String(row.content)),
  };
}

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const lessonId = phpIntOr(params.get("lesson_id"), 0);
    if (lessonId <= 0) legacyChyba(request, "Chybí lesson_id", 400);

    const offset = Math.max(0, phpIntOr(params.get("offset"), 0));
    const limit = params.has("limit") ? Math.min(50, Math.max(1, phpIntOr(params.get("limit"), 20))) : 20;

    const db = legacyEduDb();
    const user = legacyGetVevitUser(request);
    const userId = user ? String(user.id) : null;

    const countRows = await legacyQuery<RowDataPacket & { total: number }>(
      db,
      "SELECT COUNT(*) as total FROM lesson_comments WHERE lesson_id = ? AND parent_id IS NULL AND is_deleted = 0",
      [lessonId],
    );
    const total = countRows.length > 0 ? phpIntOr(countRows[0].total, 0) : 0;

    const comments = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id, content, is_pinned, likes, created_at "
      + "FROM lesson_comments WHERE lesson_id = ? AND parent_id IS NULL AND is_deleted = 0 "
      + "ORDER BY is_pinned DESC, created_at DESC LIMIT ? OFFSET ?",
      [lessonId, limit, offset],
    );

    const result: Record<string, unknown>[] = [];
    for (const comment of comments) {
      const liked = userId !== null ? await userLiked(db, Number(comment.id), userId) : false;
      const replies = await legacyQuery<RowDataPacket & Record<string, unknown>>(
        db,
        "SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id, content, is_pinned, likes, created_at "
        + "FROM lesson_comments WHERE parent_id = ? AND is_deleted = 0 ORDER BY created_at ASC",
        [comment.id],
      );
      const repliesResult: Record<string, unknown>[] = [];
      for (const reply of replies) {
        const replyLiked = userId !== null ? await userLiked(db, Number(reply.id), userId) : false;
        repliesResult.push(sanitizeComment(reply, replyLiked));
      }
      result.push({ ...sanitizeComment(comment, liked), replies: repliesResult });
    }
    return legacyOdpoved(request, { comments: result, total });
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání komentářů");
  }
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
    if (body === null || typeof body !== "object" || Array.isArray(body) || body === null) {
      legacyChyba(request, "Neplatný JSON", 400);
    }
    const input = body as Record<string, unknown>;

    const lessonId = phpIntOr(input.lesson_id, 0);
    const content = typeof input.content === "string" ? input.content.trim() : "";
    let parentId: number | null = input.parent_id !== null && input.parent_id !== undefined ? phpIntOr(input.parent_id, 0) : 0;
    if (parentId === 0) parentId = null;

    if (lessonId <= 0) legacyChyba(request, "Neplatné lesson_id", 400);
    if (content === "") legacyChyba(request, "Komentář nesmí být prázdný", 400);
    if ([...content].length > 2000) legacyChyba(request, "Komentář je příliš dlouhý (max 2000 znaků)", 400);

    const db = legacyEduDb();

    // Rate limit: max 5 comments per 10 minutes (non-fatal on failure).
    try {
      const recentRows = await legacyQuery<RowDataPacket & { recent: number }>(
        db,
        "SELECT COUNT(*) as recent FROM lesson_comments WHERE user_id = ? AND created_at > NOW() - INTERVAL 10 MINUTE",
        [user.id],
      );
      if (recentRows.length > 0 && phpIntOr(recentRows[0].recent, 0) >= 5) {
        return legacyRawJson(request, { ok: false, error: "Příliš mnoho komentářů. Počkej 10 minut." }, 429);
      }
    } catch (error) {
      console.error("comments rate-limit error:", error instanceof Error ? error.message : error);
    }

    // Parent verification; max one nesting level — reply to the top-level parent.
    if (parentId !== null) {
      const parentRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
        db,
        "SELECT id, parent_id FROM lesson_comments WHERE id = ? AND is_deleted = 0",
        [parentId],
      );
      if (parentRows.length === 0) legacyChyba(request, "Komentář neexistuje", 404);
      if (parentRows[0].parent_id !== null) {
        const replyParentId = phpIntOr(parentRows[0].parent_id, 0);
        parentId = replyParentId > 0 ? replyParentId : parentId;
      }
    }

    const nick = typeof user.nickname === "string" && user.nickname !== ""
      ? user.nickname
      : typeof user.nick === "string" && user.nick !== "" ? user.nick : "Anonym";
    const avatar = typeof user.avatar === "string" ? user.avatar : "";
    const insertResult = await db.query(
      "INSERT INTO lesson_comments (lesson_id, user_id, user_nick, user_avatar, parent_id, content, is_pinned, is_deleted, likes, created_at) "
      + "VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, NOW())",
      [lessonId, user.id, nick, avatar, parentId, content],
    );
    const newId = Number((insertResult[0] as { insertId?: number }).insertId ?? 0);

    const rows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, lesson_id, user_id, user_nick, user_avatar, parent_id, content, is_pinned, likes, created_at "
      + "FROM lesson_comments WHERE id = ?",
      [newId],
    );
    const row = { ...rows[0], user_liked: false, replies: [] } as Record<string, unknown>;
    row.user_nick = legacyEsc(String(row.user_nick));
    row.user_avatar = legacyEsc(String(row.user_avatar));
    row.content = legacyEsc(String(row.content));
    return legacyOdpoved(request, row, 201);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při ukládání komentáře");
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const user = legacyVyzadujPrihlaseni(request);
    const params = new URL(request.url).searchParams;
    const id = phpIntOr(params.get("id"), 0);
    if (id <= 0) legacyChyba(request, "Chybí id komentáře", 400);

    const db = legacyEduDb();
    const rows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT user_id FROM lesson_comments WHERE id = ?",
      [id],
    );
    if (rows.length === 0) legacyChyba(request, "Komentář nenalezen", 404);

    const isAdmin = typeof user.role === "string" && (user.role as string) === "admin";
    if (String(rows[0].user_id) !== String(user.id) && !isAdmin) {
      legacyChyba(request, "Nemáš oprávnění smazat tento komentář", 403);
    }

    await legacyQuery(db, "UPDATE lesson_comments SET is_deleted = 1, content = '[Komentář byl smazán]' WHERE id = ?", [id]);
    return legacyOdpoved(request, { id, deleted: true });
  } catch (error) {
    return legacyCatch(request, error, "Chyba při mazání komentáře");
  }
}