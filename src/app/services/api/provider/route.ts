import { accountSupabase } from "@/lib/account-auth";
import { handleServicesWrite, listCategories, optionalInt, rateLimit, readJson, ServicesError, text } from "@/lib/services";

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
    const city = text(body.city, "Město", remote ? 0 : 2, 80);
    const radius = optionalInt(body.radius_km, "Okruh", 500) ?? 0;
    const known = new Set((await listCategories()).map((category) => category.slug));
    const categories = Array.isArray(body.categories)
      ? [...new Set(body.categories.filter((value): value is string => typeof value === "string" && known.has(value)))]
      : [];
    if (categories.length === 0) throw new ServicesError(400, "invalid_input", "Vyberte aspoň jednu kategorii.");
    const active = body.active !== false;

    const { error } = await accountSupabase().from("services_providers").upsert({
      user_id: session.user.id,
      headline,
      bio,
      categories,
      city,
      radius_km: radius,
      remote,
      active,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`provider upsert failed: ${error.code}`);
    return Response.json({ ok: true });
  });
}
