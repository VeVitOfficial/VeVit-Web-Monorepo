import type { Metadata } from "next";
import { connection } from "next/server";
import { bookmarkedIds, categoryCounts, expireRequests, listCategories, renderTime, viewer } from "@/lib/services";
import { describeFilters, filterChips, filtersToQuery, hasActiveFilters, parseRequestFilters, searchRequests } from "@/lib/services-search";
import { servicesLocale } from "@/lib/services-locale";
import { regionLabel } from "@/components/services/constants";
import { categoryTree } from "@/components/services/categories";
import { SvcIcon } from "@/components/services/icons";
import { RequestCard } from "@/components/services/request-card";
import { FilterForm } from "@/components/services/filter-form";
import { SaveSearchButton } from "@/components/services/interactive";
import { SORTS, PAGE_SIZE } from "@/components/services/constants";
import { plural } from "@/components/services/ui";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 60) : "";
  return {
    title: q ? `Poptávky „${q}“ – VeVit Services` : "Poptávky a zakázky – VeVit Services",
    description: "Otevřené poptávky po službách: weby, grafika, řemesla, úklid, doučování a další. Filtrujte podle města, vzdálenosti a typu práce.",
  };
}

export default async function RequestsPage({ searchParams }: Props) {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const [categories, session] = await Promise.all([listCategories(), viewer()]);
  const filters = parseRequestFilters(await searchParams, categories);
  await expireRequests();
  const [{ items, total }, counts, saved] = await Promise.all([
    searchRequests(filters, categories),
    categoryCounts(categories),
    session ? bookmarkedIds(session.user.id) : Promise.resolve(new Set<string>()),
  ]);
  const now = renderTime();
  const chips = filterChips(filters, categories);
  const query = filtersToQuery({ ...filters, page: 1 });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selfHref = (page: number) => {
    const qs = filtersToQuery(filters, { page });
    return `${base}/poptavky${qs ? `?${qs}` : ""}`;
  };
  const loginHref = (target: string) => `/${locale}/account/login?return_to=${encodeURIComponent(target)}`;
  const currentHref = `${base}/poptavky${query ? `?${query}` : ""}`;
  const activeCount = chips.length;
  const where = filters.city ? `${filters.city.name} + ${filters.radius} km` : filters.region ? regionLabel(filters.region) : "";

  return (
    <div className="svc-results">
      <FilterForm
        id="svc-filter-form"
        action={`${base}/poptavky`}
        filters={{
          q: filters.q,
          categories: filters.categories,
          jobTypes: filters.jobTypes,
          city: filters.city ? { code: filters.city.code, label: filters.city.label } : null,
          radius: filters.radius,
          region: filters.region,
          remote: filters.remote,
          budgetMin: filters.budgetMin,
          posted: filters.posted,
          noOffers: filters.noOffers,
          urgent: filters.urgent,
          sort: filters.sort,
        }}
        tree={categoryTree(categories)}
        counts={Object.fromEntries(counts)}
        activeCount={activeCount}
        resetHref={`${base}/poptavky`}
      />

      <section className="svc-results__main" aria-labelledby="svc-results-title">
        <header className="svc-results__head">
          <div>
            <h1 id="svc-results-title" className="svc-results__title">
              {filters.q ? <>Poptávky „{filters.q}“</> : "Poptávky"}
              {where ? <span className="svc-results__where"> · {where}</span> : null}
            </h1>
            <p className="svc-muted svc-results__count">{total === 0 ? "Nic jsme nenašli" : `Nalezeno ${plural(total, "poptávka", "poptávky", "poptávek")}`}</p>
          </div>
          <div className="svc-results__tools">
            <label className="svc-sort">
              <span>Řadit</span>
              <select className="svc-select svc-select--sm" name="razeni" form="svc-filter-form" defaultValue={filters.sort}>
                {SORTS.filter((sort) => sort.value !== "distance" || filters.city).map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
              </select>
            </label>
            {hasActiveFilters(filters) ? (
              <SaveSearchButton query={query} name={describeFilters(filters, categories)} loginHref={session ? null : loginHref(currentHref)} />
            ) : null}
          </div>
        </header>

        {chips.length ? (
          <div className="svc-chipbar" aria-label="Aktivní filtry">
            {chips.map((chip) => (
              <a key={chip.label} className="svc-fchip" href={`${base}/poptavky${chip.query ? `?${chip.query}` : ""}`}>
                {chip.label} <SvcIcon name="x" size={13} />
              </a>
            ))}
            <a className="svc-link" href={`${base}/poptavky`}>Zrušit vše</a>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="svc-empty svc-empty--big">
            <SvcIcon name="search" size={28} />
            <h2>Žádná otevřená poptávka neodpovídá filtrům</h2>
            <p>Zkuste zvětšit okruh, ubrat filtry, nebo si nastavte hlídacího psa a nové poptávky vám pošleme e-mailem.</p>
            <div className="svc-row" style={{ justifyContent: "center" }}>
              {hasActiveFilters(filters) ? <a className="svc-btn" href={`${base}/poptavky`}>Zobrazit všechny poptávky</a> : null}
              <a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova`}>Zadat vlastní poptávku</a>
            </div>
          </div>
        ) : (
          <div className="svc-rlist">
            {items.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                categories={categories}
                base={base}
                now={now}
                distance={request.distance_km}
                offers={request.offer_count}
                bookmark={{ saved: saved.has(request.id), loginHref: session ? null : loginHref(currentHref) }}
              />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav className="svc-pager" aria-label="Stránkování">
            {filters.page > 1 ? <a className="svc-btn svc-btn--sm" href={selfHref(filters.page - 1)} rel="prev"><SvcIcon name="chevron-left" size={15} /> Předchozí</a> : <span />}
            <span className="svc-small">Strana {filters.page} z {pages}</span>
            {filters.page < pages ? <a className="svc-btn svc-btn--sm" href={selfHref(filters.page + 1)} rel="next">Další <SvcIcon name="chevron-right" size={15} /></a> : <span />}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
