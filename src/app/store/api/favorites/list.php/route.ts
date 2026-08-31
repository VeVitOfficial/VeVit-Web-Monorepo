import {
  agendaJson, agendaPrepareHttp, agendaUser,
} from "@/lib/store-agenda";
import { favoriteList, favoritesAgendaError, requireFavoriteUser } from "@/lib/store-favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Port of store/api/favorites/list.php. Every verb funnels through the gate. */

async function handler(request: Request): Promise<Response> {
  agendaPrepareHttp(request, ["GET"]);
  const user = await agendaUser();
  try {
    requireFavoriteUser(user);
    const favorites = await favoriteList(user.id);
    return agendaJson({ favorites }, "private, no-store");
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