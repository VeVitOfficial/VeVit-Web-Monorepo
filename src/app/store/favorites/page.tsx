import Link from "next/link";
import { connection } from "next/server";
import { favoriteList } from "@/lib/store-favorites";
import { getStoreUser } from "@/lib/store-config";
import { FavoriteRemoveButton } from "@/components/store/agenda-forms";

export const metadata = { title: "Oblíbené produkty — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Port of store/favorites.php. */
export default async function FavoritesPage() {
  await connection();
  const state = await loadFavorites();
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>Oblíbené produkty</h1></div></div>
      {state === "unavailable" ? (
        <section className="store-form" role="status">
          <h2>Funkce je dočasně nedostupná</h2>
          <p>Oblíbené produkty budou dostupné až po dokončení ověřeného serverového kontraktu VeVit Account.</p>
          <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
        </section>
      ) : state.length === 0 ? (
        <p className="store-eyebrow">Zatím nemáte žádné oblíbené produkty.</p>
      ) : (
        <div className="store-grid">
          {state.map((item) => (
            <article className="store-form" key={item.id}>
              <h2>{item.name}</h2>
              <div className="store-actions">
                <Link className="store-button primary" href={`/store/product/${encodeURIComponent(item.slug)}`}>Zobrazit produkt</Link>
                <FavoriteRemoveButton productId={item.id} name={item.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
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