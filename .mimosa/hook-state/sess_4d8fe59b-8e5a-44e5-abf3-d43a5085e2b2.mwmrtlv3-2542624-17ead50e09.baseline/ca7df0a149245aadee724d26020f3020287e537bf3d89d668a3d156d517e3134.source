import "server-only";

import type { StoreUser } from "@/lib/store-config";
import { storeRest, storeRestSelect } from "@/lib/store-config";
import { agendaVerifiedAccountError } from "@/lib/store-agenda";

/**
 * Port of store/lib/favorites/FavoriteService.php + FavoriteRepository.php.
 * The PHP identity requirement (requireUserId — 401 verified_account_required
 * via the route's catch(Throwable)) is enforced through the account session.
 * In the PHP deployment every request reaches the 401 because the account S2S
 * contract was never wired in AuthContextFactory; the account session is the
 * real contract in this infrastructure.
 */

export const FAVORITES_ERROR = "Oblíbené produkty vyžadují ověřené přihlášení.";

export interface FavoriteProductRow {
  id: number;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  images: string[] | string | null;
  created_at: string;
}

export type FavoriteUser = NonNullable<StoreUser>;

/** FavoriteService::requireUserId — throws on missing identity (narrowed via assertion). */
export function requireFavoriteUser(user: StoreUser): asserts user is FavoriteUser {
  if (user === null || user.id === "") throw new Error("Verified account required.");
}

/** FavoriteRepository::list() — favorites joined with active products, newest first. */
export async function favoriteList(userId: string): Promise<FavoriteProductRow[]> {
  // Parity note vs PHP: PDO returned `images` as a raw JSON string (json_encode
  // emitted the literal column text), while PostgREST decodes it as an array —
  // same value, better-typed payload for the store UI.
  const rows = await storeRestSelect<{ product_id: number; created_at: string }>(
    "store_product_favorites",
    `select=product_id,created_at&user_id=eq.${userId}&order=created_at.desc`,
  );
  const ids = [...new Set(rows.map((row) => row.product_id))];
  if (ids.length === 0) return [];
  const products = await storeRestSelect<FavoriteProductRow>(
    "store_products",
    `select=id,name,slug,price,sale_price,images&is_active=eq.true&id=in.(${ids.join(",")})`,
  );
  const byId = new Map(products.map((product) => [product.id, product]));
  const list: FavoriteProductRow[] = [];
  for (const row of rows) {
    const product = byId.get(row.product_id);
    if (product !== undefined) list.push({ ...product, created_at: row.created_at });
  }
  return list;
}

/**
 * FavoriteRepository::add() — INSERT ... SELECT active products only, then the
 * "Product unavailable." rejection when the product id is unknown/inactive.
 * INSERT SELECT + ON CONFLICT DO NOTHING over PostgREST: an active-product
 * probe first, then an upsert that keeps the (user_id, product_id) PK idempotent.
 */
export async function favoriteAdd(userId: string, productId: number): Promise<void> {
  const active = await storeRestSelect<{ id: number }>(
    "store_products",
    `select=id&is_active=eq.true&id=eq.${productId}&limit=1`,
  );
  if (active.length === 0) throw new Error("Product unavailable.");
  await storeRest("POST", "store_product_favorites", {
    body: { user_id: userId, product_id: productId },
    prefer: "resolution=ignore-duplicates",
  });
}

/** FavoriteRepository::remove(). */
export async function favoriteRemove(userId: string, productId: number): Promise<void> {
  await storeRest("DELETE", "store_product_favorites", {
    query: `user_id=eq.${userId}&product_id=eq.${productId}`,
    // return=minimal → 204 even when nothing matched (PHP ignores rowCount).
    prefer: "return=minimal",
  });
}

/**
 * The PHP routes' catch(Throwable) flattens unauthenticated identities, invalid
 * products, rate-limit exhaustion AND database failures into the same 401.
 */
export function favoritesAgendaError(error: unknown): Response {
  void error;
  return agendaVerifiedAccountError(FAVORITES_ERROR);
}