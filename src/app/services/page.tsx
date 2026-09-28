import type { Metadata } from "next";
import { connection } from "next/server";
import { listCategories, listOpenRequests, offerCounts, renderTime } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { ago, budgetLabel, placeLabel } from "@/components/services/ui";

export const metadata: Metadata = {
  title: "VeVit Services – poptávky a služby",
  description: "Zadejte poptávku po službě nebo nabídněte svou pomoc: weby, grafika, doučování, texty, domácnost.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 60) ?? "";
}

export default async function ServicesHomePage({ searchParams }: Props) {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const query = await searchParams;
  const filters = { category: param(query.kategorie), city: param(query.mesto), q: param(query.q), remote: param(query.dalku) === "1" };
  const [categories, requests] = await Promise.all([listCategories(), listOpenRequests(filters)]);
  const requestedAt = renderTime();
  const counts = await offerCounts(requests.map((request) => request.id));
  const names = new Map(categories.map((category) => [category.slug, category.name_cs]));

  return (
    <>
      <section className="svc-hero svc-spread">
        <div>
          <p className="svc-eyebrow">VeVit Services · beta</p>
          <h1 className="svc-h1">Najděte pomoc, nebo ji nabídněte</h1>
          <p className="svc-lead">Popište, co potřebujete, a poskytovatelé vám pošlou nabídky. Vyberete si jednu, domluvíte se ve zprávách a po dokončení se navzájem ohodnotíte.</p>
        </div>
        <div className="svc-row">
          <a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova`}>Zadat poptávku</a>
          <a className="svc-btn" href={`${base}/profil`}>Nabízet služby</a>
        </div>
      </section>

      <form className="svc-filters" method="get" role="search" aria-label="Filtr poptávek">
        <input className="svc-input" name="q" defaultValue={filters.q} placeholder="Hledat v názvech poptávek" aria-label="Hledat" />
        <select className="svc-select" name="kategorie" defaultValue={filters.category} aria-label="Kategorie">
          <option value="">Všechny kategorie</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name_cs}</option>)}
        </select>
        <input className="svc-input" name="mesto" defaultValue={filters.city} placeholder="Město" aria-label="Město" />
        <label className="svc-check"><input type="checkbox" name="dalku" value="1" defaultChecked={filters.remote} /> Na dálku</label>
        <button className="svc-btn" type="submit">Filtrovat</button>
      </form>

      {requests.length === 0 ? (
        <div className="svc-empty">
          <p>Žádná otevřená poptávka neodpovídá filtru.</p>
          <p style={{ marginTop: 12 }}><a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova`}>Zadat první poptávku</a></p>
        </div>
      ) : (
        <div className="svc-grid">
          {requests.map((request) => (
            <a key={request.id} className="svc-card svc-card--link" href={`${base}/poptavka/${request.id}`}>
              <span className="svc-badge svc-badge--cat">{names.get(request.category) ?? request.category}</span>
              <h3>{request.title}</h3>
              <p className="svc-clamp">{request.description}</p>
              <div className="svc-meta">
                <span>{placeLabel(request.city, request.remote)}</span>
                <span>{budgetLabel(request.budget_min, request.budget_max)}</span>
                <span>{counts.get(request.id) ?? 0} nabídek</span>
                <span>{ago(request.created_at, requestedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
