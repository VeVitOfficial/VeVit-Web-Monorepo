import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, listCategories, rateLimit, readJson, ServicesError, text } from "@/lib/services";
import { describeFilters, filtersToQuery, hasActiveFilters, parseRequestFilters } from "@/lib/services-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SEARCHES = 10;

// Nový hlídací pes: uloží kanonický query string výpisu poptávek.
export async function POST(request: Request): Promise<Response> {
  return handleServicesWrite(request, async (session) => {
    await rateLimit("services_saved_search", session.user.id, 30, 3600);
    const body = await readJson(request);
    const categories = await listCategories();
    const raw = typeof body.query === "string" ? body.query.slice(0, 1000) : "";
    const filters = parseRequestFilters(new URLSearchParams(raw), categories);
    if (!hasActiveFilters(filters)) throw new ServicesError(400, "invalid_input", "Nejdřív nastavte aspoň jeden filtr.");
    const query = filtersToQuery({ ...filters, page: 1 });
    const name = typeof body.name === "string" && body.name.trim()
      ? text(body.name, "Název", 1, 80)
      : describeFilters(filters, categories);

    const supabase = accountSupabase();
    const { data: existing } = await supabase.from("services_saved_searches").select("id,query").eq("user_id", session.user.id).limit(MAX_SEARCHES + 1);
    const rows = (existing ?? []) as { id: string; query: string }[];
    const same = rows.find((row) => row.query === query);
    if (same) {
      await supabase.from("services_saved_searches").update({ notify: true }).eq("id", same.id);
      return Response.json({ id: same.id, existing: true });
    }
    if (rows.length >= MAX_SEARCHES) throw new ServicesError(409, "limit", `Můžete mít nejvýš ${MAX_SEARCHES} hlídacích psů. Nějakého smažte v Moje zakázky.`);
    const { data, error } = await supabase
      .from("services_saved_searches")
      .insert({ user_id: session.user.id, name, query, notify: true })
      .select("id")
      .single();
    if (error || !data) throw new Error(`saved search insert failed: ${error?.code ?? "no row"}`);
    return Response.json({ id: (data as { id: string }).id }, { status: 201 });
  });
}
