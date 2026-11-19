import {
  agendaJson, agendaJsonInput, agendaPrepareHttp, agendaRateLimit, agendaRateLimitIdentity, agendaUser,
} from "@/lib/store-agenda";
import { favoriteRemove, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";
import { phpIntCast } from "@/lib/store-order-core";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/remove.php (PHP-session CSRF replaced by the same-origin origin gate). */

export async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["DELETE", "POST"]);
    const input = await agendaJsonInput(request);
    const user = await agendaUser();
    await agendaRateLimit("favorite_mutation", agendaRateLimitIdentity(request, user), 20);
    requireFavoriteUser(user);
    const productId = phpIntCast(input.product_id ?? 0);
    await favoriteRemove(user.id, productId);
    return agendaJson({ favorite: false });
  } catch (error) {
    if (error instanceof StoreError) return error.response;
    return favoritesAgendaError(error);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;