import { accountSupabase } from "@/lib/account-auth";
import { awardXp } from "@/lib/xp";
import { handleServicesWrite, readJson, requireRequest, ServicesError, text } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hodnocení po dokončení: každá strana jednou hodnotí tu druhou.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const serviceRequest = await requireRequest(id);
    if (serviceRequest.status !== "completed") throw new ServicesError(409, "not_completed", "Hodnotit lze až dokončenou zakázku.");
    const { data: offer } = await accountSupabase()
      .from("services_offers")
      .select("provider_id")
      .eq("id", serviceRequest.accepted_offer_id ?? "")
      .maybeSingle();
    const providerId = (offer as { provider_id?: string } | null)?.provider_id;
    let subjectId: string;
    if (session.user.id === serviceRequest.author_id && providerId) subjectId = providerId;
    else if (session.user.id === providerId) subjectId = serviceRequest.author_id;
    else throw new ServicesError(403, "forbidden", "Nejste stranou této zakázky.");

    const body = await readJson(request);
    const stars = Number(body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new ServicesError(400, "invalid_input", "Vyberte 1 až 5 hvězdiček.");
    const comment = text(body.body, "Hodnocení", 0, 1000);

    const { error } = await accountSupabase()
      .from("services_reviews")
      .insert({ request_id: serviceRequest.id, author_id: session.user.id, subject_id: subjectId, stars, body: comment });
    if (error?.code === "23505") throw new ServicesError(409, "already_reviewed", "Tuto zakázku už jste ohodnotili.");
    if (error) throw new Error(`review insert failed: ${error.code}`);
    await awardXp(session.user.id, "services.review", serviceRequest.id);
    return Response.json({ ok: true }, { status: 201 });
  });
}
