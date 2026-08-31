import {
  agendaErrorPayload,
  agendaJson,
  agendaJsonInput,
  agendaPrepareHttp,
  agendaRateLimit,
  agendaRateLimitIdentity,
  agendaUser,
  isStoreRateLimitError,
} from "@/lib/store-agenda";
import { agendaActorForOrder } from "@/lib/store-order-access";
import { returnAddCustomerMessage, returnGuestOrderPublicId } from "@/lib/store-returns";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/returns/message.php — non-rate-limit failures flatten to 422. */
async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["POST"]);
    const input = await agendaJsonInput(request);
    const user = await agendaUser();
    await agendaRateLimit("return_message", agendaRateLimitIdentity(request, user), 20);
    const id = String(input.id ?? "");
    const orderPublicId = await returnGuestOrderPublicId(id);
    const identity = await agendaActorForOrder(orderPublicId);
    const event = await returnAddCustomerMessage(id, identity, String(input.message ?? ""), request.headers.get("idempotency-key") ?? "");
    return agendaJson({ event: { id: event.public_id } }, "no-store", 201);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (isStoreRateLimitError(error)) {
      return agendaErrorPayload(429, "rate_limited", "Příliš mnoho požadavků.", { "Retry-After": String(error.retryAfter) });
    }
    return agendaErrorPayload(422, "message_rejected", "Zprávu nelze uložit.");
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;