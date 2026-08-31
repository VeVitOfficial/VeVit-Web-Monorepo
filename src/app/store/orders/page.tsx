import Link from "next/link";
import { connection } from "next/server";
import { accountOrdersList, type AccountOrderRow } from "@/lib/store-order-page";

export const metadata = { title: "Moje objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Port of store/orders.php. */
export default async function OrdersPage() {
  await connection();
  const state = await loadOrders();
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>Moje objednávky</h1></div></div>
      {state === "unavailable" ? (
        <section className="store-form" role="status">
          <h2>Funkce je dočasně nedostupná</h2>
          <p>Přehled objednávek je dostupný jen po ověřeném přihlášení VeVit Account. Pro konkrétní objednávku použijte bezpečný odkaz z potvrzovacího e-mailu.</p>
          <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
        </section>
      ) : state.length === 0 ? (
        <p className="store-eyebrow">Zatím zde nejsou žádné objednávky.</p>
      ) : state.map((order) => (
        <article className="store-form" key={order.public_id}>
          <div className="store-section-head">
            <div><h2>{order.order_number}</h2><span>{order.created_at}</span></div>
            <div className="store-summary">
              <p>{order.status}</p>
              <strong>{order.total} {order.currency}</strong>
            </div>
          </div>
          <Link className="store-button" href={`/store/order?id=${encodeURIComponent(order.public_id)}`}>Detail objednávky</Link>
        </article>
      ))}
    </main>
  );
}

async function loadOrders(): Promise<AccountOrderRow[] | "unavailable"> {
  try {
    const orders = await accountOrdersList();
    return orders ?? "unavailable";
  } catch {
    return "unavailable";
  }
}