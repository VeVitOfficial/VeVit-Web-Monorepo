import Link from "next/link";
import { connection } from "next/server";
import { ProductCard } from "@/components/store/product-card";
import { getProducts } from "@/lib/store-data";

export const metadata = { title: "Store", description: "Digitální a fyzické produkty VeVit." };

export default async function StorePage() {
  await connection();
  const products = (await getProducts()).slice(0, 6);
  return (
    <main className="store-main">
      <section className="store-hero">
        <p className="store-eyebrow">VeVit Store</p>
        <h1>Produkty pro digitální svět.</h1>
        <p>Vybrané digitální produkty, licence a fyzický merch. Katalog se načítá přes bezpečnou serverovou vrstvu a na Vercelu se průběžně obnovuje.</p>
        <div className="store-actions"><Link className="store-button primary" href="/store/catalog">Otevřít katalog</Link><Link className="store-button" href="/account">Můj účet</Link></div>
      </section>
      <div className="store-section-head"><h2>Doporučené produkty</h2><Link href="/store/catalog">Všechny →</Link></div>
      {products.length ? <div className="store-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="store-empty">Katalog bude dostupný po nastavení Supabase proměnných ve Vercelu.</div>}
    </main>
  );
}
