import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, notifyUser, requestUrl, requireOffer, ServicesError } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Přijetí nabídky autorem poptávky; ostatní nabídky se zamítnou (services_accept_offer).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const offer = await requireOffer(id);
    const { data, error } = await accountSupabase().rpc("services_accept_offer", {
      p_user_id: session.user.id,
      p_offer_id: offer.id,
    });
    if (error) throw new Error(`accept failed: ${error.code}`);
    if (data === "forbidden") throw new ServicesError(403, "forbidden", "Nabídku může přijmout jen autor poptávky.");
    if (data === "offer_unavailable") throw new ServicesError(409, "offer_unavailable", "Nabídka už není k dispozici.");
    if (data === "request_closed") throw new ServicesError(409, "request_closed", "Poptávka už je uzavřená.");

    await notifyUser(offer.provider_id, "vaše nabídka byla přijata", [
      "Zadavatel přijal vaši nabídku. Teď uvidíte jeho kontakt a můžete se domluvit na detailech.",
      `Otevřít zakázku: ${requestUrl(offer.request_id)}`,
    ]);
    return Response.json({ ok: true });
  });
}
