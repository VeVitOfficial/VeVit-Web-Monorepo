import Link from "next/link";
import { connection } from "next/server";
import { favoriteList } from "@/lib/store-favorites";
import { getStoreUser } from "@/lib/store-config";
import { FavoriteRemoveButton } from "@/components/store/agenda-forms";
import { AgendaPage, AgendaUnavailable } from "@/components/store/agenda-shell";

export const metadata = { title: "Oblíbené produkty — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Port of store/favorites.php. */
export default async function FavoritesPage() {
  await connection();
  const state = await loadFavorites();
  return (
    <AgendaPage title="Oblíbené produkty">
      {state === "unavailable" ? (
        <AgendaUnavailable message="Oblíbené produkty budou dostupné až po dokončení ověřeného serverového kontraktu VeVit Account." />
      ) : state.length === 0 ? (
        <p className="text-on-surface-variant">Zatím nemáte žádné oblíbené produkty.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {state.map((item) => (
            <article className="bg-surface-container border border-outline-variant rounded-xl p-5" key={item.id}>
              <h2 className="font-h2 text-h2">{item.name}</h2>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link className="btn btn-primary" href={`/store/product/${encodeURIComponent(item.slug)}`}>Zobrazit produkt</Link>
                <FavoriteRemoveButton productId={item.id} name={item.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </AgendaPage>
  );
}

type FavoriteItem = { id: number; name: string; slug: string };

async function loadFavorites(): Promise<FavoriteItem[] | "unavailable"> {
  try {
    const user = await getStoreUser();
    if (user === null || user.id === "") return "unavailable";
    return (await favoriteList(user.id)).map((item) => ({ id: item.id, name: item.name, slug: item.slug }));
  } catch {
    return "unavailable";
  }
}