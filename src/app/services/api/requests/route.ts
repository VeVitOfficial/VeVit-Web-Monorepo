import { after } from "next/server";
import { accountSupabase, clientIp } from "@/lib/account-auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { awardXp } from "@/lib/xp";
import { getRequest, handleServicesWrite, listCategories, rateLimit, readJson, ServicesError } from "@/lib/services";
import { notifyWatchdogs, parseRequestInput } from "@/lib/services-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zadání nové poptávky. Veřejná je hned po uložení (stav open, vyprší za 30 dní).
export async function POST(request: Request): Promise<Response> {
  return handleServicesWrite(request, async (session) => {
    const body = await readJson(request);
    if (!(await verifyTurnstile(body.cf_turnstile, clientIp(request), "services_request"))) {
      throw new ServicesError(400, "captcha_failed", "Ověření proti robotům selhalo. Zkuste to znovu.");
    }
    await rateLimit("services_request_create", session.user.id, 5, 86400);

    const categories = await listCategories();
    const input = parseRequestInput(body, categories);
    const { data, error } = await accountSupabase()
      .from("services_requests")
      .insert({ author_id: session.user.id, ...input })
      .select("id")
      .single();
    if (error || !data) throw new Error(`request insert failed: ${error?.code ?? "no row"}`);
    const id = (data as { id: string }).id;
    await awardXp(session.user.id, "services.request_created", id);

    // Hlídací psi až po odpovědi, ať zadavatel nečeká na e-maily.
    after(async () => {
      try {
        const created = await getRequest(id);
        if (created) await notifyWatchdogs(created, categories);
      } catch (reason) {
        console.error("[services] watchdog failed", reason instanceof Error ? reason.message : reason);
      }
    });
    return Response.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  });
}
