import {
  legacyCatch, legacyChyba, legacyEduDb, legacyEsc, legacyOdpoved, legacyPreflight, legacyQuery,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/certificates.php (handleVerify branch): public
// certificate lookup by UUID.

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const uuid = (new URL(request.url).searchParams.get("uuid") ?? "").trim();
    if (uuid === "") legacyChyba(request, "Chybí uuid", 400);
    const rows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      legacyEduDb(),
      "SELECT uuid, user_nick, user_name, course_slug, course_title, issued_at FROM certificates WHERE uuid = ?",
      [uuid],
    );
    if (rows.length === 0) legacyChyba(request, "Certifikát nenalezen.", 404);
    const cert = rows[0];
    return legacyOdpoved(request, {
      uuid: cert.uuid,
      user_nick: legacyEsc(String(cert.user_nick)),
      user_name: legacyEsc(String(cert.user_name)),
      course_slug: cert.course_slug,
      course_title: legacyEsc(String(cert.course_title)),
      issued_at: cert.issued_at,
      valid: true,
    });
  } catch (error) {
    return legacyCatch(request, error, "Chyba při ověřování certifikátu");
  }
}