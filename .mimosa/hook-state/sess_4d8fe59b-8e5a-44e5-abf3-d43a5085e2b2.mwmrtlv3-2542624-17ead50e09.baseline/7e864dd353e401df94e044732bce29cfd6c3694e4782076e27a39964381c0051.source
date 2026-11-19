import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { completedJobsFor, getProvider, listCategories, publicUsers, reviewSummary, trustInfo, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { ReportButton } from "@/components/services/actions";
import { categoryLabel, categoryPath } from "@/components/services/categories";
import { regionLabel } from "@/components/services/constants";
import { SvcIcon } from "@/components/services/icons";
import { Avatar, Stars, dateLabel, money, plural } from "@/components/services/ui";

type Props = { params: Promise<{ id: string }> };

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const provider = ID.test(id) ? await getProvider(id) : null;
  return { title: provider ? `${provider.headline} – VeVit Services` : "Poskytovatel – VeVit Services" };
}

export default async function ProviderPublicPage({ params }: Props) {
  await connection();
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const provider = await getProvider(id);
  if (!provider || !provider.active) notFound();

  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const [categories, summary, session, jobs, trust] = await Promise.all([
    listCategories(), reviewSummary(id), viewer(), completedJobsFor([id]), trustInfo([id]),
  ]);
  const users = await publicUsers([id, ...summary.reviews.map((review) => review.author_id)]);
  const person = users.get(id);
  const done = jobs.get(id) ?? 0;
  const info = trust.get(id);
  const histogram = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: summary.reviews.filter((review) => review.stars === stars).length }));
  const firstCategory = provider.categories?.[0] ?? "";
  const website = provider.website ? (() => { try { return new URL(provider.website); } catch { return null; } })() : null;

  return (
    <>
      <nav className="svc-crumbs" aria-label="Drobečková navigace">
        <a href={base}>Services</a><span aria-hidden="true">/</span>
        <a href={`${base}/poskytovatele`}>Poskytovatelé</a><span aria-hidden="true">/</span><span>{person?.name ?? "Poskytovatel"}</span>
      </nav>
      <div className="svc-two">
        <div className="svc-stack">
          <article className="svc-card svc-profile">
            <div className="svc-row" style={{ gap: 16 }}>
              <span className="svc-profile__avatar"><Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} /></span>
              <div style={{ minWidth: 0 }}>
                <h1 className="svc-h1 svc-profile__name">
                  {person?.name ?? "Poskytovatel"}
                  {info?.phoneVerified ? <span className="svc-verified" title="Ověřený telefon"><SvcIcon name="badge-check" size={18} /></span> : null}
                </h1>
                <p className="svc-lead" style={{ margin: 0 }}>{provider.headline}</p>
              </div>
            </div>
            <dl className="svc-facts">
              <div><dt><SvcIcon name="star" size={15} /> Hodnocení</dt><dd>{summary.average !== null ? `${summary.average.toFixed(1)} z 5 (${summary.count})` : "Zatím bez hodnocení"}</dd></div>
              <div><dt><SvcIcon name="circle-check" size={15} /> Dokončeno</dt><dd>{plural(done, "zakázka", "zakázky", "zakázek")}</dd></div>
              <div>
                <dt><SvcIcon name={provider.city ? "map-pin" : "globe"} size={15} /> Působí</dt>
                <dd>
                  {provider.city ? `${provider.city}${provider.radius_km ? ` + ${provider.radius_km} km` : ""}` : "Na dálku"}
                  {provider.city && provider.region ? <span className="svc-small"> · {regionLabel(provider.region)}</span> : null}
                  {provider.city && provider.remote ? <span className="svc-small"> · i na dálku</span> : null}
                </dd>
              </div>
              {provider.hourly_rate ? <div><dt><SvcIcon name="wallet" size={15} /> Sazba</dt><dd>{money(provider.hourly_rate)}/h (orientačně)</dd></div> : null}
              {info?.since ? <div><dt><SvcIcon name="user" size={15} /> Na VeVitu od</dt><dd>{dateLabel(info.since)}</dd></div> : null}
              {website ? (
                <div><dt><SvcIcon name="link" size={15} /> Web</dt><dd><a href={website.toString()} rel="nofollow noopener ugc" target="_blank">{website.hostname}</a></dd></div>
              ) : null}
            </dl>
            <div className="svc-chips" style={{ marginTop: 4 }}>
              {(provider.categories ?? []).map((slug) => {
                const { parent } = categoryPath(slug, categories);
                return <a key={slug} className="svc-badge svc-badge--cat" href={`${base}/poskytovatele?kat=${slug}`}><SvcIcon name={parent?.icon ?? "layers"} size={12} /> {categoryLabel(slug, categories)}</a>;
              })}
            </div>
            {provider.bio ? (
              <>
                <h2 className="svc-h3">O mně</h2>
                <p className="svc-pre">{provider.bio}</p>
              </>
            ) : null}
          </article>

          <section>
            <h2 className="svc-h2">Hodnocení ({summary.count})</h2>
            {summary.reviews.length === 0 ? <div className="svc-empty">Zatím bez hodnocení. Hodnotit lze jen dokončenou zakázku.</div> : (
              <div className="svc-stack">
                {summary.reviews.map((review, index) => (
                  <article key={index} className="svc-card">
                    <div className="svc-spread">
                      <Stars value={review.stars} />
                      <span className="svc-small">{users.get(review.author_id)?.name ?? "Uživatel"} · {dateLabel(review.created_at)}</span>
                    </div>
                    {review.body ? <p className="svc-pre" style={{ marginTop: 8 }}>{review.body}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="svc-stack">
          <div className="svc-card">
            {summary.average !== null ? (
              <>
                <p style={{ margin: 0 }}><Stars value={summary.average} /> <strong>{summary.average.toFixed(1)}</strong> <span className="svc-small">z {summary.count} hodnocení</span></p>
                <ul className="svc-histo">
                  {histogram.map((row) => (
                    <li key={row.stars}>
                      <span>{row.stars}★</span>
                      <span className="svc-histo__bar"><span style={{ width: `${summary.count ? (row.count / summary.count) * 100 : 0}%` }} /></span>
                      <span className="svc-small">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : <p className="svc-muted" style={{ margin: 0 }}>Nový poskytovatel</p>}
          </div>
          {session?.user.id !== id ? (
            <a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova${firstCategory ? `?kat=${firstCategory}` : ""}`}>
              <SvcIcon name="send" size={15} /> Zadat poptávku v tomto oboru
            </a>
          ) : (
            <a className="svc-btn" href={`${base}/profil`}><SvcIcon name="pencil" size={15} /> Upravit profil</a>
          )}
          {session && session.user.id !== id ? <div className="svc-card svc-small"><ReportButton kind="provider" target={id} /></div> : null}
          <a className="svc-btn" href={`${base}/poskytovatele`}><SvcIcon name="chevron-left" size={15} /> Všichni poskytovatelé</a>
        </aside>
      </div>
    </>
  );
}
