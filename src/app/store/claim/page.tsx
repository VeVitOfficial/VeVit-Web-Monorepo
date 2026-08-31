import Link from "next/link";
import { connection } from "next/server";
import { claimDetailPayload, claimGuestOrderPublicId, claimOrderForCreate } from "@/lib/store-claims";
import { orderDetailForPage } from "@/lib/store-order-page";
import { agendaActorForOrder } from "@/lib/store-order-access";
import { ClaimCreateForm, AgendaMessageForm } from "@/components/store/agenda-forms";

export const metadata = { title: "Reklamace — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const CLOSED = new Set(["rejected", "resolved", "cancelled"]);

type CreateState =
  | { mode: "form"; orderId: string; items: { order_item_id: number; name: string; maxQuantity: number }[] }
  | { mode: "unavailable"; message: string };

type DetailState =
  | {
      mode: "detail";
      id: string;
      status: string;
      problem: string;
      items: { key: string; name: string; quantity: string }[];
      events: { state: string; message: string; at: string }[];
    }
  | { mode: "unavailable"; message: string };

interface OrderItemRow { id: number; product_name: string | null; quantity: unknown }
interface ItemRow { order_item_id: unknown; requested_quantity: unknown; product_name: unknown }
interface EventRow { new_state?: unknown; action?: unknown; public_message?: unknown; created_at?: unknown }

export default async function ClaimPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const single = (key: string) => (Array.isArray(raw[key]) ? (raw[key] as string[])[0] : raw[key]) ?? "";
  const id = single("id");
  const orderId = single("order");
  const state: CreateState | DetailState = id === "" ? await loadClaimCreate(orderId) : await loadClaimDetail(id);
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>{id !== "" ? "Detail reklamace" : "Nová reklamace"}</h1></div></div>
      {state.mode === "unavailable" ? <Unavailable message={state.message} /> : state.mode === "form" ? (
        <ClaimCreateForm orderId={state.orderId} items={state.items} />
      ) : (
        <article className="store-form">
          <div className="store-section-head"><h2>Stav: {state.status}</h2></div>
          <p>{state.problem}</p>
          <h2>Reklamované položky</h2>
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
          {CLOSED.has(state.status) ? null : <AgendaMessageForm endpoint="claims" caseId={state.id} />}
        </article>
      )}
    </main>
  );
}

/** claim.php create branch — orderForCreate validation + the item picker. */
async function loadClaimCreate(orderId: string): Promise<CreateState> {
  try {
    const identity = await agendaActorForOrder(orderId);
    await claimOrderForCreate(orderId, identity);
    const order = await orderDetailForPage(orderId);
    return {
      mode: "form",
      orderId,
      items: (order.items as OrderItemRow[]).map((item) => ({ order_item_id: item.id, name: item.product_name ?? "", maxQuantity: Number(item.quantity) })),
    };
  } catch {
    return { mode: "unavailable", message: "Objednávka není dostupná nebo zatím nesplňuje podmínky reklamace." };
  }
}

/** claim.php detail branch. */
async function loadClaimDetail(id: string): Promise<DetailState> {
  try {
    const orderPublicId = await claimGuestOrderPublicId(id);
    const identity = await agendaActorForOrder(orderPublicId);
    const detail = await claimDetailPayload(id, identity);
    const summary = detail.summary as { status?: unknown; problem_description?: unknown };
    const text = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);
    return {
      mode: "detail",
      id,
      status: text(summary.status, ""),
      problem: text(summary.problem_description, ""),
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
    return { mode: "unavailable", message: "Reklamace není dostupná." };
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