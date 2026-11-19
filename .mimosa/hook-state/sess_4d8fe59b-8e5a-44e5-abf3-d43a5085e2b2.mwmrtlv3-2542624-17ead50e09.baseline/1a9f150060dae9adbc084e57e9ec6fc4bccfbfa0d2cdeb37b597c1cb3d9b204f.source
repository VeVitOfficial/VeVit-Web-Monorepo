import type { Metadata } from "next";
import { after, connection } from "next/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createHash } from "node:crypto";
import {
  bookmarkedIds, completedJobsFor, contactFor, getProvider, getRequest, hasReviewed, listCategories, listMessages,
  markRead, offerCounts, offersForViewer, publicUsers, ratingsFor, registerView, renderTime, reviewSummary, similarRequests,
  trustInfo, viewer, type ServicesOffer,
} from "@/lib/services";
import { distanceKm } from "@/lib/services-geo";
import { servicesLocale } from "@/lib/services-locale";
import { categoryPath } from "@/components/services/categories";
import { jobTypeLabel, regionLabel } from "@/components/services/constants";
import { ActionButton, Conversation, OfferForm, ReportButton, ReviewForm } from "@/components/services/actions";
import { SvcIcon } from "@/components/services/icons";
import { BookmarkButton, ShareButton } from "@/components/services/interactive";
import { RequestCard } from "@/components/services/request-card";
import { Avatar, Stars, StatusBadge, ago, budgetLabel, dateLabel, distanceLabel, money, plural, untilLabel } from "@/components/services/ui";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const request = UUID.test(id) ? await getRequest(id.toLowerCase()) : null;
  return {
    title: request ? `${request.title} – VeVit Services` : "Poptávka – VeVit Services",
    description: request ? request.description.slice(0, 160) : undefined,
  };
}

/** Anonymní klíč návštěvníka pro počítání zobrazení (1× denně). */
async function viewerKey(userId: string | null): Promise<string> {
  if (userId) return `u:${userId}`;
  const list = await headers();
  const ip = (list.get("x-forwarded-for") ?? "").split(",")[0].trim() || list.get("x-real-ip") || "";
  const agent = list.get("user-agent") ?? "";
  return `a:${createHash("sha256").update(`${ip}|${agent}`).digest("hex").slice(0, 32)}`;
}

