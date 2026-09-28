import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { categoryName, getProvider, listCategories, publicUsers, reviewSummary, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { ReportButton } from "@/components/services/actions";
import { Avatar, Stars, dateLabel } from "@/components/services/ui";

export const metadata: Metadata = { title: "Poskytovatel – VeVit Services" };

type Props = { params: Promise<{ id: string }> };

export default async function ProviderPublicPage({ params }: Props) {
  await connection();
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) notFound();
  const provider = await getProvider(id);
  if (!provider || !provider.active) notFound();

  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const [categories, summary, session] = await Promise.all([listCategories(), reviewSummary(id), viewer()]);
  const users = await publicUsers([id, ...summary.reviews.map((review) => review.author_id)]);
  const person = users.get(id);

  return (
    <div className="svc-two">
      <div className="svc-stack">
        <article className="svc-card">
          <div className="svc-row">
            <Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} />
            <div>
              <h1 className="svc-h1" style={{ fontSize: 26, margin: 0 }}>{person?.name ?? "Poskytovatel"}</h1>
              <p className="svc-muted" style={{ margin: 0 }}>{provider.headline}</p>
            </div>
          </div>
          <div className="svc-chips" style={{ marginTop: 16 }}>
            {provider.categories.map((slug) => <span key={slug} className="svc-badge svc-badge--cat">{categoryName(categories, slug)}</span>)}
          </div>
          {provider.bio ? <p className="svc-pre" style={{ marginTop: 16 }}>{provider.bio}</p> : null}
          <div className="svc-meta">
            {provider.city ? <span>{provider.city}{provider.radius_km ? ` + ${provider.radius_km} km` : ""}</span> : null}
            {provider.remote ? <span>Pracuje i na dálku</span> : null}
          </div>
        </article>

        <section>
          <h2 className="svc-h2">Hodnocení ({summary.count})</h2>
          {summary.reviews.length === 0 ? <div className="svc-empty">Zatím bez hodnocení.</div> : (
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
            <p style={{ margin: 0 }}><Stars value={summary.average} /> <strong>{summary.average.toFixed(1)}</strong> <span className="svc-small">z {summary.count} hodnocení</span></p>
          ) : <p className="svc-muted" style={{ margin: 0 }}>Nový poskytovatel</p>}
          {session && session.user.id !== id ? <div style={{ marginTop: 12 }}><ReportButton kind="provider" target={id} /></div> : null}
        </div>
        <a className="svc-btn" href={base}>← Všechny poptávky</a>
      </aside>
    </div>
  );
}
