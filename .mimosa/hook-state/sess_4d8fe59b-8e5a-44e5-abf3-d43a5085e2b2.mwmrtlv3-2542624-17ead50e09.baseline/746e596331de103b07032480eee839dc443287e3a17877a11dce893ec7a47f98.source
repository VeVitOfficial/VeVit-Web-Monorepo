import { handleAccountRequest } from "@/lib/account-route";
import {
  accountSupabase,
  logActivity,
  registerNicknameIsValid,
  registerNicknameLookupKey,
  registerNormalizeNickname,
} from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/profile-update.php: normalize + validate the
// allow-listed profile fields, keep nickname uniqueness, update + log.

const LIMITS: [string, number][] = [
  ["full_name", 100],
  ["nickname", 30],
  ["bio", 300],
  ["phone", 40],
  ["location", 100],
  ["birth_date", 10],
  ["company_name", 150],
  ["ico", 32],
  ["dic", 32],
  ["billing_address", 300],
  ["language", 10],
];

const LANGUAGES = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);

type FieldError = { field: string; message: string };

function preparePatch(body: Record<string, unknown>): { patch: Record<string, string>; errors: FieldError[] } {
  const patch: Record<string, string> = {};
  const errors: FieldError[] = [];

  for (const [field, limit] of LIMITS) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      errors.push({ field, message: "Hodnota pole není platná." });
      continue;
    }
    const normalized = field === "nickname" ? registerNormalizeNickname(value) : value.trim();
    if (normalized === null || Array.from(normalized).length > limit) {
      errors.push({ field, message: "Hodnota pole je příliš dlouhá." });
      continue;
    }
    patch[field] = normalized;
  }

  if ("full_name" in patch && Buffer.byteLength(patch.full_name, "utf8") < 2) {
    errors.push({ field: "full_name", message: "Jméno musí mít alespoň 2 znaky." });
  }
  if ("language" in patch && !LANGUAGES.has(patch.language)) {
    errors.push({ field: "language", message: "Vybraný jazyk není podporovaný." });
  }
  if ("nickname" in patch && !registerNicknameIsValid(patch.nickname)) {
    errors.push({ field: "nickname", message: "Přezdívka musí mít 2–30 povolených znaků." });
  }
  if ("birth_date" in patch && patch.birth_date !== "") {
    const match = /^\d{4}-\d{2}-\d{2}$/.test(patch.birth_date) ? patch.birth_date.split("-") : null;
    const validDate = match !== null && (() => {
      const [y, m, d] = match.map(Number) as [number, number, number];
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
    })();
    if (!validDate) {
      errors.push({ field: "birth_date", message: "Datum narození není platné." });
    }
  }

  return { patch, errors };
}

async function save(request: Request): Promise<Response> {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const { patch, errors } = preparePatch(body);
    if (Object.keys(patch).length === 0 && errors.length === 0) {
      return Response.json({ error: "Nebyla odeslána žádná podporovaná změna." }, { status: 422 });
    }
    if (errors.length > 0) {
      return Response.json({ error: errors[0].message, field: errors[0].field }, { status: 422 });
    }

    if ("nickname" in patch && patch.nickname !== String(session.user.nickname ?? "")) {
      const normalized = registerNicknameLookupKey(patch.nickname);
      if (normalized === null) {
        return Response.json({ error: "Přezdívku se nepodařilo zpracovat.", field: "nickname" }, { status: 503 });
      }
      const { data: existing, error: lookupError } = await accountSupabase()
        .from("users")
        .select("id")
        .eq("nickname_normalized", normalized)
        .limit(1)
        .maybeSingle();
      if (lookupError) {
        return Response.json({ error: "Dostupnost přezdívky se nepodařilo ověřit.", field: "nickname" }, { status: 503 });
      }
      const existingId = (existing as { id?: string } | null)?.id;
      if (existingId !== null && existingId !== undefined && existingId !== session.user.id) {
        return Response.json({ error: "Tato přezdívka je již obsazená.", field: "nickname" }, { status: 409 });
      }
      patch.nickname_normalized = normalized;
    }

    const { error: updateError } = await accountSupabase()
      .from("users")
      .update(patch)
      .eq("id", session.user.id);
    if (updateError) {
      if (updateError.code === "23505") {
        return Response.json({ error: "Tato přezdívka je již obsazená.", field: "nickname" }, { status: 409 });
      }
      return Response.json({ error: "Změny se nepodařilo uložit." }, { status: 500 });
    }

    await logActivity(session.user.id, "profile_update", "Profil byl upraven");
    return Response.json(
      { user: { ...session.user, ...patch } },
      { headers: { "Cache-Control": "no-store", "Content-Type": "application/json; charset=UTF-8" } },
    );
  });
}

export const POST = save;
export const PATCH = save;

export async function DELETE(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "PATCH, POST" } });
}