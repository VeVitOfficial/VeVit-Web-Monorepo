import Link from "next/link";
import { connection } from "next/server";
import { returnAccountList } from "@/lib/store-returns";
import { getStoreUser } from "@/lib/store-config";
import { AgendaPage, AgendaUnavailable } from "@/components/store/agenda-shell";

export const metadata = { title: "Moje vrácení — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

interface ReturnRow { public_id: unknown; reason_code: unknown; status: unknown; refund_status: unknown }

/** Port of store/my-returns.php. */
export default async function MyReturnsPage() {
  await connection();
  const state = await loadReturns();
  return (
    <AgendaPage title="Moje vrácení">
      {state === "unavailable" ? (
        <AgendaUnavailable message="Seznam všech vrácení vyžaduje ověřenou identitu VeVit Account. Konkrétní žádost otevřete přes zabezpečenou objednávku." />
      ) : state.length === 0 ? (
        <p className="text-on-surface-variant">Zatím nemáte žádná vrácení.</p>
      ) : state.map((row) => (
        <article className="bg-surface-container border border-outline-variant rounded-xl p-5 mb-4" key={String(row.public_id)}>
          <h2 className="font-h2 text-h2">{String(row.reason_code)}</h2>
          <p>{String(row.status)} · refund: {String(row.refund_status)}</p>
          <Link className="text-primary underline" href={`/store/return?id=${encodeURIComponent(String(row.public_id))}`}>Detail vrácení</Link>
        </article>
      ))}
    </AgendaPage>
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