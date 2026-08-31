import { agendaErrorPayload, agendaJson, agendaPrepareHttp } from "@/lib/store-agenda";
import { AgendaDomainError, agendaActorForOrder } from "@/lib/store-order-access";
import { claimDetailPayload, claimGuestOrderPublicId } from "@/lib/store-claims";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/claims/detail.php — every failure flattens to 404. */
async function detail(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    // PHP resolves the actor through the parent order public id first.
    const orderPublicId = await claimGuestOrderPublicId(id);
    const identity = await agendaActorForOrder(orderPublicId);
    const payload = await claimDetailPayload(id, identity);
    return agendaJson({ claim: payload }, "private, no-store");
  } catch {
    return agendaErrorPayload(404, "claim_unavailable", "Reklamace není k dispozici.");
  }
}

async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["GET"]);
    return await detail(request);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (error instanceof AgendaDomainError) {
      return agendaErrorPayload(404, "claim_unavailable", "Reklamace není k dispozici.");
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