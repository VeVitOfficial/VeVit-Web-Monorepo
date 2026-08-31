import {
  agendaJson, agendaJsonInput, agendaPrepareHttp, agendaRateLimit, agendaRateLimitIdentity, agendaUser,
} from "@/lib/store-agenda";
import { favoriteRemove, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/remove.php (PHP-session CSRF replaced by the same-origin origin gate). */

function phpIntCast(value: unknown): number {
  if (typeof value === "number") return Math.trunc(value);
  const match = /^[+-]?\d+/.exec(String(value ?? "").trim());
  const parsed = match !== null ? Number.parseInt(match[0], 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function handler(request: Request): Promise<Response> {
  agendaPrepareHttp(request, ["DELETE", "POST"]);
  const input = await agendaJsonInput(request);
  const user = await agendaUser();
  try {
    await agendaRateLimit("favorite_mutation", agendaRateLimitIdentity(request, user), 20);
    requireFavoriteUser(user);
    const productId = phpIntCast(input.product_id ?? 0);
    await favoriteRemove(user.id, productId);
    return agendaJson({ favorite: false });
  } catch (error) {
    return favoritesAgendaError(error);
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;