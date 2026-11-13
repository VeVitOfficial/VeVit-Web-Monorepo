import { json } from "@/lib/edu/aifb/api";
import { toEduLocale } from "@/lib/edu/locale";
import { schoolEntry } from "@/lib/edu/school/viewer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /edu/api/school/entry?locale=cs → { entry: { name, href } | null }
// Tlačítko „VeVit Edu pro školy“ na statické hlavní stránce Edu: přihlášený člen školy
// dostane název školy a odkaz do portálu, ostatní null. Výpadek účtů = null (bezpečná strana).
export async function GET(request: Request): Promise<Response> {
  const locale = toEduLocale(new URL(request.url).searchParams.get("locale") ?? undefined);
  const entry = await schoolEntry(locale).catch(() => null);
  return json({ entry });
}
