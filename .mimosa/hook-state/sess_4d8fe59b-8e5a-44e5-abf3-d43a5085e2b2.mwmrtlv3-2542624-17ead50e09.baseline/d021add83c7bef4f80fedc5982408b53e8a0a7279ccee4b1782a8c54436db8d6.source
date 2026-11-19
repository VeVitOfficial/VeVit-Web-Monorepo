import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { consoleActor, consoleNotFound } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Latest console actions (who did what to whom), newest first.

type AuditRow = { id: number; actor_id: string | null; action: string; target_user_id: string | null; detail: unknown; created_at: string };

export async function GET() {
  return handleAccountRequest(async (session) => {
    if (!(await consoleActor(session))) return consoleNotFound();
    const sb = accountSupabase();
    const { data, error } = await sb.from("admin_audit_log")
      .select("id,actor_id,action,target_user_id,detail,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) return Response.json({ error: "Audit se nepodařilo načíst." }, { status: 500 });
    const rows = data as AuditRow[];
    const ids = [...new Set(rows.flatMap((r) => [r.actor_id, r.target_user_id]).filter((id): id is string => !!id))];
    const { data: users } = ids.length
      ? await sb.from("users").select("id,nickname").in("id", ids)
      : { data: [] as { id: string; nickname: string | null }[] };
    const names = new Map(((users ?? []) as { id: string; nickname: string | null }[]).map((u) => [u.id, u.nickname]));
    return Response.json(
      {
        entries: rows.map((r) => ({
          ...r,
          actor: r.actor_id ? names.get(r.actor_id) ?? r.actor_id : null,
          target: r.target_user_id ? names.get(r.target_user_id) ?? r.target_user_id : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
