import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/account-overview.php: profile completion, security
// summary (session/TOTP/password-change) and the last 8 activity entries with
// IP masking — per-section degradation instead of a hard failure.

const PROFILE_FIELDS: [string, string][] = [
  ["full_name", "jméno a příjmení"],
  ["nickname", "přezdívka"],
  ["bio", "bio"],
  ["location", "lokalita"],
  ["birth_date", "datum narození"],
  ["avatar_url", "profilová fotografie"],
];

const ipPattern = /\b(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}\b/g;

function boundedText(value: string, maxBytes: number): string {
  if (Buffer.byteLength(value, "utf8") <= maxBytes) return value;
  let bounded = value;
  while (bounded.length > 0 && Buffer.byteLength(bounded, "utf8") > maxBytes) {
    bounded = bounded.slice(0, -1);
  }
  return bounded;
}

type ActivityRow = { kind?: string; detail?: string; created_at?: string };

function normalizeActivity(rows: ActivityRow[]): Record<string, string>[] {
  const sorted = rows.toSorted((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  const safe: Record<string, string>[] = [];
  for (const row of sorted.slice(0, 8)) {
    const kind = typeof row.kind === "string" ? row.kind : "";
    const createdAt = typeof row.created_at === "string" ? row.created_at : "";
    if (!kind || !createdAt) continue;
    const detail = (typeof row.detail === "string" ? row.detail : "").trim().replace(ipPattern, "$1.$2.*.*");
    safe.push({ kind: boundedText(kind, 40), detail: boundedText(detail, 160), created_at: createdAt });
  }
  return safe;
}

export async function GET() {
  return handleAccountRequest(async (session) => {
    const user = session.user as Record<string, unknown>;
    const errors: Record<string, string> = {};

    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const sessionRes = await accountSupabase()
      .from("sessions")
      .select("id,created_at,expires_at")
      .eq("user_id", session.user.id)
      .gt("expires_at", nowIso)
      .limit(100);
    const sessions = sessionRes.error ? [] : sessionRes.data ?? [];
    if (sessionRes.error) errors.security = "Bezpečnostní souhrn není právě dostupný.";

    const activityRes = await accountSupabase()
      .from("account_activity")
      .select("kind,detail,created_at")
      .eq("user_id", session.user.id)
      .limit(100);
    const activityRows = (activityRes.error ? [] : activityRes.data ?? []) as ActivityRow[];
    if (activityRes.error) errors.activity = "Aktivitu účtu se nepodařilo načíst.";

    const missing: string[] = [];
    for (const [field, label] of PROFILE_FIELDS) {
      const value = user[field];
      if (typeof value !== "string" || value.trim() === "") missing.push(label);
    }
    const completion = Math.round(((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100);

    let lastPasswordChange: string | null = null;
    for (const row of activityRows) {
      if (row.kind !== "password_change") continue;
      const createdAt = typeof row.created_at === "string" ? row.created_at : "";
      if (createdAt && (lastPasswordChange === null || createdAt.localeCompare(lastPasswordChange) > 0)) {
        lastPasswordChange = createdAt;
      }
    }

    return Response.json(
      {
        profile: { completion, missing },
        security: {
          two_factor_enabled: user.two_factor_enabled === true,
          active_sessions: sessions.length,
          last_password_change: lastPasswordChange,
        },
        activity: normalizeActivity(activityRows),
        errors,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}