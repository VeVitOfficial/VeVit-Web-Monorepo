import Link from "next/link";
import { connection } from "next/server";
import { returnDetailPayload, returnGuestOrderPublicId, returnOrderForCreate } from "@/lib/store-returns";
import { orderDetailForPage } from "@/lib/store-order-page";
import { agendaActorForOrder } from "@/lib/store-order-access";
import { ReturnCreateForm, AgendaMessageForm } from "@/components/store/agenda-forms";

export const metadata = { title: "Vrácení — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const CLOSED = new Set(["rejected", "completed", "cancelled"]);

type CreateState =
  | { mode: "form"; orderId: string; items: { order_item_id: number; name: string; maxQuantity: number }[] }
  | { mode: "unavailable"; message: string };

type DetailState =
  | {
      mode: "detail";
      id: string;
      status: string;
      refundStatus: string;
      items: { key: string; name: string; quantity: string }[];
      events: { state: string; message: string; at: string }[];
    }
  | { mode: "unavailable"; message: string };

interface OrderItemRow { id: number; product_name: string | null; quantity: unknown; product_type: string | null }
interface ItemRow { order_item_id: unknown; requested_quantity: unknown; product_name: unknown }
interface EventRow { new_state?: unknown; action?: unknown; public_message?: unknown; created_at?: unknown }

export default async function ReturnPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const single = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as string[])[0] : raw[key]) ?? "";
  const id = single("id");
  const orderId = single("order");
  const state: CreateState | DetailState = id === "" ? await loadReturnCreate(orderId) : await loadReturnDetail(id);
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>{id !== "" ? "Detail vrácení" : "Nová žádost o vrácení"}</h1></div></div>
      {state.mode === "unavailable" ? <Unavailable message={state.message} /> : state.mode === "form" ? (
        <ReturnCreateForm orderId={state.orderId} items={state.items} />
      ) : (
        <article className="store-form">
          <div className="store-section-head"><h2>Stav: {state.status}</h2></div>
          <p>Refund status: {state.refundStatus}</p>
          <h2>Vrácené položky</h2>
          {state.items.map((item) => (
            <div className="store-cart-item" key={item.key}>
              <span>{item.name} × {item.quantity}</span>
            </div>
          ))}
          <h2>Průběh</h2>
          <ol data-events>
            {state.events.map((event, index) => (
              <li key={index}>
                <strong>{event.state}</strong>
                {event.message !== "" ? <p className="store-eyebrow">{event.message}</p> : null}
                <time className="store-eyebrow">{event.at}</time>
              </li>
            ))}
          </ol>
          {CLOSED.has(state.status) ? null : <AgendaMessageForm endpoint="returns" caseId={state.id} />}
        </article>
      )}
    </main>
  );
}

/** return.php create branch — physical items only. */
async function loadReturnCreate(orderId: string): Promise<CreateState> {
  try {
    const identity = await agendaActorForOrder(orderId);
    await returnOrderForCreate(orderId, identity);
    const order = await orderDetailForPage(orderId);
    return {
      mode: "form",
      orderId,
      items: (order.items as OrderItemRow[])
        .filter((item) => item.product_type === "physical")
        .map((item) => ({ order_item_id: item.id, name: item.product_name ?? "", maxQuantity: Number(item.quantity) })),
    };
  } catch {
    return { mode: "unavailable", message: "Objednávka není dostupná nebo nesplňuje obchodní podmínky vrácení." };
  }
}

async function loadReturnDetail(id: string): Promise<DetailState> {
  try {
    const orderPublicId = await returnGuestOrderPublicId(id);
    const identity = await agendaActorForOrder(orderPublicId);
    const detail = await returnDetailPayload(id, identity);
    const summary = detail.summary as { status?: unknown; refund_status?: unknown };
    const text = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);
    return {
      mode: "detail",
      id,
      status: text(summary.status, ""),
      refundStatus: text(summary.refund_status, ""),
      items: (detail.items as unknown as ItemRow[]).map((item) => ({
        key: String(item.order_item_id),
        name: text(item.product_name, ""),
        quantity: String(Number(item.requested_quantity)),
      })),
      events: (detail.events as unknown as EventRow[]).map((event) => ({
        state: text(event.new_state, "") || text(event.action, "") || "Aktualizace",
        message: text(event.public_message, ""),
        at: text(event.created_at, ""),
      })),
    };
  } catch {
    return { mode: "unavailable", message: "Žádost o vrácení není dostupná." };
  }
}

function Unavailable({ message }: { message: string }) {
  return (
    <section className="store-form" role="status">
      <h2>Funkce je dočasně nedostupná</h2>
      <p>{message}</p>
      <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
    </section>
  );
}