import { getProducts } from "@/lib/store-data";

export async function GET() {
  const counts = new Map<string, number>();
  for (const product of await getProducts()) {
    if (product.brand) counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
  }
  const brands = [...counts].map(([brand, product_count]) => ({ brand, product_count }))
    .sort((left, right) => right.product_count - left.product_count || left.brand.localeCompare(right.brand));
  return Response.json({ brands }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
