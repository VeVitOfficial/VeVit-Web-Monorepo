import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, requireRequest, ServicesError } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROLONG = 5;
const DAYS = 30;

// Prodloužení otevřené poptávky (nejdřív 7 dní před koncem) nebo obnovení
// vypršelé o dalších 30 dní. Nejvýš 5× na poptávku.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const existing = await requireRequest(id);
    if (existing.author_id !== session.user.id) throw new ServicesError(403, "forbidden", "Tuto poptávku nemůžete prodloužit.");
    if (existing.prolonged_count >= MAX_PROLONG) throw new ServicesError(409, "limit", "Poptávku už nelze dál prodlužovat. Zadejte novou.");
    const now = Date.now();
    const expires = Date.parse(existing.expires_at);
    const canProlong = existing.status === "open" && expires - now <= 7 * 86_400_000;
    const canRenew = existing.status === "expired" || (existing.status === "open" && expires < now);
    if (!canProlong && !canRenew) throw new ServicesError(409, "not_needed", "Prodloužit jde nejdřív 7 dní před koncem zveřejnění.");
    const from = Math.max(expires, now);
    const { data } = await accountSupabase()
      .from("services_requests")
      .update({
        status: "open",
        expires_at: new Date(from + DAYS * 86_400_000).toISOString(),
        prolonged_count: existing.prolonged_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("author_id", session.user.id)
      .in("status", ["open", "expired"])
      .eq("prolonged_count", existing.prolonged_count)
      .select("expires_at");
    if (!data || data.length === 0) throw new ServicesError(409, "conflict", "Poptávku se nepodařilo prodloužit. Obnovte stránku.");
    return Response.json({ expires_at: (data[0] as { expires_at: string }).expires_at });
  });
}
