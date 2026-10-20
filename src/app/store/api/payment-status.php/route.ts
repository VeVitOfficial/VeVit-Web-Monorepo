import { getStoreUser, StoreError, storeJsonError, storeRequireMethod } from "@/lib/store-config";
import { readOrderGrant } from "@/lib/store-guest-grants";
import { orderCanAccess, orderRowByPublicId } from "@/lib/store-order-access";
import { jsonResponse, loadPaymentOrderByPublicId } from "@/lib/store-payment-intents";
import "server-only";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Payment state of an order the caller may access. Written by the webhook, only read here. */
async function handler(request: Request): Promise<Response> {
  try {
    storeRequireMethod(request, ["GET"]);
    const publicId = new URL(request.url).searchParams.get("order") ?? "";
    if (!/^[a-f0-9]{32}$/.test(publicId)) storeJsonError(404, "order_unavailable", "Objednávka není dostupná.");

    const user = await getStoreUser();
    const access = await orderRowByPublicId(publicId);
    const grant = await readOrderGrant(publicId);
    if (access === null || !orderCanAccess(access, user !== null ? { id: user.id } : null, grant, publicId)) {
      storeJsonError(404, "order_unavailable", "Objednávka není dostupná.");
    }
    const order = await loadPaymentOrderByPublicId(publicId);
    if (order === null) storeJsonError(404, "order_unavailable", "Objednávka není dostupná.");
    return jsonResponse({ payment_status: order.payment_status, last_payment_error: order.last_payment_error, amount_minor: order.total_minor });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    console.error("[store:payment-status] failure", error instanceof Error ? error.name : "unknown");
    return storeJsonError(503, "payment_unavailable", "Stav platby se nepodařilo zjistit.");
  }
}

export const GET = handler;
export const OPTIONS = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
