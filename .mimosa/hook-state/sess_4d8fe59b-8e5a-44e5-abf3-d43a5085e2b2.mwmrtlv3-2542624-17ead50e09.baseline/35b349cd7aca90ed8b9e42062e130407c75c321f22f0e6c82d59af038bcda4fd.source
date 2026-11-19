import {
  agendaJson, agendaJsonInput, agendaPrepareHttp, agendaRateLimit, agendaRateLimitIdentity, agendaUser,
} from "@/lib/store-agenda";
import { favoriteAdd, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";
import { phpIntCast } from "@/lib/store-order-core";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/add.php (PHP-session CSRF replaced by the same-origin origin gate). */

export async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["POST"]);
    const input = await agendaJsonInput(request);
    const user = await agendaUser();
    await agendaRateLimit("favorite_mutation", agendaRateLimitIdentity(request, user), 20);
    requireFavoriteUser(user);
    const productId = phpIntCast(input.product_id ?? 0);
    if (productId < 1) throw new Error("Invalid product.");
    await favoriteAdd(user.id, productId);
    return agendaJson({ favorite: true });
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