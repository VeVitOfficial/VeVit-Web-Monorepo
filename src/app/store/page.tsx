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
  const featured = products.slice(0, 8);
  return (
    <main className="store-main">
      <section className="store-hero">
        <div>
          <p className="store-eyebrow">VeVit Store · sortiment od zdrojových výrobců</p>
          <h1>Elektronika, školní a kancelářské vybavení za férové ceny.</h1>
          <p>Vybrané značky s dodávkou z EU skladů a českou fakturou — pro lidi, firmy i školy.</p>
          <div className="store-actions">
            <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
            <Link className="store-button" href="/store/catalog?sort=newest">Novinky</Link>
          </div>
        </div>
        <div className="store-hero-stats">
          <div className="store-stat"><b>{stats.skus}</b><span>produktů v katalogu</span></div>
          <div className="store-stat"><b>{stats.brands}</b><span>ověřených značek</span></div>
          <div className="store-stat"><b>B2B</b><span>faktura a servis v češtině</span></div>
        </div>
      </section>

      <div className="store-section-head"><h2>Shop podle kategorie</h2><Link href="/store/catalog">Všechny kategorie →</Link></div>
      <div className="store-cat-tiles">
        {categories.map((category) => (
          <Link key={category.slug} href={`/store/catalog?category=${category.slug}`} className="store-cat-tile">
            {category.icon ? <span className="store-cat-tile-icon"><Icon name={category.icon} /></span> : null}
            <b>{category.name}</b>
            <span>{category.count} produktů</span>
          </Link>
        ))}
      </div>

      <div className="store-section-head"><h2>Doporučené produkty</h2><Link href="/store/catalog">Celý katalog →</Link></div>
      {featured.length ? <div className="store-grid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="store-empty">Katalog zatím nemá žádné produkty. Podívejte se sem prosím později.</div>}

      <div className="store-section-head"><h2>Podle značky</h2></div>
      <div className="store-brand-strip">
        {brands.map((brand) => (
          <Link key={brand} href={`/store/catalog?brand=${encodeURIComponent(brand)}`} className="store-brand-chip">{brand}</Link>
        ))}
      </div>

      <div className="store-benefits">
        <div className="store-benefit"><Icon name="local_shipping" /> Dodávka z EU skladů (CZ · DE · PL)</div>
        <div className="store-benefit"><Icon name="currency_exchange" /> Česká faktura pro firmy i školy</div>
        <div className="store-benefit"><Icon name="policy" /> Ověřená originalita značek</div>
        <div className="store-benefit"><Icon name="check_circle" /> Podpora a servis v češtině</div>
      </div>
    </main>
  );
}
