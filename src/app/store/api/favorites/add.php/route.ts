import {
  agendaJson, agendaJsonInput, agendaPrepareHttp, agendaRateLimit, agendaRateLimitIdentity, agendaUser,
} from "@/lib/store-agenda";
import { favoriteAdd, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/add.php (PHP-session CSRF replaced by the same-origin origin gate). */

function phpIntCast(value: unknown): number {
  if (typeof value === "number") return Math.trunc(value);
  const match = /^[+-]?\d+/.exec(String(value ?? "").trim());
  const parsed = match !== null ? Number.parseInt(match[0], 10) : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function handler(request: Request): Promise<Response> {
  agendaPrepareHttp(request, ["POST"]);
  const input = await agendaJsonInput(request);
  const user = await agendaUser();
  try {
    await agendaRateLimit("favorite_mutation", agendaRateLimitIdentity(request, user), 20);
    requireFavoriteUser(user);
    const productId = phpIntCast(input.product_id ?? 0);
    if (productId < 1) throw new Error("Invalid product.");
    await favoriteAdd(user.id, productId);
    return agendaJson({ favorite: true });
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