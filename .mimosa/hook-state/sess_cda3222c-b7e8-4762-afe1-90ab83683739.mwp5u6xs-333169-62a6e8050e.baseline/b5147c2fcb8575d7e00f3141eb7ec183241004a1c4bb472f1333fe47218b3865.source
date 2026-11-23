import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { saveProgress } from "@/lib/edu/school/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/school/prubeh  { lesson_id, status: "started" | "done" | null }
// Stav lekce žáka ve škole se ukládá i na server, aby ho viděl učitel. Žák mimo školu dostane 403
// a jeho průběh zůstává jen v prohlížeči.

const LESSON_ID = /^(?:zs1|zs2|ss|kurz)-[a-z0-9]+(?:-[a-z0-9]+)*-(?:teorie|cv[1-5])$/;

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  const body = await readBody(request, 1_000);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const lessonId = text(body.lesson_id, 80);
  const status = body.status === "started" || body.status === "done" ? body.status : body.status === null ? null : undefined;
  if (!LESSON_ID.test(lessonId) || status === undefined) return json({ ok: false, error: "bad_request" }, 400);
  return (await saveProgress(actor.userId, lessonId, status)) ? json({ ok: true }) : json({ ok: false, error: "forbidden" }, 403);
}
