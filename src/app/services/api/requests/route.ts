import { accountSupabase, clientIp } from "@/lib/account-auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { awardXp } from "@/lib/xp";
import { categoryExists, handleServicesWrite, optionalInt, rateLimit, readJson, text, ServicesError } from "@/lib/services";

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

    const category = text(body.category, "Kategorie", 1, 40);
    if (!(await categoryExists(category))) throw new ServicesError(400, "invalid_input", "Vyberte kategorii.");
    const title = text(body.title, "Název", 5, 120);
    const description = text(body.description, "Popis", 20, 4000);
    const remote = body.remote === true;
    const city = text(body.city, "Město", remote ? 0 : 2, 80);
    const budgetMin = optionalInt(body.budget_min, "Rozpočet od");
    const budgetMax = optionalInt(body.budget_max, "Rozpočet do");
    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      throw new ServicesError(400, "invalid_input", "Rozpočet od musí být menší než rozpočet do.");
    }
    let deadline: string | null = null;
    if (typeof body.deadline === "string" && body.deadline !== "") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || Number.isNaN(Date.parse(body.deadline))) {
        throw new ServicesError(400, "invalid_input", "Termín není platné datum.");
      }
      deadline = body.deadline;
    }

    const { data, error } = await accountSupabase()
      .from("services_requests")
      .insert({ author_id: session.user.id, category, title, description, city, remote, budget_min: budgetMin, budget_max: budgetMax, deadline })
      .select("id")
      .single();
    if (error || !data) throw new Error(`request insert failed: ${error?.code ?? "no row"}`);
    const id = (data as { id: string }).id;
    await awardXp(session.user.id, "services.request_created", id);
    return Response.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  });
}
