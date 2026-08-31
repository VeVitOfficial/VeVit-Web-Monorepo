import {
  agendaJson, agendaPrepareHttp, agendaUser,
} from "@/lib/store-agenda";
import { favoriteList, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";
import { StoreError } from "@/lib/store-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/list.php. Every verb funnels through the gate. */

export async function handler(request: Request): Promise<Response> {
  try {
    agendaPrepareHttp(request, ["GET"]);
    const user = await agendaUser();
    requireFavoriteUser(user);
    const favorites = await favoriteList(user.id);
    return agendaJson({ favorites }, "private, no-store");
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