export default async function RequestDetailPage({ params, searchParams }: Props) {
  await connection();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const request = await getRequest(id.toLowerCase());
  if (!request) notFound();

  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  const me = session?.user.id ?? null;
  const isAuthor = me === request.author_id;
  const justCreated = (await searchParams).nova === "1" && isAuthor;

  const categories = await listCategories();
  const [offers, similar, totals] = await Promise.all([
    offersForViewer(request, me),
    request.status === "open" ? similarRequests(request, categories, 4).catch(() => []) : Promise.resolve([]),
    offerCounts([request.id]),
  ]);
  const offerTotal = totals.get(request.id) ?? 0;
  const providerIds = offers.map((offer) => offer.provider_id);
  const [users, threadsList, ratings, jobs, trust, authorRating, saved, myProvider] = await Promise.all([
    publicUsers([request.author_id, ...providerIds]),
    Promise.all(offers.map(async (offer) => [offer.id, await listMessages(offer.id)] as const)),
    ratingsFor(providerIds),
    completedJobsFor(providerIds),
    trustInfo([request.author_id, ...providerIds]),
    reviewSummary(request.author_id),
    me ? bookmarkedIds(me) : Promise.resolve(new Set<string>()),
    me && !isAuthor ? getProvider(me) : Promise.resolve(null),
  ]);
  const threads = new Map(threadsList);
  const now = renderTime();

  if (me) {
    // Otevření stránky = přečtení viditelných konverzací.
    await Promise.all(offers.map((offer) => markRead(me, offer.id, threads.get(offer.id) ?? [])));
  }
  if (!isAuthor) {
    const key = await viewerKey(me);
    after(() => registerView(request.id, key).catch(() => {}));
  }

  const author = users.get(request.author_id);
  const accepted = offers.find((offer) => offer.id === request.accepted_offer_id) ?? null;
  const isAcceptedProvider = accepted !== null && accepted.provider_id === me;
  const party = isAuthor || isAcceptedProvider;
  const counterpartId = isAuthor ? accepted?.provider_id ?? null : isAcceptedProvider ? request.author_id : null;
  const counterpart = counterpartId ? users.get(counterpartId) ?? null : null;
  const contact = party && counterpartId && (request.status === "assigned" || request.status === "completed") ? await contactFor(counterpartId) : null;
  const myDone = isAuthor ? request.author_done : request.provider_done;
  const reviewed = party && request.status === "completed" && me ? await hasReviewed(request.id, me) : true;
  const ownOffer = !isAuthor && me ? offers[0] ?? null : null;
  const loginHref = `/${locale}/account/login?return_to=${encodeURIComponent(`${base}/poptavka/${request.id}`)}`;
  const { parent, child } = categoryPath(request.category, categories);
  const expiresIn = Date.parse(request.expires_at) - now;
  const canProlong = isAuthor && request.prolonged_count < 5
    && ((request.status === "open" && expiresIn <= 7 * 86_400_000) || request.status === "expired");
  const distance = myProvider?.lat != null && myProvider.lng != null && request.lat !== null && request.lng !== null
    ? distanceKm({ lat: myProvider.lat, lng: myProvider.lng }, { lat: request.lat, lng: request.lng })
    : null;
  const authorTrust = trust.get(request.author_id);

  const offerCard = (offer: ServicesOffer, showProvider: boolean) => {
    const person = users.get(offer.provider_id);
    const rating = ratings.get(offer.provider_id);
    const done = jobs.get(offer.provider_id) ?? 0;
    const verified = trust.get(offer.provider_id)?.phoneVerified ?? false;
    const closed = offer.status === "rejected" || offer.status === "withdrawn";
    const messages = threads.get(offer.id) ?? [];
    return (
      <article key={offer.id} className={`svc-offer${offer.status === "accepted" ? " svc-offer--accepted" : ""}`}>
        <div className="svc-spread">
          {showProvider ? (
            <a className="svc-row svc-offer__who" href={`${base}/poskytovatel/${offer.provider_id}`}>
              <Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} />
              <span>
                <strong>{person?.name ?? "Poskytovatel"}</strong>
                <span className="svc-small svc-offer__meta">
                  {rating ? <><Stars value={rating.average} /> {rating.average.toFixed(1)} ({rating.count})</> : "Zatím bez hodnocení"}
                  {" · "}{plural(done, "dokončená zakázka", "dokončené zakázky", "dokončených zakázek")}
                  {verified ? <> · <SvcIcon name="badge-check" size={13} /> ověřený telefon</> : null}
                </span>
              </span>
            </a>
          ) : <strong>Vaše nabídka</strong>}
          <StatusBadge status={offer.status} />
        </div>
        <div className="svc-offer__price">
          <span className="svc-price">{money(offer.price)}</span>
          {offer.delivery ? <span className="svc-small"><SvcIcon name="clock" size={13} /> {offer.delivery}</span> : null}
          <span className="svc-small">{ago(offer.created_at, now)}</span>
        </div>
        <p className="svc-pre" style={{ margin: "10px 0 0" }}>{offer.message}</p>
        <div className="svc-row" style={{ marginTop: 12 }}>
          {isAuthor && request.status === "open" && offer.status === "sent" ? (
            <ActionButton path={`offers/${offer.id}/accept`} label="Vybrat tuto nabídku" confirm="Vybrat tuto nabídku? Ostatní nabídky se zamítnou a uvidíte kontakt na poskytovatele." />
          ) : null}
          {!isAuthor && offer.status === "sent" ? (
            <ActionButton path={`offers/${offer.id}/withdraw`} label="Stáhnout nabídku" variant="ghost" confirm="Opravdu stáhnout nabídku?" />
          ) : null}
          {isAuthor ? <ReportButton kind="offer" target={offer.id} /> : null}
        </div>
        {me ? (
          <details open={offer.status === "accepted" || !isAuthor} className="svc-offer__thread">
            <summary className="svc-small"><SvcIcon name="message-square" size={13} /> Zprávy ({messages.length})</summary>
            <Conversation offerId={offer.id} me={me} initial={messages} closed={closed} />
          </details>
        ) : null}
      </article>
    );
  };

  return (
    <>
      <nav className="svc-crumbs" aria-label="Drobečková navigace">
        <a href={base}>Services</a><span aria-hidden="true">/</span>
        <a href={`${base}/poptavky`}>Poptávky</a>
        {parent ? <><span aria-hidden="true">/</span><a href={`${base}/poptavky?kat=${parent.slug}`}>{parent.name_cs}</a></> : null}
        {child ? <><span aria-hidden="true">/</span><a href={`${base}/poptavky?kat=${child.slug}`}>{child.name_cs}</a></> : null}
      </nav>

      {justCreated ? (
        <p className="svc-alert svc-alert--ok" role="status" style={{ marginBottom: 16 }}>
          Poptávka je zveřejněná. Jakmile přijde nabídka, pošleme vám e-mail. Stav najdete i v <a href={`${base}/moje`}>Moje zakázky</a> a ve svém účtu.
        </p>
      ) : null}

      <div className="svc-two">
        <div className="svc-stack">
          <article className="svc-card svc-detail">
            <div className="svc-row">
              {parent ? <span className="svc-badge svc-badge--cat"><SvcIcon name={parent.icon} size={13} /> {child?.name_cs ?? parent.name_cs}</span> : null}
              <StatusBadge status={request.status} />
              {request.urgent ? <span className="svc-tag svc-tag--urgent"><SvcIcon name="zap" size={12} /> Spěchá</span> : null}
            </div>
            <h1 className="svc-h1 svc-detail__title">{request.title}</h1>
            <dl className="svc-facts">
              <div><dt><SvcIcon name="banknote" size={15} /> Rozpočet</dt><dd>{budgetLabel(request.budget_min, request.budget_max, request.budget_type)}</dd></div>
              <div><dt><SvcIcon name="repeat" size={15} /> Typ</dt><dd>{jobTypeLabel(request.job_type)}</dd></div>
              <div>
                <dt><SvcIcon name={request.city ? "map-pin" : "globe"} size={15} /> Místo</dt>
                <dd>
                  {request.city || "Na dálku"}
                  {request.city && request.region ? <span className="svc-small"> · {regionLabel(request.region)}</span> : null}
                  {request.city && request.remote ? <span className="svc-small"> · lze i na dálku</span> : null}
                </dd>
              </div>
              {distance !== null ? <div><dt><SvcIcon name="navigation" size={15} /> Od vás</dt><dd>{distanceLabel(distance)} vzdušnou čarou</dd></div> : null}
              <div><dt><SvcIcon name="calendar" size={15} /> Termín</dt><dd>{request.deadline ? `${dateLabel(request.deadline)} (${untilLabel(request.deadline, now)})` : "Neuveden"}</dd></div>
              <div><dt><SvcIcon name="clock" size={15} /> Zveřejněno</dt><dd>{ago(request.created_at, now)}</dd></div>
              {request.status === "open" ? <div><dt><SvcIcon name="hourglass" size={15} /> Končí</dt><dd>{untilLabel(request.expires_at, now)}</dd></div> : null}
              <div><dt><SvcIcon name="eye" size={15} /> Zobrazení</dt><dd>{request.views}</dd></div>
              <div><dt><SvcIcon name="inbox" size={15} /> Nabídky</dt><dd>{offerTotal === 0 ? "Zatím žádné" : offerTotal}</dd></div>
            </dl>
            <h2 className="svc-h3">Popis</h2>
            <p className="svc-pre">{request.description}</p>
            <div className="svc-row svc-detail__actions">
              <BookmarkButton requestId={request.id} initial={saved.has(request.id)} loginHref={me ? null : loginHref} />
              <ShareButton url={`${base}/poptavka/${request.id}`} title={request.title} />
              {isAuthor && request.status === "open" ? <a className="svc-btn svc-btn--sm" href={`${base}/poptavka/${request.id}/upravit`}><SvcIcon name="pencil" size={15} /> Upravit</a> : null}
              {canProlong ? (
                <ActionButton path={`requests/${request.id}/prolong`} label={request.status === "expired" ? "Obnovit na 30 dní" : "Prodloužit o 30 dní"} variant="ghost" />
              ) : null}
            </div>
          </article>

          {party && accepted && (request.status === "assigned" || request.status === "completed") ? (
            <section className="svc-card">
              <h2 className="svc-h2" style={{ marginTop: 0 }}>{request.status === "completed" ? "Zakázka je dokončená" : "Zakázka běží"}</h2>
              {contact ? (
                <p style={{ margin: "0 0 12px" }}>
                  Kontakt na {counterpart?.name ?? "druhou stranu"}: <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  {contact.phone ? <> · <a href={`tel:${contact.phone}`}>{contact.phone}</a></> : null}
                </p>
              ) : null}
              {request.status === "assigned" ? (
                myDone ? (
                  <p className="svc-muted">Dokončení jste potvrdili, čeká se na druhou stranu.</p>
                ) : (
                  <ActionButton path={`requests/${request.id}/done`} label="Potvrdit, že je hotovo" confirm="Potvrdit dokončení zakázky? Hotovo bude, až potvrdí obě strany." />
                )
              ) : reviewed ? (
                <p className="svc-muted">Děkujeme za hodnocení.</p>
              ) : (
                <ReviewForm requestId={request.id} subject={counterpart?.name ?? "druhou stranou"} />
              )}
            </section>
          ) : null}

          {isAuthor ? (
            <section>
              <h2 className="svc-h2">Nabídky ({offers.length})</h2>
              {offers.length === 0 ? (
                <div className="svc-empty">
                  <SvcIcon name="inbox" size={24} />
                  <p>Zatím žádná nabídka. Dáme vám vědět e-mailem, až nějaká přijde.</p>
                  <p className="svc-small">Tip: sdílejte odkaz na poptávku, nebo ji upravte, ať je zadání konkrétnější.</p>
                </div>
              ) : (
                <div className="svc-stack">{offers.map((offer) => offerCard(offer, true))}</div>
              )}
            </section>
          ) : ownOffer ? (
            <section>
              <h2 className="svc-h2">Vaše nabídka</h2>
              {offerCard(ownOffer, false)}
            </section>
          ) : request.status === "open" ? (
            <section className="svc-card" id="nabidka">
              <h2 className="svc-h2" style={{ marginTop: 0 }}>Poslat nabídku</h2>
              {!me ? (
                <p><a className="svc-btn svc-btn--primary" href={loginHref}>Přihlásit se a nabídnout</a></p>
              ) : myProvider && myProvider.active ? (
                <OfferForm requestId={request.id} />
              ) : (
                <p>Nabídky posílají poskytovatelé. <a className="svc-btn svc-btn--sm" href={`${base}/profil`}>Vyplnit profil poskytovatele</a></p>
              )}
            </section>
          ) : null}

          {similar.length ? (
            <section>
              <h2 className="svc-h2">Podobné poptávky</h2>
              <div className="svc-rlist">
                {similar.map((item) => <RequestCard key={item.id} request={item} categories={categories} base={base} now={now} />)}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="svc-stack">
          <div className="svc-card">
            <p className="svc-small" style={{ marginBottom: 8 }}>Zadavatel</p>
            <div className="svc-row">
              <Avatar name={author?.name ?? "?"} url={author?.avatar_url ?? null} />
              <div>
                <strong>{author?.name ?? "Uživatel"}</strong>
                <div className="svc-small">
                  {authorRating.average !== null ? <><Stars value={authorRating.average} /> {authorRating.average.toFixed(1)} ({authorRating.count})</> : "Zatím bez hodnocení"}
                </div>
              </div>
            </div>
            <ul className="svc-trustlist">
              {authorTrust?.since ? <li><SvcIcon name="user" size={14} /> Na VeVitu od {dateLabel(authorTrust.since)}</li> : null}
              {authorTrust?.phoneVerified ? <li><SvcIcon name="badge-check" size={14} /> Ověřený telefon</li> : null}
            </ul>
            {isAuthor && request.status === "open" ? (
              <div style={{ marginTop: 16 }}>
                <ActionButton path={`requests/${request.id}/cancel`} label="Zrušit poptávku" variant="danger" confirm="Opravdu zrušit poptávku? Všechny nabídky se zamítnou." />
              </div>
            ) : null}
          </div>
          {!isAuthor && request.status === "open" && !ownOffer ? (
            <a className="svc-btn svc-btn--primary" href={me ? "#nabidka" : loginHref}><SvcIcon name="send" size={15} /> Nabídnout svou práci</a>
          ) : null}
          <div className="svc-card svc-small">
            <strong className="svc-aside-title"><SvcIcon name="shield-check" size={15} /> Bezpečně</strong>
            Kontakt se zobrazí až po výběru nabídky. Platbu si strany domlouvají přímo mezi sebou; VeVit zakázky jen propojuje. Neplaťte předem neověřeným lidem.
            {me && !isAuthor ? <div style={{ marginTop: 10 }}><ReportButton kind="request" target={request.id} /></div> : null}
          </div>
          <a className="svc-btn" href={`${base}/poptavky`}><SvcIcon name="chevron-left" size={15} /> Všechny poptávky</a>
        </aside>
      </div>
    </>
  );
}
