import { connection } from "next/server";
import { claimDetailPayload, claimGuestOrderPublicId, claimOrderForCreate } from "@/lib/store-claims";
import { orderDetailForPage } from "@/lib/store-order-page";
import { agendaActorForOrder } from "@/lib/store-order-access";
import { ClaimCreateForm, AgendaMessageForm } from "@/components/store/agenda-forms";
import { AgendaPage, AgendaUnavailable, AgendaTimeline } from "@/components/store/agenda-shell";

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
    <AgendaPage title={id !== "" ? "Detail reklamace" : "Nová reklamace"}>
      {state.mode === "unavailable" ? (
        <AgendaUnavailable message={state.message} />
      ) : state.mode === "form" ? (
        <ClaimCreateForm orderId={state.orderId} items={state.items} />
      ) : (
        <article className="bg-surface-container border border-outline-variant rounded-xl p-6">
          <h2 className="font-h2 text-h2">Stav: {state.status}</h2>
          <p className="mt-3">{state.problem}</p>
          <h3 className="font-h2 text-h2 mt-7">Reklamované položky</h3>
          <ul className="divide-y divide-outline-variant">
            {state.items.map((item) => (
              <li className="py-3" key={item.key}>{item.name} × {item.quantity}</li>
            ))}
          </ul>
          <h3 className="font-h2 text-h2 mt-7">Průběh</h3>
          <AgendaTimeline events={state.events} />
          {CLOSED.has(state.status) ? null : <AgendaMessageForm endpoint="claims" caseId={state.id} />}
        </article>
      )}
    </AgendaPage>
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