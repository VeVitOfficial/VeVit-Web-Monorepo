import { agendaErrorPayload, agendaJson, agendaPrepareHttp } from "@/lib/store-agenda";
import { AgendaDomainError, agendaActorForOrder, orderRowByPublicId } from "@/lib/store-order-access";
import { deliveryCustomerDetail } from "@/lib/store-delivery";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/delivery/detail.php — every failure flattens to 404. */
async function detail(request: Request): Promise<Response> {
  const orderPublicId = new URL(request.url).searchParams.get("order") ?? "";
  try {
    // CustomerOrderService::rawOrderForAuthorizedDelivery — existence check only,
    // authorization happens in deliveryCustomerDetail (canAccess).
    const order = await orderRowByPublicId(orderPublicId);
    if (order === null) throw new AgendaDomainError("Delivery unavailable.");
    const identity = await agendaActorForOrder(orderPublicId);
    const deliveries = await deliveryCustomerDetail(orderPublicId, identity, order);
    return agendaJson({ deliveries }, "private, no-store");
  } catch {
    return agendaErrorPayload(404, "delivery_unavailable", "Doručení není k dispozici.");
  }
}

async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["GET"]);
    return await detail(request);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof AgendaDomainError) {
      return agendaErrorPayload(404, "delivery_unavailable", "Doručení není k dispozici.");
    }
    throw error;
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;