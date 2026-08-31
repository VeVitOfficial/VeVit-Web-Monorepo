import { connection } from "next/server";
import { returnDetailPayload, returnGuestOrderPublicId, returnOrderForCreate } from "@/lib/store-returns";
import { orderDetailForPage } from "@/lib/store-order-page";
import { agendaActorForOrder } from "@/lib/store-order-access";
import { ReturnCreateForm, AgendaMessageForm } from "@/components/store/agenda-forms";
import { AgendaPage, AgendaUnavailable, AgendaTimeline } from "@/components/store/agenda-shell";

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
    <AgendaPage title={id !== "" ? "Detail vrácení" : "Nová žádost o vrácení"}>
      {state.mode === "unavailable" ? (
        <AgendaUnavailable message={state.message} />
      ) : state.mode === "form" ? (
        <ReturnCreateForm orderId={state.orderId} items={state.items} />
      ) : (
        <article className="bg-surface-container border border-outline-variant rounded-xl p-6">
          <h2 className="font-h2 text-h2">Stav: {state.status}</h2>
          <p className="mt-3">Refund status: {state.refundStatus}</p>
          <h3 className="font-h2 text-h2 mt-7">Vrácené položky</h3>
          <ul className="divide-y divide-outline-variant">
            {state.items.map((item) => (
              <li className="py-3" key={item.key}>{item.name} × {item.quantity}</li>
            ))}
          </ul>
          <h3 className="font-h2 text-h2 mt-7">Průběh</h3>
          <AgendaTimeline events={state.events} />
          {CLOSED.has(state.status) ? null : <AgendaMessageForm endpoint="returns" caseId={state.id} />}
        </article>
      )}
    </AgendaPage>
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