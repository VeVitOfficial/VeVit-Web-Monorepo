import Link from "next/link";
import { connection } from "next/server";
import { claimAccountList } from "@/lib/store-claims";
import { getStoreUser } from "@/lib/store-config";
import { AgendaPage, AgendaUnavailable } from "@/components/store/agenda-shell";

export const metadata = { title: "Moje reklamace — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

interface ClaimRow { public_id: unknown; reason_code: unknown; status: unknown }

/** Port of store/claims.php. */
export default async function ClaimsPage() {
  await connection();
  const state = await loadClaims();
  return (
    <AgendaPage title="Moje reklamace">
      {state === "unavailable" ? (
        <AgendaUnavailable message="Seznam všech reklamací vyžaduje ověřenou identitu VeVit Account. Reklamaci konkrétní guest objednávky otevřete bezpečným odkazem." />
      ) : state.length === 0 ? (
        <p className="text-on-surface-variant">Zatím nemáte žádné reklamace.</p>
      ) : state.map((row) => (
        <article className="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4" key={String(row.public_id)}>
          <h2 className="font-h2 text-h2">{String(row.reason_code)}</h2>
          <p>{String(row.status)}</p>
          <Link className="text-primary underline" href={`/store/claim?id=${encodeURIComponent(String(row.public_id))}`}>Detail reklamace</Link>
        </article>
      ))}
    </AgendaPage>
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