import { connection } from "next/server";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Icon } from "@/components/store/icon";
import { getBrands, getCategories, getProducts, getTopCategories } from "@/lib/store-data";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Katalog" };

export default async function CatalogPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const filters = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const [categories, topCategories, brands] = await Promise.all([getCategories(), getTopCategories(), getBrands()]);

  // Výběr hlavní kategorie rozbalíme na její podkategorie (filtr matchuje sub slugy).
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const selected = filters.category ? bySlug.get(filters.category) : null;
  if (selected && selected.parent_id == null) {
    const topOf = (category: (typeof categories)[number]) => {
      let node = category;
      const seen = new Set<number>();
      while (node.parent_id != null && !seen.has(node.id)) {
        seen.add(node.id);
        node = byId.get(node.parent_id) ?? node;
        if (node.parent_id == null) break;
      }
      return node.slug;
    };
    const subtree = categories.filter((category) => topOf(category) === selected.slug);
    filters.category = subtree.map((category) => category.slug).join(",") || filters.category;
  }

  const products = await getProducts(filters);
  return (
    <main className="store-main">
      <div className="store-section-head">
        <div>
          <p className="store-eyebrow">VeVit Store</p>
          <h1>Katalog</h1>
        </div>
        <span>{products.length} produktů</span>
      </div>

      <div className="store-cat-tiles">
        {topCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/store/catalog?category=${category.slug}`}
            className={`store-cat-tile${selected?.slug === category.slug ? " is-active" : ""}`}
          >
            {category.icon ? <span className="store-cat-tile-icon"><Icon name={category.icon} /></span> : null}
            <b>{category.name}</b>
            <span>
              {category.count} produktů
              {category.subs.length ? ` · ${category.subs.join(", ")}` : ""}
            </span>
          </Link>
        ))}
        {selected && (
          <Link href="/store/catalog" className="store-cat-tile is-clear">✕ Zrušit výběr</Link>
        )}
      </div>

      <form className="store-filters">
        <input name="search" defaultValue={filters.search} placeholder="Hledat produkty…" aria-label="Hledat produkty" />
        <select name="category" defaultValue={filters.category ?? ""} aria-label="Kategorie"><option value="">Všechny kategorie</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select>
        {brands.length > 1 && (
          <select name="brand" defaultValue={filters.brand ?? ""} aria-label="Značka">
            <option value="">Všechny značky</option>
            {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        )}
        <select name="sort" defaultValue={filters.sort ?? "featured"} aria-label="Řazení"><option value="featured">Doporučené</option><option value="newest">Nejnovější</option><option value="cheapest">Nejlevnější</option><option value="expensive">Nejdražší</option></select>
        <button className="store-button primary" type="submit">Použít</button>
      </form>
      {products.length ? <div className="store-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="store-empty">Pro zvolené filtry nebyly nalezeny žádné produkty.</div>}
    </main>
  );
}
