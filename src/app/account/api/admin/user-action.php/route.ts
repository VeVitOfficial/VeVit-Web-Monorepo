import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { audit, consoleForbidden, consoleWriteActor, int, readJson, str } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Console actions on one user. Rules:
// - owner / admin ranks: only an owner grants or revokes them;
// - other program / staff ranks, XP, tier: needs `*` (admin or owner);
// - block / unblock and ending sessions: any console user, never on an owner
//   unless the actor is an owner, never on yourself.

const GRANTABLE = new Set(["betatester", "partner", "moderator", "admin", "owner"]);
const OWNER_ONLY = new Set(["admin", "owner"]);
const MANUAL_TIERS = new Set(["free", "bronze", "silver", "gold"]);

export async function POST(request: Request) {
  return handleAccountRequest(async (session) => {
    const actor = await consoleWriteActor(request, session);
    if (actor instanceof Response) return actor;
    const body = await readJson(request);
    const action = str(body.action, 40);
    const userId = str(body.user_id, 64);
    if (!userId) return Response.json({ error: "Chybí uživatel." }, { status: 400 });

    const sb = accountSupabase();
    const { data: target } = await sb.from("users").select("id,status").eq("id", userId).limit(1).maybeSingle();
    if (!target) return Response.json({ error: "Uživatel nenalezen." }, { status: 404 });
    const { data: targetRanks } = await sb.rpc("user_rank_keys", { p_user_id: userId });
    const targetIsOwner = Array.isArray(targetRanks) && targetRanks.includes("owner");
    if (targetIsOwner && !actor.isOwner) return consoleForbidden("Ownera může upravovat jen owner.");

    switch (action) {
      case "grant_rank":
      case "revoke_rank": {
        const rank = str(body.rank_key, 40);
        if (!GRANTABLE.has(rank)) return Response.json({ error: "Tento rank se nepřiděluje ručně." }, { status: 400 });
        if (OWNER_ONLY.has(rank) ? !actor.isOwner : !actor.isAdmin) return consoleForbidden();
        if (action === "revoke_rank" && rank === "owner" && userId === actor.id) {
          return consoleForbidden("Svůj vlastní rank owner odebrat nemůžete.");
        }
        if (action === "grant_rank") {
          const expires = str(body.expires_at, 40);
          const expiresAt = expires ? new Date(expires) : null;
          if (expiresAt && Number.isNaN(expiresAt.getTime())) return Response.json({ error: "Neplatné datum." }, { status: 400 });
          const { error } = await sb.from("user_ranks").upsert(
            {
              user_id: userId,
              rank_key: rank,
              source: "manual",
              granted_by: actor.id,
              granted_at: new Date().toISOString(),
              expires_at: expiresAt ? expiresAt.toISOString() : null,
              revoked_at: null,
            },
            { onConflict: "user_id,rank_key" },
          );
          if (error) return Response.json({ error: "Rank se nepodařilo přidělit." }, { status: 500 });
        } else {
          const { error } = await sb.from("user_ranks")
            .update({ revoked_at: new Date().toISOString() })
            .eq("user_id", userId).eq("rank_key", rank).is("revoked_at", null);
          if (error) return Response.json({ error: "Rank se nepodařilo odebrat." }, { status: 500 });
        }
        await audit(actor.id, action, userId, { rank });
        return Response.json({ ok: true });
      }

      case "set_status": {
        const status = str(body.status, 20);
        if (status !== "active" && status !== "blocked") return Response.json({ error: "Neplatný stav." }, { status: 400 });
        if (userId === actor.id) return consoleForbidden("Sami sebe zablokovat nemůžete.");
        const { error } = await sb.from("users").update({ status }).eq("id", userId);
        if (error) return Response.json({ error: "Stav se nepodařilo změnit." }, { status: 500 });
        if (status === "blocked") {
          await sb.from("sessions").update({ revoked_at: new Date().toISOString(), revoked_reason: "admin_block" })
            .eq("user_id", userId).is("revoked_at", null);
        }
        await audit(actor.id, "set_status", userId, { status });
        return Response.json({ ok: true });
      }

      case "revoke_sessions": {
        const { error } = await sb.from("sessions").update({ revoked_at: new Date().toISOString(), revoked_reason: "admin" })
          .eq("user_id", userId).is("revoked_at", null);
        if (error) return Response.json({ error: "Relace se nepodařilo ukončit." }, { status: 500 });
        await audit(actor.id, "revoke_sessions", userId);
        return Response.json({ ok: true });
      }

      case "adjust_xp": {
        if (!actor.isAdmin) return consoleForbidden();
        const delta = int(body.delta);
        if (delta === null || delta === 0 || Math.abs(delta) > 1_000_000) {
          return Response.json({ error: "Zadejte celé číslo různé od nuly." }, { status: 400 });
        }
        const { data, error } = await sb.rpc("admin_adjust_xp", {
          p_user_id: userId, p_delta: delta, p_reason: str(body.reason), p_actor_id: actor.id,
        });
        if (error) return Response.json({ error: "XP se nepodařilo upravit." }, { status: 500 });
        return Response.json({ ok: true, result: data });
      }

      case "set_tier": {
        if (!actor.isAdmin) return consoleForbidden();
        const tier = str(body.tier, 20);
        if (!MANUAL_TIERS.has(tier)) return Response.json({ error: "Neplatný tarif." }, { status: 400 });
        const expires = str(body.expires_at, 40);
        const expiresAt = expires ? new Date(expires) : null;
        if (tier !== "free" && (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
          return Response.json({ error: "Zadejte budoucí datum konce tarifu." }, { status: 400 });
        }
        const { error } = await sb.from("users").update({
          tier,
          tier_billing: tier === "free" ? null : "manual",
          tier_expires: tier === "free" ? null : expiresAt!.toISOString(),
        }).eq("id", userId);
        if (error) return Response.json({ error: "Tarif se nepodařilo nastavit." }, { status: 500 });
        await audit(actor.id, "set_tier", userId, { tier, expires_at: expiresAt?.toISOString() ?? null });
        return Response.json({ ok: true });
      }

      default:
        return Response.json({ error: "Neznámá akce." }, { status: 400 });
    }
  });
}
