import { createHash } from "node:crypto";
import {
  CERT_SECRET, legacyAccountDb, legacyCatch, legacyChyba, legacyEduDb, legacyEsc,
  legacyOdpoved, legacyPreflight, legacyQuery, legacyVyzadujPrihlaseni,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/certificates.php (handleIssue branch): issue a
// certificate for a fully completed course (idempotent on user+course).

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
      legacyChyba(request, "Chybí course_slug", 400);
    }
    const input = body as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(input, "course_slug")) {
      legacyChyba(request, "Chybí course_slug", 400);
    }
    const courseSlug = typeof input.course_slug === "string" ? input.course_slug.trim() : "";
    if (courseSlug === "") legacyChyba(request, "Neplatný course_slug", 400);

    const db = legacyEduDb();

    const existingRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, uuid, user_nick, user_name, course_title, issued_at FROM certificates WHERE user_id = ? AND course_slug = ?",
      [user.id, courseSlug],
    );
    if (existingRows.length > 0) {
      const existing = existingRows[0];
      return legacyOdpoved(request, {
        uuid: existing.uuid,
        user_nick: legacyEsc(String(existing.user_nick)),
        user_name: legacyEsc(String(existing.user_name)),
        course_title: legacyEsc(String(existing.course_title)),
        issued_at: existing.issued_at,
        already_exists: true,
      });
    }

    const courseRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      db,
      "SELECT id, title, lesson_count FROM courses WHERE slug = ?",
      [courseSlug],
    );
    if (courseRows.length === 0) legacyChyba(request, "Kurz nenalezen", 404);
    const course = courseRows[0];

    const countRows = await legacyQuery<RowDataPacket & { total: number }>(
      db,
      "SELECT COUNT(*) as total FROM user_progress WHERE user_id = ? AND course_id = ?",
      [user.id, course.id],
    );
    const completedCount = countRows.length > 0 ? Math.trunc(Number(countRows[0].total)) : 0;
    let requiredCount = course.lesson_count !== null && course.lesson_count !== undefined
      ? Math.trunc(Number(course.lesson_count))
      : 0;

    // If lesson_count is 0, fall back to the actual number of lessons.
    if (requiredCount === 0) {
      const lessonCountRows = await legacyQuery<RowDataPacket & { total: number }>(
        db,
        "SELECT COUNT(*) as total FROM lessons WHERE course_id = ?",
        [course.id],
      );
      requiredCount = lessonCountRows.length > 0 ? Math.trunc(Number(lessonCountRows[0].total)) : 0;
    }

    if (requiredCount > 0 && completedCount < requiredCount) {
      legacyChyba(request, "Kurz ještě není dokončen.", 403);
    }

    // UUID + verify hash (sha256(uuid + user id + slug + CERT_SECRET)).
    const uuid = [
      randomBytesHex(4),
      randomBytesHex(2),
      randomBytesHex(2),
      randomBytesHex(2),
      randomBytesHex(6),
    ].join("-");
    const verifyHash = createHash("sha256").update(uuid + String(user.id) + courseSlug + CERT_SECRET).digest("hex");

    // Full name from the account DB, falling back to the cookie nickname.
    let userName = typeof user.nickname === "string" && user.nickname !== ""
      ? user.nickname
      : typeof user.nick === "string" ? user.nick : "";
    try {
      const accRows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
        legacyAccountDb(),
        "SELECT nickname, full_name FROM users WHERE id = ?",
        [user.id],
      );
      if (accRows.length > 0) {
        const fullName = accRows[0].full_name;
        userName = typeof fullName === "string" && fullName !== "" ? fullName : String(accRows[0].nickname);
      }
    } catch (error) {
      console.error("certificates account lookup error:", error instanceof Error ? error.message : error);
    }
    const userNick = typeof user.nickname === "string" && user.nickname !== ""
      ? user.nickname
      : typeof user.nick === "string" && user.nick !== "" ? user.nick : "Anonym";

    await legacyQuery(
      db,
      "INSERT INTO certificates (uuid, user_id, user_nick, user_name, course_slug, course_title, issued_at, verify_hash) "
      + "VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)",
      [uuid, user.id, userNick, userName, courseSlug, String(course.title), verifyHash],
    );

    return legacyOdpoved(request, {
      uuid,
      user_nick: legacyEsc(userNick),
      user_name: legacyEsc(userName),
      course_title: legacyEsc(String(course.title)),
      issued_at: new Date().toISOString(),
    }, 201);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při vydávání certifikátu");
  }
}

function randomBytesHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}