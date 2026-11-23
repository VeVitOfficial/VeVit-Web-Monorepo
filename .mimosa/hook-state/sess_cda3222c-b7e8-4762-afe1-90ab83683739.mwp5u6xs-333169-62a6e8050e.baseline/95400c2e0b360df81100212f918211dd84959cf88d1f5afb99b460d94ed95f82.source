import { getCategories, getProducts } from "@/lib/store-data";

export async function GET() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const counts = new Map<number, number>();
  for (const product of products) {
    const category = categories.find((item) => item.slug === product.store_categories?.slug);
    if (category) counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
  }
  return Response.json(
    { categories: categories.map((category) => ({ ...category, product_count: counts.get(category.id) ?? 0 })) },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
