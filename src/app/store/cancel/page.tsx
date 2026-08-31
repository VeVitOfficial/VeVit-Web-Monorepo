import Link from "next/link";

export const metadata = { title: "Platba zrušena — VeVit Store", robots: { index: false } };

/** Port of store/cancel.php. */
export default function CancelPage() {
  return (
    <main className="store-main">
      <section className="store-hero">
        <p className="store-eyebrow">Checkout</p>
        <h1>Platba byla zrušena</h1>
        <p>Tvá objednávka nebyla dokončena. Obsah košíku zůstal uložen — můžeš to zkusit znovu nebo si nechat čas na rozmyšlenou.</p>
        <div className="store-actions">
          <Link className="store-button" href="/store/cart">Zpět do košíku</Link>
          <Link className="store-button primary" href="/store/checkout">Zkusit znovu</Link>
        </div>
        <Link className="store-button" href="/store/catalog">Nebo pokračovat v nákupu</Link>
      </section>
    </main>
  );
}