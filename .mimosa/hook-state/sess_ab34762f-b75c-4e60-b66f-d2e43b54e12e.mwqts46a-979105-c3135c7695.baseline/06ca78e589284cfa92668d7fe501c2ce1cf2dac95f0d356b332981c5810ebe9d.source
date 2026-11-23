import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, listCategories, optionalInt, rateLimit, readJson, safeWebsite, ServicesError, text } from "@/lib/services";
import { cityByCode } from "@/lib/services-geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vlastní profil poskytovatele (založení i úprava).
export async function POST(request: Request): Promise<Response> {
  return handleServicesWrite(request, async (session) => {
    await rateLimit("services_provider_save", session.user.id, 20, 3600);
    const body = await readJson(request);
    const headline = text(body.headline, "Co nabízíte", 3, 120);
    const bio = text(body.bio, "O vás", 0, 2000);
    const remote = body.remote === true;
    const city = cityByCode(body.city_code);
    if (!remote && !city) throw new ServicesError(400, "invalid_input", "Vyberte město ze seznamu, nebo zaškrtněte práci na dálku.");
    const radius = optionalInt(body.radius_km, "Okruh", 500) ?? 0;
    const hourlyRate = optionalInt(body.hourly_rate, "Hodinová sazba", 100_000);
    const website = safeWebsite(body.website);
    const known = new Set((await listCategories()).map((category) => category.slug));
    const categories = Array.isArray(body.categories)
      ? [...new Set(body.categories.filter((value): value is string => typeof value === "string" && known.has(value)))].slice(0, 20)
      : [];
    if (categories.length === 0) throw new ServicesError(400, "invalid_input", "Vyberte aspoň jeden obor.");
    const active = body.active !== false;

    const { error } = await accountSupabase().from("services_providers").upsert({
      user_id: session.user.id,
      headline,
      bio,
      categories,
      city: city?.name ?? "",
      city_code: city?.code ?? null,
      region: city?.region ?? "",
      lat: city?.lat ?? null,
      lng: city?.lng ?? null,
      radius_km: radius,
      remote,
      active,
      hourly_rate: hourlyRate,
      website,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`provider upsert failed: ${error.code}`);
    return Response.json({ ok: true });
  });
}
