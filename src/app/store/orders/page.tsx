import Link from "next/link";
import { connection } from "next/server";
import { accountOrdersList, type AccountOrderRow } from "@/lib/store-order-page";
import { AgendaPage, AgendaUnavailable } from "@/components/store/agenda-shell";

export const metadata = { title: "Moje objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Port of store/orders.php. */
export default async function OrdersPage() {
  await connection();
  const state = await loadOrders();
  return (
    <AgendaPage title="Moje objednávky" subtitle="Přehled objednávek je dostupný jen po ověřeném přihlášení VeVit Account.">
      {state === "unavailable" ? (
        <AgendaUnavailable message="Serverový kontrakt VeVit Account zatím není ověřený. Pro konkrétní objednávku použijte bezpečný odkaz z potvrzovacího e-mailu." />
      ) : state.length === 0 ? (
        <p className="text-on-surface-variant">Zatím zde nejsou žádné objednávky.</p>
      ) : state.map((order) => (
        <article className="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4" key={order.public_id}>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="font-h2 text-h2">{order.order_number}</h2>
              <p className="text-on-surface-variant">{order.created_at}</p>
            </div>
            <div className="text-right">
              <p>{order.status}</p>
              <strong>{order.total} {(order.currency ?? "").toUpperCase()}</strong>
            </div>
          </div>
          <Link className="btn btn-outline mt-4 inline-flex" href={`/store/order?id=${encodeURIComponent(order.public_id)}`}>Detail objednávky</Link>
        </article>
      ))}
    </AgendaPage>
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