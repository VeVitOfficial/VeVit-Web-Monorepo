import "server-only";

export type StoreProductSource = { type?: string; url: string; note?: string; verified?: string };

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
  specs?: Record<string, string> | null;
  sources?: StoreProductSource[] | null;
  variant_group?: string | null;
  variant_label?: string | null;
  /** Počet variant včetně této — vyplní getProducts při skupinování (Alza-style). */
  variant_count?: number;
  featured: boolean | number;
  created_at: string;
  store_categories?: { name: string; slug: string } | null;
};

export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  sort_order?: number;
  parent_id?: number | null;
  description?: string | null;
};

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

const productSelect =
  "id,name,slug,description,short_desc,price,sale_price,type,stock,images,brand,specs,sources,variant_group,variant_label,featured,created_at,store_categories(name,slug)";

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

  // Alza-style: jeden model (variant_group) = jedna karta; zobrazená varianta
  // je nejlevnější z těch, co prošly filtry, zbytek jako počet variant.
  const groups = new Map<string, StoreProduct[]>();
  for (const product of filtered) {
    const key = product.variant_group || `slug:${product.slug}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(product);
  }
  const representatives = [...groups.values()].map((variants) => {
    const sorted = [...variants].sort((left, right) => (left.sale_price ?? left.price) - (right.sale_price ?? right.price));
    const representative = sorted[0];
    return variants.length > 1 ? { ...representative, variant_count: variants.length } : representative;
  });

  representatives.sort((left, right) => {
    const leftPrice = left.sale_price ?? left.price;
    const rightPrice = right.sale_price ?? right.price;
    if (filters.sort === "cheapest") return leftPrice - rightPrice;
    if (filters.sort === "expensive") return rightPrice - leftPrice;
    if (filters.sort === "newest") return right.created_at.localeCompare(left.created_at);
    return Number(right.featured) - Number(left.featured) || right.created_at.localeCompare(left.created_at);
  });
  return representatives;
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

/** Ostatní varianty téhož modelu (Alza-style přepínač na detailu produktu). */
export async function getVariantSiblings(product: StoreProduct) {
  if (!product.variant_group) return [];
  const params = new URLSearchParams({
    select: "slug,name,variant_label,price,sale_price",
    is_active: "eq.true",
    variant_group: `eq.${product.variant_group}`,
    order: "price.asc",
    limit: "100"
  });
  const rows = await dataApi<{ slug: string; name: string; variant_label: string | null; price: number; sale_price: number | null }>(
    "store_products",
    params
  );
  return rows.filter((row) => row.slug !== product.slug);
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
  const params = new URLSearchParams({ select: "id,name,slug,icon,sort_order,parent_id", order: "name.asc" });
  return dataApi<StoreCategory>("store_categories", params, 3600);
}

/** Počty pro hero statistiky: SKU (všechny varianty) a značky. */
export async function getCatalogStats() {
  const [skuCount, brands] = await Promise.all([countProducts(), getBrands()]);
  return { skus: skuCount, brands: brands.length };
}

async function countProducts() {
  const config = configuration();
  if (!config) return 0;
  const response = await fetch(`${config.url}/rest/v1/store_products?select=id&is_active=eq.true&limit=1`, {
    headers: { apikey: config.key, Accept: "application/json", Prefer: "count=exact" },
    next: { revalidate: 300, tags: ["store:store_products"] }
  });
  const total = response.headers.get("content-range")?.split("/")[1];
  return Number(total) || 0;
}

export type TopCategory = { name: string; slug: string; icon: string | null; count: number; subs: string[] };

/** Hlavní kategorie s počty produktů (pro dlaždice na home i v katalogu). */
export async function getTopCategories() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const byId = new Map(categories.map((category) => [category.id, category]));

  const topSlugOf = (slug: string): string | null => {
    let category = bySlug.get(slug);
    const seen = new Set<string>();
    while (category && !seen.has(category.slug)) {
      seen.add(category.slug);
      if (category.parent_id == null) return category.slug;
      category = byId.get(category.parent_id);
    }
    return null;
  };

  const tops = new Map<string, { name: string; slug: string; icon: string | null; count: number; subs: Set<string> }>();
  for (const category of categories) {
    if (category.parent_id == null) {
      tops.set(category.slug, { name: category.name, slug: category.slug, icon: category.icon ?? null, count: 0, subs: new Set() });
    }
  }
  for (const product of products) {
    const slug = product.store_categories?.slug;
    if (!slug) continue;
    const top = topSlugOf(slug);
    const entry = top ? tops.get(top) : null;
    if (!entry) continue;
    entry.count += 1;
    const subName = bySlug.get(slug)?.name;
    if (subName && subName !== entry.name) entry.subs.add(subName);
  }
  return [...tops.values()]
    .filter((top) => top.count > 0)
    .sort((left, right) => right.count - left.count)
    .map((top) => ({ ...top, subs: [...top.subs].slice(0, 3) }));
}

export async function getBrands() {
  const params = new URLSearchParams({
    select: "brand",
    is_active: "eq.true",
    brand: "not.is.null",
    limit: "1000"
  });
  const rows = await dataApi<{ brand: string }>("store_products", params, 300);
  return [...new Set(rows.map((row) => row.brand).filter((brand): brand is string => Boolean(brand)))].sort((left, right) =>
    left.localeCompare(right, "cs")
  );
}
