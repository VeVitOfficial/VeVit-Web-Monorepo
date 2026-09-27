import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { audit, consoleActor, consoleForbidden, consoleNotFound, consoleWriteActor, int, readJson, str } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Platinum organizations: list with members, create, add / remove members
// by e-mail or nickname, suspend or end the contract. Writes need `*`.

const KINDS = new Set(["school", "company", "other"]);
const ROLES = new Set(["admin", "teacher", "member"]);
const STATUSES = new Set(["active", "suspended", "ended"]);
const MODULE_RE = /^[a-z0-9_]{2,40}$/;

type OrgRow = Record<string, unknown> & { id: string };
type MemberRow = { org_id: string; user_id: string; role: string; joined_at: string };

export async function GET() {
  return handleAccountRequest(async (session) => {
    if (!(await consoleActor(session))) return consoleNotFound();
    const sb = accountSupabase();
    const { data: orgs, error } = await sb.from("organizations")
      .select("id,name,kind,ico,contract_start,contract_end,seat_limit,modules,status,created_at")
      .order("created_at", { ascending: false }).limit(200);
    if (error) return Response.json({ error: "Organizace se nepodařilo načíst." }, { status: 500 });
    const ids = (orgs as OrgRow[]).map((org) => org.id);
    const { data: members } = ids.length
      ? await sb.from("organization_members").select("org_id,user_id,role,joined_at").in("org_id", ids).is("removed_at", null)
      : { data: [] as MemberRow[] };
    const userIds = [...new Set(((members ?? []) as MemberRow[]).map((m) => m.user_id))];
    const { data: users } = userIds.length
      ? await sb.from("users").select("id,nickname,email").in("id", userIds)
      : { data: [] as { id: string; nickname: string | null; email: string | null }[] };
    const byId = new Map(((users ?? []) as { id: string; nickname: string | null; email: string | null }[]).map((u) => [u.id, u]));
    return Response.json(
      {
        organizations: (orgs as OrgRow[]).map((org) => ({
          ...org,
          members: ((members ?? []) as MemberRow[])
            .filter((m) => m.org_id === org.id)
            .map((m) => ({ ...m, nickname: byId.get(m.user_id)?.nickname ?? null, email: byId.get(m.user_id)?.email ?? null })),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const actor = await consoleWriteActor(request, session);
    if (actor instanceof Response) return actor;
    if (!actor.isAdmin) return consoleForbidden();
    const body = await readJson(request);
    const action = str(body.action, 30);
    const sb = accountSupabase();

    if (action === "create") {
      const name = str(body.name, 200);
      const kind = str(body.kind, 20);
      const seats = body.seat_limit === "" || body.seat_limit == null ? null : int(body.seat_limit);
      const end = str(body.contract_end, 10);
      const modules = Array.isArray(body.modules)
        ? (body.modules as unknown[]).map((m) => str(m, 40)).filter((m) => MODULE_RE.test(m))
        : [];
      if (name.length < 2 || !KINDS.has(kind) || (seats !== null && seats <= 0) || (end && !/^\d{4}-\d{2}-\d{2}$/.test(end))) {
        return Response.json({ error: "Vyplňte název, typ a platné údaje." }, { status: 400 });
      }
      const { data, error } = await sb.from("organizations").insert({
        name, kind, ico: str(body.ico, 20) || null, seat_limit: seats, contract_end: end || null, modules,
      }).select("id").single();
      if (error || !data) return Response.json({ error: "Organizaci se nepodařilo založit." }, { status: 500 });
      await audit(actor.id, "org_create", null, { org_id: data.id, name, kind });
      return Response.json({ ok: true, id: data.id });
    }

    const orgId = str(body.org_id, 40);
    const { data: org } = await sb.from("organizations").select("id,seat_limit").eq("id", orgId).limit(1).maybeSingle();
    if (!org) return Response.json({ error: "Organizace nenalezena." }, { status: 404 });

    if (action === "add_member") {
      const who = str(body.user, 200).toLowerCase();
      const role = str(body.role, 20) || "member";
      if (!who || !ROLES.has(role)) return Response.json({ error: "Zadejte e-mail nebo přezdívku a roli." }, { status: 400 });
      const { data: user } = await sb.from("users").select("id")
        .or(`email.eq.${who.replace(/[,()"']/g, "")},nickname_normalized.eq.${who.replace(/[,()"']/g, "")}`)
        .limit(1).maybeSingle();
      if (!user) return Response.json({ error: "Uživatel nenalezen." }, { status: 404 });
      if (org.seat_limit) {
        const { count } = await sb.from("organization_members").select("user_id", { count: "exact", head: true })
          .eq("org_id", orgId).is("removed_at", null);
        if ((count ?? 0) >= org.seat_limit) return Response.json({ error: "Organizace nemá volné licence." }, { status: 409 });
      }
      const { error } = await sb.from("organization_members").upsert(
        { org_id: orgId, user_id: user.id, role, invited_by: actor.id, joined_at: new Date().toISOString(), removed_at: null },
        { onConflict: "org_id,user_id" },
      );
      if (error) return Response.json({ error: "Člena se nepodařilo přidat." }, { status: 500 });
      await audit(actor.id, "org_add_member", user.id, { org_id: orgId, role });
      return Response.json({ ok: true });
    }

    if (action === "remove_member") {
      const userId = str(body.user_id, 64);
      const { error } = await sb.from("organization_members").update({ removed_at: new Date().toISOString() })
        .eq("org_id", orgId).eq("user_id", userId);
      if (error) return Response.json({ error: "Člena se nepodařilo odebrat." }, { status: 500 });
      await audit(actor.id, "org_remove_member", userId, { org_id: orgId });
      return Response.json({ ok: true });
    }

    if (action === "set_status") {
      const status = str(body.status, 20);
      if (!STATUSES.has(status)) return Response.json({ error: "Neplatný stav." }, { status: 400 });
      const { error } = await sb.from("organizations").update({ status }).eq("id", orgId);
      if (error) return Response.json({ error: "Stav se nepodařilo změnit." }, { status: 500 });
      await audit(actor.id, "org_set_status", null, { org_id: orgId, status });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Neznámá akce." }, { status: 400 });
  });
}
