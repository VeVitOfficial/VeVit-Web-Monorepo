import Link from "next/link";
import { connection } from "next/server";
import { claimAccountList } from "@/lib/store-claims";
import { getStoreUser } from "@/lib/store-config";

export const metadata = { title: "Moje reklamace — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

interface ClaimRow { public_id: unknown; reason_code: unknown; status: unknown }

/** Port of store/claims.php. */
export default async function ClaimsPage() {
  await connection();
  const state = await loadClaims();
  return (
    <main className="store-main">
      <div className="store-section-head"><div><p className="store-eyebrow">Zákaznická agenda</p><h1>Moje reklamace</h1></div></div>
      {state === "unavailable" ? (
        <section className="store-form" role="status">
          <h2>Funkce je dočasně nedostupná</h2>
          <p>Seznam všech reklamací vyžaduje ověřenou identitu VeVit Account. Reklamaci konkrétní guest objednávky otevřete bezpečným odkazem.</p>
          <Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>
        </section>
      ) : state.length === 0 ? (
        <p className="store-eyebrow">Zatím nemáte žádné reklamace.</p>
      ) : state.map((row) => (
        <article className="store-form" key={String(row.public_id)}>
          <h2>{String(row.reason_code)}</h2>
          <p>{String(row.status)}</p>
          <Link className="store-button" href={`/store/claim?id=${encodeURIComponent(String(row.public_id))}`}>Detail reklamace</Link>
        </article>
      ))}
    </main>
  );
}

async function loadClaims(): Promise<ClaimRow[] | "unavailable"> {
  try {
    const user = await getStoreUser();
    if (user === null || user.id === "") return "unavailable";
    return (await claimAccountList(user.id)) as unknown as ClaimRow[];
  } catch {
    return "unavailable";
  }
}