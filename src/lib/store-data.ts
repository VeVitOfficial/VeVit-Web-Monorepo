import "server-only";

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_desc: string | null;
  price: number;
  sale_price: number | null;
  type: "physical" | "digital";
  stock: number | null;
  images: string[] | string | null;
  brand: string | null;
  featured: boolean | number;
  created_at: string;
  store_categories?: { name: string; slug: string } | null;
};

export type StoreCategory = { id: number; name: string; slug: string; description?: string | null };

function configuration() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

async function dataApi<T>(table: string, params: URLSearchParams, revalidate = 300): Promise<T[]> {
  const config = configuration();
  if (!config) return [];
  const response = await fetch(`${config.url}/rest/v1/${table}?${params}`, {
    headers: { apikey: config.key, Accept: "application/json" },
    next: { revalidate, tags: [`store:${table}`] }
  });
  if (!response.ok) {
    console.error("Supabase Data API failed", { table, status: response.status });
    return [];
  }
  const payload: unknown = await response.json();
  return Array.isArray(payload) ? payload as T[] : [];
}

const productSelect = "id,name,slug,description,short_desc,price,sale_price,type,stock,images,brand,featured,created_at,store_categories(name,slug)";

export async function getProducts(filters: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams({ select: productSelect, is_active: "eq.true", limit: "1000" });
  const rows = await dataApi<StoreProduct>("store_products", params);
  const search = filters.search?.trim().toLocaleLowerCase("cs") ?? "";
  const categories = new Set((filters.category ?? "").split(",").filter(Boolean));
  const maxPrice = Number(filters.max_price ?? Number.POSITIVE_INFINITY);
  const dealsOnly = filters.deals === "1";
  const filtered = rows.filter((product) => {
    const effectivePrice = product.sale_price ?? product.price;
    if (categories.size && !categories.has(product.store_categories?.slug ?? "")) return false;
    if (filters.type && product.type !== filters.type) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    if (dealsOnly && product.sale_price === null) return false;
    if (Number.isFinite(maxPrice) && effectivePrice > maxPrice) return false;
    if (search && !`${product.name} ${product.short_desc ?? ""}`.toLocaleLowerCase("cs").includes(search)) return false;
    return true;
  });
  filtered.sort((left, right) => {
    const leftPrice = left.sale_price ?? left.price;
    const rightPrice = right.sale_price ?? right.price;
    if (filters.sort === "cheapest") return leftPrice - rightPrice;
    if (filters.sort === "expensive") return rightPrice - leftPrice;
    if (filters.sort === "newest") return right.created_at.localeCompare(left.created_at);
    return Number(right.featured) - Number(left.featured) || right.created_at.localeCompare(left.created_at);
  });
  return filtered;
}

export async function getProduct(slug: string) {
  const params = new URLSearchParams({
    select: productSelect,
    is_active: "eq.true",
    slug: `eq.${slug}`,
    limit: "1"
  });
  return (await dataApi<StoreProduct>("store_products", params))[0] ?? null;
}

export function productImages(product: StoreProduct) {
  if (Array.isArray(product.images)) return product.images.filter((value): value is string => typeof value === "string");
  if (typeof product.images !== "string" || !product.images) return [];
  try {
    const parsed: unknown = JSON.parse(product.images);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [product.images];
  } catch {
    return [product.images];
  }
}

export async function getCategories() {
  const params = new URLSearchParams({ select: "id,name,slug,description", order: "name.asc" });
  return dataApi<StoreCategory>("store_categories", params, 3600);
}
