import { connection } from "next/server";
import Link from "next/link";
import { ProductCard } from "@/components/store/product-card";
import { Icon } from "@/components/store/icon";
import { getBrands, getCategories, getProducts, getTopCategories, type StoreCategory } from "@/lib/store-data";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Katalog" };

const PAGE_SIZE = 36;
const SORTS = [
  { key: "featured", label: "Doporučujeme" },
  { key: "newest", label: "Nejnovější" },
  { key: "cheapest", label: "Nejlevnější" },
  { key: "expensive", label: "Nejdražší" }
] as const;

export default async function CatalogPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  ) as Record<string, string | undefined>;
  const filters = { ...params };
  const [categories, topCategories, brands] = await Promise.all([getCategories(), getTopCategories(), getBrands()]);

  // Výběr kategorie rozbalíme na celý její podstrom (filtr matchuje sub slugy).
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const byId = new Map(categories.map((category) => [category.id, category]));
  const selected = params.category ? bySlug.get(params.category) ?? null : null;
  const topOf = (category: StoreCategory) => {
    let node = category;
    const seen = new Set<number>();
    while (node.parent_id != null && !seen.has(node.id)) {
      seen.add(node.id);
      const parent = byId.get(node.parent_id);
      if (!parent) break;
      node = parent;
    }
    return node;
  };
  const selectedTop = selected ? topOf(selected) : null;
  if (selected && selected.parent_id == null) {
    const subtree = categories.filter((category) => topOf(category).slug === selected.slug);
    filters.category = subtree.map((category) => category.slug).join(",") || filters.category;
  }
  const subcategories = selectedTop ? categories.filter((category) => category.parent_id === selectedTop.id) : [];

  const products = await getProducts(filters);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const visible = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sort = params.sort ?? "featured";

  /** Odkaz se zachováním ostatních filtrů; `null` hodnotu odebere. */
  const hrefWith = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value && key !== "page") next.set(key, value);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `/store/catalog?${query}` : "/store/catalog";
  };

  const title = params.search
    ? `Výsledky pro „${params.search}“`
    : selected?.name ?? (params.deals === "1" ? "Slevy a akce" : params.type === "digital" ? "Digitální produkty" : "Katalog");

  const activeFilters = [
    params.search ? { label: `Hledání: ${params.search}`, href: hrefWith({ search: null }) } : null,
    selected ? { label: selected.name, href: hrefWith({ category: null }) } : null,
    params.brand ? { label: params.brand, href: hrefWith({ brand: null }) } : null,
    params.max_price ? { label: `Do ${params.max_price} Kč`, href: hrefWith({ max_price: null }) } : null,
    params.deals === "1" ? { label: "Ve slevě", href: hrefWith({ deals: null }) } : null,
    params.type ? { label: params.type === "digital" ? "Digitální" : "Fyzické", href: hrefWith({ type: null }) } : null
  ].filter((value): value is { label: string; href: string } => value !== null);

  return (
    <main className="sf-main" id="main-content">
      <nav className="sf-breadcrumbs" aria-label="Drobečková navigace">
        <Link href="/store">Obchod</Link>
        <span aria-hidden="true">›</span>
        {selected ? <Link href="/store/catalog">Katalog</Link> : <span aria-current="page">Katalog</span>}
        {selectedTop && selectedTop.slug !== selected?.slug && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={hrefWith({ category: selectedTop.slug })}>{selectedTop.name}</Link>
          </>
        )}
        {selected && (
          <>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{selected.name}</span>
          </>
        )}
      </nav>

      <div className="sf-catalog">
        <aside className="sf-filters" aria-label="Filtry">
          <details className="sf-filters__group" open>
            <summary>Kategorie</summary>
            <ul className="sf-filters__cats">
              {topCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={hrefWith({ category: category.slug })}
                    className={selectedTop?.slug === category.slug ? "is-active" : undefined}
                    aria-current={selected?.slug === category.slug ? "true" : undefined}
                  >
                    <Icon name={category.icon ?? "storefront"} />
                    <span>{category.name}</span>
                    <small>{category.count}</small>
                  </Link>
                  {selectedTop?.slug === category.slug && subcategories.length > 0 && (
                    <ul className="sf-filters__subs">
                      {subcategories.map((sub) => (
                        <li key={sub.slug}>
                          <Link href={hrefWith({ category: sub.slug })} className={selected?.slug === sub.slug ? "is-active" : undefined} aria-current={selected?.slug === sub.slug ? "true" : undefined}>
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </details>

          <form className="sf-filters__form" method="get" action="/store/catalog">
            {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
            {params.sort ? <input type="hidden" name="sort" value={params.sort} /> : null}
            {params.type ? <input type="hidden" name="type" value={params.type} /> : null}
            <details className="sf-filters__group" open>
              <summary>Hledat</summary>
              <label className="sr-only" htmlFor="catalog-search">Hledat v katalogu</label>
              <input id="catalog-search" className="sf-input" name="search" type="search" defaultValue={params.search} placeholder="Název produktu…" />
            </details>
            {brands.length > 1 && (
              <details className="sf-filters__group" open>
                <summary>Značka</summary>
                <label className="sr-only" htmlFor="catalog-brand">Značka</label>
                <select id="catalog-brand" className="sf-input" name="brand" defaultValue={params.brand ?? ""}>
                  <option value="">Všechny značky</option>
                  {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </details>
            )}
            <details className="sf-filters__group" open>
              <summary>Cena</summary>
              <label className="sf-field">
                <span>Maximální cena (Kč)</span>
                <input className="sf-input" name="max_price" type="number" min={0} step={50} inputMode="numeric" defaultValue={params.max_price} placeholder="např. 1000" />
              </label>
              <label className="sf-check">
                <input type="checkbox" name="deals" value="1" defaultChecked={params.deals === "1"} />
                <span>Pouze zboží ve slevě</span>
              </label>
            </details>
            <button className="sf-btn sf-btn--buy sf-btn--block" type="submit">Použít filtry</button>
            {activeFilters.length > 0 && <Link className="sf-link sf-filters__reset" href="/store/catalog">Zrušit všechny filtry</Link>}
          </form>
        </aside>

        <section className="sf-results" aria-labelledby="catalog-title">
          <header className="sf-results__head">
            <h1 id="catalog-title">{title}</h1>
            <p className="sf-muted">{products.length.toLocaleString("cs-CZ")} {products.length === 1 ? "produkt" : products.length >= 2 && products.length <= 4 ? "produkty" : "produktů"}</p>
          </header>

          {subcategories.length > 0 && !selected?.parent_id && (
            <div className="sf-subcats">
              {subcategories.map((sub) => (
                <Link key={sub.slug} href={hrefWith({ category: sub.slug })} className="sf-subcat">{sub.name}</Link>
              ))}
            </div>
          )}

          <div className="sf-toolbar">
            <nav className="sf-sorts" aria-label="Řazení">
              {SORTS.map((option) => (
                <Link
                  key={option.key}
                  href={hrefWith({ sort: option.key === "featured" ? null : option.key })}
                  className={sort === option.key ? "is-active" : undefined}
                  aria-current={sort === option.key ? "true" : undefined}
                >
                  {option.label}
                </Link>
              ))}
            </nav>
            {activeFilters.length > 0 && (
              <ul className="sf-active-filters" aria-label="Aktivní filtry">
                {activeFilters.map((filter) => (
                  <li key={filter.label}>
                    <Link href={filter.href} aria-label={`Odebrat filtr ${filter.label}`}>{filter.label} <span aria-hidden="true">×</span></Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {visible.length ? (
            <div className="sf-grid sf-grid--catalog">
              {visible.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
            </div>
          ) : (
            <div className="sf-empty">
              <h2>Nic jsme nenašli</h2>
              <p>Zkuste upravit filtry nebo hledaný výraz.</p>
              <Link className="sf-btn sf-btn--ghost" href="/store/catalog">Zobrazit celý katalog</Link>
            </div>
          )}

          {pageCount > 1 && (
            <nav className="sf-pagination" aria-label="Stránkování">
              {page > 1 ? <Link href={hrefWith({ page: String(page - 1) })} rel="prev">← Předchozí</Link> : <span aria-disabled="true">← Předchozí</span>}
              <span className="sf-pagination__info">Strana {page} z {pageCount}</span>
              {page < pageCount ? <Link href={hrefWith({ page: String(page + 1) })} rel="next">Další →</Link> : <span aria-disabled="true">Další →</span>}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
