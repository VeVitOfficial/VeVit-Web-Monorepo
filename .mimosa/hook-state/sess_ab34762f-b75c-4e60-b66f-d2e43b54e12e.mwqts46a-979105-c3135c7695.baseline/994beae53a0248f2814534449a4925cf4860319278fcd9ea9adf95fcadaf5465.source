import "server-only";

import { cityByCode } from "@/lib/services-geo";
import { parseRequestFilters, requestMatchesFilters } from "@/lib/services-search";
import {
  ServicesError, db, notifyUser, optionalInt, requestUrl, searchTextFor, servicesUrl, text,
  type ServicesCategory, type ServicesRequest,
} from "@/lib/services";
import { BUDGET_TYPES, JOB_TYPES } from "@/components/services/constants";
import { categoryLabel } from "@/components/services/categories";

export type RequestInput = {
  category: string;
  title: string;
  description: string;
  job_type: string;
  budget_type: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  urgent: boolean;
  remote: boolean;
  city: string;
  city_code: number | null;
  region: string;
  lat: number | null;
  lng: number | null;
  search_text: string;
};

function fail(message: string): never {
  throw new ServicesError(400, "invalid_input", message);
}

/** Validace formuláře poptávky (zadání i úprava). */
export function parseRequestInput(body: Record<string, unknown>, categories: ServicesCategory[]): RequestInput {
  const category = text(body.category, "Kategorie", 1, 40);
  if (!categories.some((item) => item.slug === category)) fail("Vyberte kategorii.");
  const title = text(body.title, "Název", 5, 120);
  const description = text(body.description, "Popis", 20, 4000);
  const jobType = typeof body.job_type === "string" && JOB_TYPES.some((item) => item.value === body.job_type) ? body.job_type : "one_time";
  const budgetType = typeof body.budget_type === "string" && BUDGET_TYPES.some((item) => item.value === body.budget_type) ? body.budget_type : "fixed";
  let budgetMin = optionalInt(body.budget_min, "Rozpočet od");
  let budgetMax = optionalInt(body.budget_max, "Rozpočet do");
  if (budgetType === "negotiable") {
    budgetMin = null;
    budgetMax = null;
  }
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) fail("Rozpočet od musí být menší než rozpočet do.");
  let deadline: string | null = null;
  if (typeof body.deadline === "string" && body.deadline !== "") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || Number.isNaN(Date.parse(body.deadline))) fail("Termín není platné datum.");
    if (Date.parse(body.deadline) < Date.now() - 86_400_000) fail("Termín nemůže být v minulosti.");
    deadline = body.deadline;
  }
  const remote = body.remote === true;
  const city = cityByCode(body.city_code);
  if (!remote && !city) fail("Vyberte město ze seznamu, nebo zaškrtněte práci na dálku.");
  return {
    category, title, description, job_type: jobType, budget_type: budgetType,
    budget_min: budgetMin, budget_max: budgetMax, deadline,
    urgent: body.urgent === true,
    remote,
    city: city?.name ?? "",
    city_code: city?.code ?? null,
    region: city?.region ?? "",
    lat: city?.lat ?? null,
    lng: city?.lng ?? null,
    search_text: searchTextFor(title, description),
  };
}

/**
 * Hlídací psi: po zveřejnění poptávky pošle e-mail majitelům odpovídajících
 * uložených hledání. Nejvýš jeden e-mail za hodinu na hledání a jeden na
 * uživatele a poptávku; autor poptávky upozornění nedostane.
 */
export async function notifyWatchdogs(request: ServicesRequest, categories: ServicesCategory[]): Promise<number> {
  const { data } = await db()
    .from("services_saved_searches")
    .select("id,user_id,name,query,last_notified_at")
    .eq("notify", true)
    .neq("user_id", request.author_id)
    .order("created_at", { ascending: true })
    .limit(2000);
  const cutoff = Date.now() - 60 * 60 * 1000;
  const notified = new Set<string>();
  for (const row of (data ?? []) as { id: string; user_id: string; name: string; query: string; last_notified_at: string | null }[]) {
    if (notified.has(row.user_id)) continue;
    if (row.last_notified_at && Date.parse(row.last_notified_at) > cutoff) continue;
    const filters = parseRequestFilters(new URLSearchParams(row.query), categories);
    if (!requestMatchesFilters(request, filters, categories)) continue;
    notified.add(row.user_id);
    await db().from("services_saved_searches").update({ last_notified_at: new Date().toISOString() }).eq("id", row.id);
    await notifyUser(row.user_id, `nová poptávka – ${row.name}`, [
      `K vašemu hlídanému hledání „${row.name}“ přibyla nová poptávka:`,
      `${request.title}\n${categoryLabel(request.category, categories)} · ${request.city || "na dálku"}`,
      `Detail a nabídka: ${requestUrl(request.id)}`,
      `Hlídání upravíte nebo vypnete v Moje zakázky: ${servicesUrl("/moje?tab=hlidaci")}`,
    ]);
  }
  return notified.size;
}
