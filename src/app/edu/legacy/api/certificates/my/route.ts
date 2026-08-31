import {
  legacyCatch, legacyEduDb, legacyEsc, legacyOdpoved, legacyPreflight,
  legacyQuery, legacyVyzadujPrihlaseni,
} from "@/lib/edu-legacy-db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/legacy/api/certificates.php (handleMy branch).

export async function OPTIONS(request: Request) {
  return legacyPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const user = legacyVyzadujPrihlaseni(request);
    const rows = await legacyQuery<RowDataPacket & Record<string, unknown>>(
      legacyEduDb(),
      "SELECT uuid, course_slug, course_title, issued_at FROM certificates WHERE user_id = ? ORDER BY issued_at DESC",
      [user.id],
    );
    const certs = rows.map((row) => ({ ...row, course_title: legacyEsc(String(row.course_title)) }));
    return legacyOdpoved(request, certs);
  } catch (error) {
    return legacyCatch(request, error, "Chyba při načítání certifikátů");
  }
}