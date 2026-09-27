import { handleAccountRequest } from "@/lib/account-route";
import { accountSupabase } from "@/lib/account-auth";
import { consoleActor, consoleNotFound } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// User search for the console: nickname or e-mail (substring), or exact id.
// Each hit carries effective tier and ranks; ?id= returns one user with
// their latest XP ledger rows and rank grants.

const COLUMNS = "id,email,nickname,full_name,status,tier,tier_expires,level,xp,created_at,avatar_url";

/** PostgREST `or()` syntax has no escaping; drop its separators and wildcards. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_*,()"']/g, " ").trim()}%`;
}

export async function GET(request: Request) {
  return handleAccountRequest(async (session) => {
    const actor = await consoleActor(session);
    if (!actor) return consoleNotFound();
    const sb = accountSupabase();
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") ?? "").trim();

    if (id) {
      const [user, ranks, grants, ledger] = await Promise.all([
        sb.from("users").select(COLUMNS).eq("id", id).limit(1).maybeSingle(),
        sb.rpc("user_rank_keys", { p_user_id: id }),
        sb.from("user_ranks").select("rank_key,source,granted_by,granted_at,expires_at,revoked_at").eq("user_id", id).order("granted_at", { ascending: false }),
        sb.from("xp_ledger").select("source,ref_key,base_amount,bonus_amount,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(30),
      ]);
      if (user.error || !user.data) return Response.json({ error: "Uživatel nenalezen." }, { status: 404 });
      const tier = await sb.rpc("user_effective_tier", { p_user_id: id });
      return Response.json(
        {
          user: { ...user.data, effective_tier: tier.data ?? "free", ranks: ranks.data ?? [] },
          grants: grants.data ?? [],
          ledger: ledger.data ?? [],
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    let query = sb.from("users").select(COLUMNS).order("created_at", { ascending: false }).limit(25);
    if (q) {
      const pattern = likePattern(q);
      query = query.or(`nickname.ilike.${pattern},email.ilike.${pattern},full_name.ilike.${pattern},id.eq.${q.replace(/[^0-9a-f]/gi, "") || "none"}`);
    }
    const { data, error } = await query;
    if (error) return Response.json({ error: "Hledání selhalo." }, { status: 500 });

    const users = await Promise.all(
      (data as unknown as Record<string, unknown>[]).map(async (user) => {
        const ranks = await sb.rpc("user_rank_keys", { p_user_id: user.id as string });
        return { ...user, ranks: ranks.data ?? [] };
      }),
    );
    return Response.json({ users }, { headers: { "Cache-Control": "no-store" } });
  });
}
