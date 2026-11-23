import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, readJson, ServicesError, uuid } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Úprava hlídacího psa: { notify: boolean } zapne/vypne e-maily, { delete: true } smaže.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const searchId = uuid(id);
    const body = await readJson(request);
    const supabase = accountSupabase();
    if (body.delete === true) {
      await supabase.from("services_saved_searches").delete().eq("id", searchId).eq("user_id", session.user.id);
      return Response.json({ deleted: true });
    }
    if (typeof body.notify !== "boolean") throw new ServicesError(400, "invalid_input", "Neplatný požadavek.");
    const { data } = await supabase
      .from("services_saved_searches")
      .update({ notify: body.notify })
      .eq("id", searchId)
      .eq("user_id", session.user.id)
      .select("id,notify");
    if (!data || data.length === 0) throw new ServicesError(404, "not_found", "Hlídací pes nebyl nalezen.");
    return Response.json({ notify: body.notify });
  });
}
