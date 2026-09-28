import { searchCities } from "@/lib/services-geo";
import { regionLabel } from "@/components/services/constants";

export const runtime = "nodejs";

// Našeptávač obcí ČR pro filtry a formuláře Services (veřejná statická data).
export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const cities = searchCities(q, 8).map((city) => ({
    code: city.code,
    label: city.label,
    region: regionLabel(city.region),
  }));
  return Response.json({ cities }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } });
}
