import { accountSupabase } from "@/lib/account-auth";
import {
  formatCzk,
  getProvider,
  handleServicesWrite,
  notifyUser,
  optionalInt,
  rateLimit,
  readJson,
  requestUrl,
  requireRequest,
  ServicesError,
  text,
} from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nabídka poskytovatele na otevřenou poptávku (jedna na poskytovatele).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const serviceRequest = await requireRequest(id);
    if (serviceRequest.status !== "open" || Date.parse(serviceRequest.expires_at) < Date.now()) {
      throw new ServicesError(409, "request_closed", "Poptávka už nepřijímá nabídky.");
    }
    if (serviceRequest.author_id === session.user.id) throw new ServicesError(403, "own_request", "Na vlastní poptávku nabídku poslat nelze.");
    const provider = await getProvider(session.user.id);
    if (!provider || !provider.active) {
      throw new ServicesError(403, "provider_required", "Nejdřív si vyplňte profil poskytovatele.");
    }
    await rateLimit("services_offer_create", session.user.id, 20, 86400);

    const body = await readJson(request);
    const price = optionalInt(body.price, "Cena");
    if (price === null) throw new ServicesError(400, "invalid_input", "Cena: zadejte celé číslo.");
    const delivery = text(body.delivery, "Termín dodání", 0, 120);
    const message = text(body.message, "Zpráva", 10, 2000);

    const { data, error } = await accountSupabase()
      .from("services_offers")
      .insert({ request_id: serviceRequest.id, provider_id: session.user.id, price, delivery, message })
      .select("id")
      .single();
    if (error?.code === "23505") throw new ServicesError(409, "already_offered", "Na tuto poptávku už jste nabídku poslali.");
    if (error || !data) throw new Error(`offer insert failed: ${error?.code ?? "no row"}`);

    await notifyUser(serviceRequest.author_id, "nová nabídka", [
      `Na vaši poptávku „${serviceRequest.title}“ přišla nabídka za ${formatCzk(price)}.`,
      `Zobrazit nabídky: ${requestUrl(serviceRequest.id)}`,
    ]);
    return Response.json({ id: (data as { id: string }).id }, { status: 201 });
  });
}
