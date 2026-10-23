import schemaJson from "@/content/aifb/aifb-content.schema.json";
import { apiActor, json, readBody, text } from "@/lib/edu/aifb/api";
import { editableDoc, getCatalog } from "@/lib/edu/aifb/content";
import { validateEditedDoc } from "@/lib/edu/aifb/edit-validate";
import { applyEdits, applyUnit, isEditDoc, unitOmit, unitValueErrors } from "@/lib/edu/aifb/edits";
import { editsFor, saveEdit } from "@/lib/edu/aifb/edits-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /edu/api/aifb/upravy  { doc, path, value, note }   value null = vrátit na původní text
// Jen admin (oprávnění *). Úprava se uloží, jen když je po ní celý dokument platný (stejná pravidla
// jako validace obsahu při buildu). Soubory v repozitáři se nemění (R6).

const MAX_BODY_BYTES = 400_000;

export async function POST(request: Request): Promise<Response> {
  const actor = await apiActor(request);
  if (actor instanceof Response) return actor;
  if (actor.role !== "admin") return json({ ok: false, error: "forbidden" }, 403);
  const body = await readBody(request, MAX_BODY_BYTES);
  if (!body) return json({ ok: false, error: "bad_request" }, 400);
  const doc = body.doc;
  const path = text(body.path, 300);
  if (!isEditDoc(doc) || unitOmit(doc, path) === null) return json({ ok: false, error: "bad_path" }, 400);

  const { base, current } = await editableDoc(doc);
  const revert = body.value === null;
  let next: unknown;
  if (revert) {
    next = applyEdits(doc, base, editsFor(doc).filter((edit) => edit.path !== path));
  } else {
    const shapeErrors = unitValueErrors(doc, current, path, body.value);
    if (shapeErrors.length > 0) return json({ ok: false, error: "invalid", errors: shapeErrors }, 422);
    next = applyUnit(doc, current, path, body.value);
  }

  const levelIds = getCatalog().categories.flatMap((category) => category.levels.map((level) => level.id));
  const errors = validateEditedDoc(doc, next, { schema: schemaJson, levelIds });
  if (errors.length > 0) return json({ ok: false, error: "invalid", errors: errors.slice(0, 20) }, 422);

  const saved = await saveEdit({ doc, path, value: revert ? null : body.value, note: text(body.note, 300) || null, authorId: actor.userId });
  return saved ? json({ ok: true }) : json({ ok: false, error: "failed" }, 500);
}
