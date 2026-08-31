import Link from "next/link";
import { connection } from "next/server";
import { orderPageData } from "@/lib/store-order-page";
import { AgendaPage, AgendaUnavailable } from "@/components/store/agenda-shell";

export const metadata = { title: "Detail objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const CLAIMABLE = new Set(["paid", "processing", "shipped", "delivered"]);

export default async function OrderDetailPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const single = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as string[])[0] : raw[key]) ?? "";
  const id = single("id");
  const state = await loadOrder(id);
  if (state === null) {
    return (
      <AgendaPage title="Detail objednávky">
        <AgendaUnavailable message="Objednávka není dostupná. Otevřete ji pouze přes původní bezpečný odkaz." />
      </AgendaPage>
    );
  }
  return (
    <AgendaPage title="Detail objednávky">
      <section className="grid lg:grid-cols-3 gap-5">
        <article className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-6">
          <h2 className="font-h2 text-h2">{state.orderNumber}</h2>
          <dl className="grid sm:grid-cols-2 gap-3 mt-4">
            <div>
              <dt className="text-on-surface-variant">Platba</dt>
              <dd>{state.paymentStatus}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Fulfilment</dt>
              <dd>{state.fulfillmentStatus}</dd>
            </div>
          </dl>
          <h3 className="font-h2 text-h2 mt-7">Položky</h3>
          <ul className="divide-y divide-outline-variant">
            {state.items.map((item) => (
              <li className="py-4 flex justify-between gap-4" key={item.key}>
                <span>{item.name} × {item.quantity}</span>
                <span>{item.price} {state.currency}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-h2 text-h2 mt-7">Doručení</h3>
          {state.deliveries.length === 0 ? (
            <p className="text-on-surface-variant mt-2">Zásilka zatím nebyla založena.</p>
          ) : state.deliveries.map((delivery) => (
            <div className="mt-3 border border-outline-variant rounded-lg p-4" key={delivery.key}>
              <strong>{delivery.status}</strong>
              <p className="text-on-surface-variant">Odhad: {delivery.estimate} · Doručeno: {delivery.delivered}</p>
              {delivery.trackingUrl !== null ? (
                <a className="text-primary underline" rel="noopener noreferrer" href={delivery.trackingUrl}>Sledovat zásilku</a>
              ) : delivery.trackingNumber !== null ? (
                <p>Tracking: {delivery.trackingNumber}</p>
              ) : null}
            </div>
          ))}
        </article>
        <aside className="bg-surface-container border border-outline-variant rounded-xl p-6">
          <h2 className="font-h2 text-h2">Další kroky</h2>
          {state.claimable ? (
            <Link className="btn btn-primary w-full justify-center mt-4" href={`/store/claim?order=${encodeURIComponent(id)}`}>Založit reklamaci</Link>
          ) : null}
          {state.returnable ? (
            <Link className="btn btn-outline w-full justify-center mt-3" href={`/store/return?order=${encodeURIComponent(id)}`}>Požádat o vrácení</Link>
          ) : null}
        </aside>
      </section>
    </AgendaPage>
  );
}

interface ItemRow { id: unknown; product_name: unknown; quantity: unknown; unit_price: unknown; product_type: unknown }
interface DeliveryLike { public_id: unknown; status: unknown; estimated_delivery_at: unknown; delivered_at: unknown; tracking_url: unknown; tracking_number: unknown }

async function loadOrder(id: string) {
  try {
    const { detail, deliveries } = await orderPageData(id);
    const items = detail.items as unknown as ItemRow[];
    return {
      orderNumber: detail.order_number,
      status: detail.status ?? "",
      currency: (detail.currency ?? "").toUpperCase(),
      paymentStatus: detail.payment_status ?? detail.status ?? "—",
      fulfillmentStatus: detail.fulfillment_status ?? "—",
      items: items.map((item) => ({
        key: String(item.id),
        name: typeof item.product_name === "string" ? item.product_name : "",
        quantity: String(Number(item.quantity)),
        price: typeof item.unit_price === "number" ? String(item.unit_price) : "",
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