import { agendaErrorPayload, agendaJson, agendaPrepareHttp } from "@/lib/store-agenda";
import { AgendaDomainError, agendaActorForOrder } from "@/lib/store-order-access";
import { returnDetailPayload, returnGuestOrderPublicId } from "@/lib/store-returns";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/returns/detail.php — every failure flattens to 404. */
async function detail(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    // PHP resolves the actor through the parent order public id first.
    const orderPublicId = await returnGuestOrderPublicId(id);
    const identity = await agendaActorForOrder(orderPublicId);
    const payload = await returnDetailPayload(id, identity);
    return agendaJson({ return: payload }, "private, no-store");
  } catch {
    return agendaErrorPayload(404, "return_unavailable", "Vrácení není k dispozici.");
  }
}

async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["GET"]);
    return await detail(request);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof AgendaDomainError) {
      return agendaErrorPayload(404, "return_unavailable", "Vrácení není k dispozici.");
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