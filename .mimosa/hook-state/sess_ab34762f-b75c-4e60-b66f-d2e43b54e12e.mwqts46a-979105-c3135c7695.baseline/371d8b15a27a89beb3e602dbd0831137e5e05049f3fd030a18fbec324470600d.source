import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, requireOffer, ServicesError } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stažení vlastní nabídky, dokud ji zadavatel nepřijal.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const offer = await requireOffer(id);
    if (offer.provider_id !== session.user.id) throw new ServicesError(403, "forbidden", "Tuto nabídku nemůžete stáhnout.");
    const { data } = await accountSupabase()
      .from("services_offers")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", offer.id)
      .eq("status", "sent")
      .select("id");
    if (!data || data.length === 0) throw new ServicesError(409, "offer_unavailable", "Nabídku už nelze stáhnout.");
    return Response.json({ ok: true });
  });
}
