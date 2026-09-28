import type { Metadata } from "next";
import { connection } from "next/server";
import { activeProviders, completedJobsFor, listCategories, publicUsers, ratingsFor, trustInfo } from "@/lib/services";
import { cityByCode, distanceKm } from "@/lib/services-geo";
import { servicesLocale } from "@/lib/services-locale";
import { categoryLabel, categoryTree, expandCategories } from "@/components/services/categories";
import { RADII, normalizeText } from "@/components/services/constants";
import { SvcIcon } from "@/components/services/icons";
import { ProviderFilters } from "@/components/services/provider-filters";
import { Avatar, Stars, distanceLabel, money, plural } from "@/components/services/ui";

export const metadata: Metadata = {
  title: "Poskytovatelé služeb – VeVit Services",
  description: "Najděte řemeslníky, grafiky, programátory, lektory a další poskytovatele ve svém okolí nebo na dálku.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 80) ?? "";
}

export default async function ProvidersPage({ searchParams }: Props) {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const params = await searchParams;
  const [categories, providers] = await Promise.all([listCategories(), activeProviders(300)]);

  const q = one(params.q);
  const category = categories.some((item) => item.slug === one(params.kat)) ? one(params.kat) : "";
  const city = cityByCode(one(params.obec));
  const radiusRaw = Number(one(params.okruh));
  const radius = (RADII as readonly number[]).includes(radiusRaw) ? radiusRaw : 25;
  const remoteOnly = one(params.dalku) === "1";
  const minRating = one(params.hodnoceni) === "4" ? 4 : 0;
  const sort = ["hodnoceni", "zakazky", "nejblize", "nejnovejsi"].includes(one(params.razeni)) ? one(params.razeni) : city ? "nejblize" : "hodnoceni";

  const ids = providers.map((provider) => provider.user_id);
  const [ratings, jobs, people, trust] = await Promise.all([ratingsFor(ids), completedJobsFor(ids), publicUsers(ids), trustInfo(ids)]);
  const wanted = category ? new Set(expandCategories([category], categories)) : null;
  const words = normalizeText(q).split(/\s+/).filter((word) => word.length >= 2);

  const rows = providers
    .map((provider) => {
      const distance = city && provider.lat != null && provider.lng != null ? distanceKm(city, { lat: provider.lat, lng: provider.lng }) : null;
      return { provider, distance, rating: ratings.get(provider.user_id) ?? null, jobs: jobs.get(provider.user_id) ?? 0 };
    })
    .filter(({ provider, distance, rating }) => {
      if (wanted && !(provider.categories ?? []).some((slug) => wanted.has(slug))) return false;
      if (remoteOnly && !provider.remote) return false;
      if (city) {
        // Poskytovatel dojede v okruhu hledání nebo v okruhu, který sám uvádí; na dálku vždy.
        const reach = Math.max(radius, provider.radius_km ?? 0);
        if (!(distance !== null && distance <= reach) && !provider.remote) return false;
      }
      if (minRating && (!rating || rating.average < minRating)) return false;
      if (words.length) {
        const haystack = normalizeText(`${provider.headline} ${provider.bio} ${people.get(provider.user_id)?.name ?? ""}`);
        if (!words.every((word) => haystack.includes(word))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "nejblize") return (a.distance ?? 1e9) - (b.distance ?? 1e9);
      if (sort === "zakazky") return b.jobs - a.jobs;
      if (sort === "nejnovejsi") return Date.parse(b.provider.created_at ?? "") - Date.parse(a.provider.created_at ?? "");
      return (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0) || b.jobs - a.jobs;
    });

  return (
    <div className="svc-results">
      <ProviderFilters
        action={`${base}/poskytovatele`}
        tree={categoryTree(categories)}
        initial={{ q, category, city: city ? { code: city.code, label: city.label } : null, radius, remoteOnly, minRating, sort }}
      />
      <section className="svc-results__main">
        <header className="svc-results__head">
          <div>
            <h1 className="svc-results__title">Poskytovatelé{category ? <span className="svc-results__where"> · {categoryLabel(category, categories)}</span> : null}{city ? <span className="svc-results__where"> · {city.name} + {radius} km</span> : null}</h1>
            <p className="svc-muted svc-results__count">{rows.length ? plural(rows.length, "poskytovatel", "poskytovatelé", "poskytovatelů") : "Nikoho jsme nenašli"}</p>
          </div>
          <a className="svc-btn svc-btn--sm" href={`${base}/profil`}><SvcIcon name="user" size={15} /> Nabízím služby</a>
        </header>
        {rows.length === 0 ? (
          <div className="svc-empty svc-empty--big">
            <SvcIcon name="users" size={28} />
            <h2>Tady zatím nikdo není</h2>
            <p>Zadejte poptávku a poskytovatelé se vám ozvou sami, nebo zkuste zvětšit okruh.</p>
            <a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova${category ? `?kat=${category}` : ""}`}>Zadat poptávku</a>
          </div>
        ) : (
          <div className="svc-pgrid svc-pgrid--list">
            {rows.map(({ provider, distance, rating, jobs: done }) => {
              const person = people.get(provider.user_id);
              const verified = trust.get(provider.user_id)?.phoneVerified ?? false;
              return (
                <a key={provider.user_id} className="svc-pcard" href={`${base}/poskytovatel/${provider.user_id}`}>
                  <div className="svc-row">
                    <Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} />
                    <div style={{ minWidth: 0 }}>
                      <strong>{person?.name ?? "Poskytovatel"}</strong>
                      {verified ? <span className="svc-verified" title="Ověřený telefon"><SvcIcon name="badge-check" size={14} /></span> : null}
                      <div className="svc-small">
                        {provider.city || "Na dálku"}
                        {distance !== null ? ` · ${distanceLabel(distance)}` : ""}
                        {provider.remote && provider.city ? " · i na dálku" : ""}
                      </div>
                    </div>
                  </div>
                  <p className="svc-pcard__headline">{provider.headline}</p>
                  <div className="svc-chips">
                    {(provider.categories ?? []).slice(0, 3).map((slug) => <span key={slug} className="svc-badge svc-badge--cat">{categoryLabel(slug, categories)}</span>)}
                  </div>
                  <div className="svc-pcard__foot">
                    <span>{rating ? <><Stars value={rating.average} /> {rating.average.toFixed(1)} ({rating.count})</> : "Nový poskytovatel"}</span>
                    <span>{plural(done, "zakázka", "zakázky", "zakázek")}</span>
                    {provider.hourly_rate ? <span>{money(provider.hourly_rate)}/h</span> : null}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
