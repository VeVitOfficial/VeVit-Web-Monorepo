import Link from "next/link";
import { connection } from "next/server";
import { orderPageData } from "@/lib/store-order-page";

export const metadata = { title: "Detail objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const CLAIMABLE = new Set(["paid", "processing", "shipped", "delivered"]);

interface DeliveryLike { public_id: unknown; status: unknown; estimated_delivery_at: unknown; delivered_at: unknown; tracking_url: unknown; tracking_number: unknown }

export default async function OrderDetailPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const single = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as string[])[0] : raw[key]) ?? "";
  const id = single("id");
  const state = await loadOrder(id);
  if (state === null) {
    return (
      <main className="store-main">
        <section className="store-form" role="status">
          <h2>Funkce je dočasně nedostupná</h2>
          <p>Objednávka není dostupná. Otevřete ji pouze přes původní bezpečný odkaz.</p>
          <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
        </section>
      </main>
    );
  }
  const currency = state.currency.toUpperCase();
  return (
    <main className="store-main">
      <section className="store-form">
        <div className="store-section-head">
          <div><p className="store-eyebrow">Zákaznická agenda</p><h1>{state.orderNumber}</h1></div>
          <span>{state.createdAt}</span>
        </div>
        <p>Platba: {state.paymentStatus} · Fulfilment: {state.fulfillmentStatus}</p>
        <h2>Položky</h2>
        {state.items.map((item) => (
          <div className="store-cart-item" key={item.key}>
            <span>{item.name} × {item.quantity}</span>
            <strong>{item.price} {currency}</strong>
          </div>
        ))}
        <h2>Doručení</h2>
        {state.deliveries.length === 0 ? <p className="store-eyebrow">Zásilka zatím nebyla založena.</p> : state.deliveries.map((delivery) => (
          <div key={delivery.key} className="store-cart-item">
            <strong>{delivery.status}</strong>
            <p className="store-eyebrow">Odhad: {delivery.estimate} · Doručeno: {delivery.delivered}</p>
            {delivery.trackingUrl !== null ? <a className="store-button" href={delivery.trackingUrl} rel="noopener noreferrer" target="_blank">Sledovat zásilku</a> : delivery.trackingNumber !== null ? <p>Tracking: {delivery.trackingNumber}</p> : null}
          </div>
        ))}
      </section>
      <section className="store-form">
        <h2>Další kroky</h2>
        {state.claimable ? <Link className="store-button primary" href={`/store/claim?order=${encodeURIComponent(id)}`}>Založit reklamaci</Link> : null}
        {state.returnable ? <Link className="store-button" href={`/store/return?order=${encodeURIComponent(id)}`}>Požádat o vrácení</Link> : null}
      </section>
    </main>
  );
}

interface ItemRow { id: unknown; product_name: unknown; quantity: unknown; unit_price: unknown; product_type: unknown }

async function loadOrder(id: string) {
  try {
    const { detail, deliveries } = await orderPageData(id);
    const items = detail.items as unknown as ItemRow[];
    return {
      orderNumber: detail.order_number,
      status: detail.status ?? "",
      currency: (detail.currency ?? "").toUpperCase(),
      createdAt: detail.created_at,
      paymentStatus: detail.payment_status ?? detail.status ?? "—",
      fulfillmentStatus: detail.fulfillment_status ?? "—",
      items: items.map((item) => ({
        key: String(item.id),
        name: typeof item.product_name === "string" ? item.product_name : "",
        quantity: String(Number(item.quantity)),
        price: typeof item.unit_price === "number" ? String(item.unit_price) : "",
        type: typeof item.product_type === "string" ? item.product_type : "",
      })),
      deliveries: (deliveries as unknown as DeliveryLike[]).map((delivery) => ({
        key: String(delivery.public_id ?? ""),
        status: typeof delivery.status === "string" ? delivery.status : "",
        estimate: typeof delivery.estimated_delivery_at === "string" ? delivery.estimated_delivery_at : "—",
        delivered: typeof delivery.delivered_at === "string" ? delivery.delivered_at : "—",
        trackingUrl: typeof delivery.tracking_url === "string" && delivery.tracking_url !== "" ? delivery.tracking_url : null,
        trackingNumber: typeof delivery.tracking_number === "string" && delivery.tracking_number !== "" ? delivery.tracking_number : null,
      })),
      claimable: CLAIMABLE.has(detail.status ?? ""),
      returnable: detail.status === "delivered" && items.some((item) => item.product_type === "physical"),
    };
  } catch {
    return null;
  }
}