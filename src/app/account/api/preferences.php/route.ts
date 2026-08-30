import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/preferences.php: user_preferences row with defaults on
// GET, upsert validated on POST/PATCH.

const DEFAULTS: Record<string, string> = {
  timezone: "Europe/Prague",
  date_format: "DD. MM. YYYY",
  week_starts_on: "monday",
  region: "CZ",
};

// Node's equivalent of PHP DateTimeZone::listIdentifiers().
const zoneSet = new Set(
  (Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["Europe/Prague"])
    .map((zone: string) => String(zone)),
);

async function storedRow(userId: string) {
  const { data, error } = await accountSupabase()
    .from("user_preferences")
    .select("timezone,date_format,week_starts_on,region")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function GET() {
  return handleAccountRequest(async (session) => {
    const { data, error } = await storedRow(session.user.id);
    if (error) return Response.json({ error: "Nastavení se nepodařilo načíst." }, { status: 400 });
    const row = (data as Record<string, string> | null) ?? {};
    return Response.json(
      { preferences: { ...DEFAULTS, ...row } },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

async function save(request: Request): Promise<Response> {
  return handleAccountRequest(async (session) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const timezone = typeof body.timezone === "string" ? body.timezone : "";
    const dateFormat = typeof body.date_format === "string" ? body.date_format : "";
    const weekStartsOn = typeof body.week_starts_on === "string" ? body.week_starts_on : "";

    if (!zoneSet.has(timezone) || !["DD. MM. YYYY", "YYYY-MM-DD"].includes(dateFormat) || !["monday", "sunday"].includes(weekStartsOn)) {
      return Response.json({ error: "Neplatné regionální nastavení." }, { status: 422 });
    }

    const row = {
      user_id: session.user.id,
      timezone,
      date_format: dateFormat,
      week_starts_on: weekStartsOn,
      region: "CZ",
      updated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    };

    const { data: existing, error: lookupError } = await storedRow(session.user.id);
    if (lookupError) return Response.json({ error: "Nastavení se nepodařilo uložit." }, { status: 400 });
    const upsertError = existing
      ? (await accountSupabase().from("user_preferences").update(row).eq("user_id", session.user.id)).error
      : (await accountSupabase().from("user_preferences").insert(row)).error;
    if (upsertError) return Response.json({ error: "Nastavení se nepodařilo uložit." }, { status: 400 });

    return Response.json(
      { preferences: row },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export const POST = save;
export const PATCH = save;

export async function DELETE(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET, POST, PATCH" } });
}