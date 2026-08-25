import { connection } from "next/server";
import { ProductCard } from "@/components/store/product-card";
import { getCategories, getProducts } from "@/lib/store-data";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Katalog" };

export default async function CatalogPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const filters = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const [products, categories] = await Promise.all([getProducts(filters), getCategories()]);
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">VeVit Store</p><h1>Katalog</h1></div><span>{products.length} produktů</span></div>
      <form className="store-filters">
        <input name="search" defaultValue={filters.search} placeholder="Hledat produkty…" aria-label="Hledat produkty" />
        <select name="category" defaultValue={filters.category ?? ""} aria-label="Kategorie"><option value="">Všechny kategorie</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select>
        <select name="sort" defaultValue={filters.sort ?? "featured"} aria-label="Řazení"><option value="featured">Doporučené</option><option value="newest">Nejnovější</option><option value="cheapest">Nejlevnější</option><option value="expensive">Nejdražší</option></select>
        <button className="store-button primary" type="submit">Použít</button>
      </form>
      {products.length ? <div className="store-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="store-empty">Pro zvolené filtry nebyly nalezeny žádné produkty.</div>}
    </main>
  );
}
