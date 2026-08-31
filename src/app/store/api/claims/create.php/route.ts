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
import { AgendaDomainError, agendaActorForOrder, type AgendaIdentity } from "@/lib/store-order-access";
import { claimCreate } from "@/lib/store-claims";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/claims/create.php (PHP-session CSRF replaced by the
 * same-origin origin gate). Identity resolution failure answers
 * 404 order_unavailable; a rejected claim is 422 claim_rejected.
 */
async function handler(request: Request): Promise<Response> {
  let identity: AgendaIdentity;
  try {
    agendaPrepareHttp(request, ["POST"]);
    const input = await agendaJsonInput(request);
    const user = await agendaUser();
    const orderPublicId = String(input.order ?? "");
    try {
      identity = await agendaActorForOrder(orderPublicId);
    } catch (error) {
      if (error instanceof AgendaDomainError) {
        return agendaErrorPayload(404, "order_unavailable", "Objednávka není k dispozici.");
      }
      throw error;
    }
    await agendaRateLimit("claim_create", agendaRateLimitIdentity(request, user), 5);
    const claim = await claimCreate(orderPublicId, identity, request.headers.get("idempotency-key") ?? "", input);
    return agendaJson({ claim: { id: claim.publicId, status: claim.status } }, "no-store", 201);
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    if (isStoreRateLimitError(error)) {
      return agendaErrorPayload(429, "rate_limited", "Příliš mnoho požadavků.", { "Retry-After": String(error.retryAfter) });
    }
    // PHP catches DomainException only; infrastructure failures stay 500.
    if (error instanceof AgendaDomainError) return agendaErrorPayload(422, "claim_rejected", "Reklamaci nelze založit.");
    throw error;
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;