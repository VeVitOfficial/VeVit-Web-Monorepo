import { accountSupabase } from "@/lib/account-auth";
import { awardXp } from "@/lib/xp";
import { handleServicesWrite, notifyUser, requestUrl, requireRequest, ServicesError } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Potvrzení dokončení zakázky. Hotovo je, až potvrdí obě strany (services_mark_done).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const serviceRequest = await requireRequest(id);
    const { data, error } = await accountSupabase().rpc("services_mark_done", {
      p_user_id: session.user.id,
      p_request_id: serviceRequest.id,
    });
    if (error) throw new Error(`mark_done failed: ${error.code}`);
    if (data === "forbidden") throw new ServicesError(403, "forbidden", "Nejste stranou této zakázky.");
    if (data === "not_assigned") throw new ServicesError(409, "not_assigned", "Zakázka není rozpracovaná.");

    const { data: offer } = await accountSupabase()
      .from("services_offers")
      .select("provider_id")
      .eq("id", serviceRequest.accepted_offer_id ?? "")
      .maybeSingle();
    const providerId = (offer as { provider_id?: string } | null)?.provider_id ?? "";
    const counterpart = session.user.id === serviceRequest.author_id ? providerId : serviceRequest.author_id;

    if (data === "completed") {
      await Promise.all([
        awardXp(serviceRequest.author_id, "services.job_completed", serviceRequest.id),
        providerId ? awardXp(providerId, "services.job_completed", serviceRequest.id) : null,
      ]);
      await notifyUser(counterpart, "zakázka je dokončená", [
        `Zakázka „${serviceRequest.title}“ je potvrzená oběma stranami jako hotová.`,
        `Ohodnoťte prosím spolupráci: ${requestUrl(serviceRequest.id)}`,
      ]);
    } else {
      await notifyUser(counterpart, "potvrďte dokončení", [
        `Druhá strana označila zakázku „${serviceRequest.title}“ jako hotovou.`,
        `Potvrďte to prosím: ${requestUrl(serviceRequest.id)}`,
      ]);
    }
    return Response.json({ status: data });
  });
}
