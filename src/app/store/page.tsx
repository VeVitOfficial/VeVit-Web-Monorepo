import Link from "next/link";
import { connection } from "next/server";
import { ProductCard } from "@/components/store/product-card";
import { Icon } from "@/components/store/icon";
import { getBrands, getCatalogStats, getProducts, getTopCategories } from "@/lib/store-data";

export const metadata = { title: "VeVit Store", description: "Elektronika, školní a kancelářské vybavení od ověřených značek s EU sklady a českou fakturou." };

export default async function StorePage() {
  await connection();
  const [products, categories, brands, stats] = await Promise.all([
    getProducts(),
    getTopCategories(),
    getBrands(),
    getCatalogStats()
  ]);
  const featured = products.slice(0, 10);
  const deals = products.filter((product) => product.sale_price !== null).slice(0, 10);
  const newest = [...products].sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 10);

  return (
    <main className="sf-main" id="main-content">
      <div className="sf-home-top">
        <nav className="sf-catmenu" aria-label="Kategorie">
          <p className="sf-catmenu__title">Kategorie</p>
          <ul>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/store/catalog?category=${category.slug}`}>
                  <span className="sf-catmenu__icon"><Icon name={category.icon ?? "storefront"} /></span>
                  <span className="sf-catmenu__name">{category.name}</span>
                  <span className="sf-catmenu__count">{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="sf-catmenu__all" href="/store/catalog">Celý katalog →</Link>
        </nav>

        <section className="sf-hero" aria-labelledby="hero-title">
          <div className="sf-hero__copy">
            <p className="sf-eyebrow">Pro domácnosti, firmy i školy</p>
            <h1 id="hero-title">Elektronika a vybavení do kanceláře za férové ceny</h1>
            <p>Ověřené značky, dodávka z EU skladů a česká faktura s DPH. Nakupujte jako jednotlivec nebo na firmu.</p>
            <form className="sf-hero__search" method="get" action="/store/catalog" role="search">
              <label htmlFor="hero-search" className="sr-only">Hledat produkty</label>
              <Icon name="search" />
              <input id="hero-search" name="search" type="search" placeholder="Co hledáte? Např. USB-C kabel, židle, NAS…" autoComplete="off" />
              <button className="sf-btn sf-btn--buy" type="submit">Hledat</button>
            </form>
          </div>
          <dl className="sf-hero__stats">
            <div><dt>Produktů</dt><dd>{stats.skus.toLocaleString("cs-CZ")}</dd></div>
            <div><dt>Značek</dt><dd>{stats.brands}</dd></div>
            <div><dt>Faktura</dt><dd>CZ · B2B</dd></div>
          </dl>
        </section>

        <div className="sf-promos">
          <Link className="sf-promo sf-promo--deal" href="/store/catalog?deals=1">
            <Icon name="sell" />
            <span><b>Slevy a akce</b>Zlevněné zboží na jednom místě</span>
          </Link>
          <Link className="sf-promo" href="/store/catalog?sort=newest">
            <Icon name="new_releases" />
            <span><b>Novinky</b>Čerstvě přidané produkty</span>
          </Link>
          <Link className="sf-promo" href="/store/catalog?type=digital">
            <Icon name="download" />
            <span><b>Digitální produkty</b>Ihned ke stažení</span>
          </Link>
        </div>
      </div>

      <ul className="sf-benefits" aria-label="Výhody nákupu">
        <li><Icon name="local_shipping" /><span><b>Doprava zdarma</b> nad 1 000 Kč</span></li>
        <li><Icon name="currency_exchange" /><span><b>Česká faktura</b> pro firmy i školy</span></li>
        <li><Icon name="policy" /><span><b>Originální zboží</b> ověřených značek</span></li>
        <li><Icon name="help" /><span><b>Podpora</b> v češtině</span></li>
      </ul>

      <section className="sf-section" aria-labelledby="featured-title">
        <div className="sf-section__head">
          <h2 id="featured-title">Doporučujeme</h2>
          <Link href="/store/catalog">Zobrazit vše →</Link>
        </div>
        {featured.length
          ? <div className="sf-grid">{featured.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 5} />)}</div>
          : <div className="sf-empty">Katalog zatím nemá žádné produkty. Podívejte se sem prosím později.</div>}
      </section>

      {deals.length > 0 && (
        <section className="sf-section sf-section--deal" aria-labelledby="deals-title">
          <div className="sf-section__head">
            <h2 id="deals-title"><Icon name="sell" /> Akční nabídka</h2>
            <Link href="/store/catalog?deals=1">Všechny slevy →</Link>
          </div>
          <div className="sf-rail">{deals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      {newest.length > 0 && (
        <section className="sf-section" aria-labelledby="new-title">
          <div className="sf-section__head">
            <h2 id="new-title">Novinky v sortimentu</h2>
            <Link href="/store/catalog?sort=newest">Všechny novinky →</Link>
          </div>
          <div className="sf-rail">{newest.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="sf-section" aria-labelledby="brands-title">
          <div className="sf-section__head"><h2 id="brands-title">Značky</h2></div>
          <div className="sf-chips">
            {brands.map((brand) => (
              <Link key={brand} href={`/store/catalog?brand=${encodeURIComponent(brand)}`} className="sf-chip">{brand}</Link>
            ))}
          </div>
        </section>
      )}

      <section className="sf-b2b" aria-labelledby="b2b-title">
        <div>
          <p className="sf-eyebrow">Firmy a školy</p>
          <h2 id="b2b-title">Nakupujete na IČO?</h2>
          <p>V pokladně vyplníte IČO a údaje doplníme z ARES. Fakturu s DPH dostanete e-mailem hned po zaplacení.</p>
        </div>
        <div className="sf-b2b__actions">
          <Link className="sf-btn sf-btn--buy" href="/store/catalog">Začít nakupovat</Link>
          <Link className="sf-btn sf-btn--ghost" href="/cs/store/contact.php">Poptávka pro školy</Link>
        </div>
      </section>
    </main>
  );
}
