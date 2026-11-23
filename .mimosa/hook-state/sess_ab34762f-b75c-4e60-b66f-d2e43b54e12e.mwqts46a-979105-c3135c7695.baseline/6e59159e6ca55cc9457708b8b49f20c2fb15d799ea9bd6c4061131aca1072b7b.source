import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, listCategories, rateLimit, readJson, requireRequest, ServicesError } from "@/lib/services";
import { parseRequestInput } from "@/lib/services-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Úprava poptávky autorem, dokud je otevřená.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  return handleServicesWrite(request, async (session) => {
    const existing = await requireRequest(id);
    if (existing.author_id !== session.user.id) throw new ServicesError(403, "forbidden", "Tuto poptávku nemůžete upravit.");
    if (existing.status !== "open") throw new ServicesError(409, "request_closed", "Upravit lze jen otevřenou poptávku.");
    await rateLimit("services_request_edit", session.user.id, 30, 3600);
    const input = parseRequestInput(await readJson(request), await listCategories());
    const { data, error } = await accountSupabase()
      .from("services_requests")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("author_id", session.user.id)
      .eq("status", "open")
      .select("id");
    if (error) throw new Error(`request update failed: ${error.code}`);
    if (!data || data.length === 0) throw new ServicesError(409, "request_closed", "Upravit lze jen otevřenou poptávku.");
    return Response.json({ id: existing.id });
  });
}
