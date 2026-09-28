import { accountSupabase } from "@/lib/account-auth";
import { loadSessionFromCookies } from "@/lib/account-session";
import {
  canAccessOffer,
  getOffer,
  handleServicesWrite,
  listMessages,
  notifyUser,
  rateLimit,
  readJson,
  requestUrl,
  requireOffer,
  ServicesError,
  text,
} from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zprávy mezi autorem poptávky a poskytovatelem jedné nabídky.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const headers = { "Cache-Control": "no-store" };
  const session = await loadSessionFromCookies().catch(() => null);
  if (!session) return Response.json({ error: { code: "login_required", message: "Přihlaste se." } }, { status: 401, headers });
  const offer = /^[0-9a-f-]{36}$/i.test(id) ? await getOffer(id.toLowerCase()) : null;
  const access = offer ? await canAccessOffer(offer, session.user.id) : null;
  if (!offer || !access) return Response.json({ error: { code: "not_found", message: "Konverzace nebyla nalezena." } }, { status: 404, headers });
  return Response.json({ messages: await listMessages(offer.id), me: session.user.id }, { headers });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const offer = await requireOffer(id);
    const access = await canAccessOffer(offer, session.user.id);
    if (!access) throw new ServicesError(404, "not_found", "Konverzace nebyla nalezena.");
    if (offer.status !== "sent" && offer.status !== "accepted") {
      throw new ServicesError(409, "thread_closed", "Konverzace k této nabídce je uzavřená.");
    }
    await rateLimit("services_message_send", session.user.id, 60, 3600);
    const body = text((await readJson(request)).body, "Zpráva", 1, 2000);

    // E-mail jen na první zprávu po 30 minutách ticha, ať se neposílá za každou větu.
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await accountSupabase()
      .from("services_messages")
      .select("id")
      .eq("offer_id", offer.id)
      .eq("sender_id", session.user.id)
      .gte("created_at", since)
      .limit(1);

    const { error } = await accountSupabase().from("services_messages").insert({ offer_id: offer.id, sender_id: session.user.id, body });
    if (error) throw new Error(`message insert failed: ${error.code}`);

    if (!recent || recent.length === 0) {
      await notifyUser(access.counterpartId, "nová zpráva", [
        `Máte novou zprávu k poptávce „${access.request.title}“.`,
        `Odpovědět: ${requestUrl(access.request.id)}`,
      ]);
    }
    return Response.json({ messages: await listMessages(offer.id) }, { status: 201 });
  });
}
