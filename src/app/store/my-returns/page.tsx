import Link from "next/link";
import { connection } from "next/server";
import { returnAccountList } from "@/lib/store-returns";
import { getStoreUser } from "@/lib/store-config";

export const metadata = { title: "Moje vrácení — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

interface ReturnRow { public_id: unknown; reason_code: unknown; status: unknown; refund_status: unknown }

/** Port of store/my-returns.php. */
export default async function MyReturnsPage() {
  await connection();
  const state = await loadReturns();
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>Moje vrácení</h1></div></div>
      {state === "unavailable" ? (
        <section className="store-form" role="status">
          <h2>Funkce je dočasně nedostupná</h2>
          <p>Seznam všech vrácení vyžaduje ověřenou identitu VeVit Account. Konkrétní žádost otevřete přes zabezpečenou objednávku.</p>
          <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
        </section>
      ) : state.length === 0 ? (
        <p className="store-eyebrow">Zatím nemáte žádná vrácení.</p>
      ) : state.map((row) => (
        <article className="store-form" key={String(row.public_id)}>
          <h2>{String(row.reason_code)}</h2>
          <p>{String(row.status)} · refund: {String(row.refund_status)}</p>
          <Link className="store-button" href={`/store/return?id=${encodeURIComponent(String(row.public_id))}`}>Detail vrácení</Link>
        </article>
      ))}
    </main>
  );
}

async function loadReturns(): Promise<ReturnRow[] | "unavailable"> {
  try {
    const user = await getStoreUser();
    if (user === null || user.id === "") return "unavailable";
    return (await returnAccountList(user.id)) as unknown as ReturnRow[];
  } catch {
    return "unavailable";
  }
}