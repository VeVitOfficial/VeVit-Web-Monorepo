import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, requireRequest, ServicesError } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zrušení poptávky autorem — jen dokud nemá přijatou nabídku.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const serviceRequest = await requireRequest(id);
    if (serviceRequest.author_id !== session.user.id) throw new ServicesError(403, "forbidden", "Tuto poptávku nemůžete zrušit.");
    const { data } = await accountSupabase()
      .from("services_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", serviceRequest.id)
      .eq("status", "open")
      .select("id");
    if (!data || data.length === 0) throw new ServicesError(409, "request_closed", "Poptávku už nelze zrušit.");
    await accountSupabase()
      .from("services_offers")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("request_id", serviceRequest.id)
      .eq("status", "sent");
    return Response.json({ ok: true });
  });
}
