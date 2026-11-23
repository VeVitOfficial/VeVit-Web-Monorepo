import { getProducts } from "@/lib/store-data";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const filters = Object.fromEntries(query.entries());
  const products = await getProducts(filters);
  const perPage = Math.min(48, Math.max(1, Number(query.get("per_page") ?? 12)));
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(totalPages, Math.max(1, Number(query.get("page") ?? 1)));
  const result = products.slice((page - 1) * perPage, page * perPage).map((product) => ({
    ...product,
    category_name: product.store_categories?.name ?? null,
    category_slug: product.store_categories?.slug ?? null,
    store_categories: undefined
  }));
  return Response.json(
    { products: result, page, total_pages: totalPages, total },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
