import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import {
  categoryName,
  contactFor,
  getProvider,
  getRequest,
  hasReviewed,
  listCategories,
  listMessages,
  offersForViewer,
  publicUsers,
  viewer,
  type ServicesOffer,
} from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { ActionButton, Conversation, OfferForm, ReportButton, ReviewForm } from "@/components/services/actions";
import { Avatar, StatusBadge, budgetLabel, dateLabel, money, placeLabel } from "@/components/services/ui";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const request = UUID.test(id) ? await getRequest(id.toLowerCase()) : null;
  return { title: request ? `${request.title} – VeVit Services` : "Poptávka – VeVit Services" };
}

export default async function RequestDetailPage({ params }: Props) {
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

  const [categories, offers] = await Promise.all([listCategories(), offersForViewer(request, me)]);
  const users = await publicUsers([request.author_id, ...offers.map((offer) => offer.provider_id)]);
  const author = users.get(request.author_id);
  const threads = new Map(await Promise.all(offers.map(async (offer) => [offer.id, await listMessages(offer.id)] as const)));

  const accepted = offers.find((offer) => offer.id === request.accepted_offer_id) ?? null;
  const isAcceptedProvider = accepted !== null && accepted.provider_id === me;
  const party = isAuthor || isAcceptedProvider;
  const counterpartId = isAuthor ? accepted?.provider_id ?? null : isAcceptedProvider ? request.author_id : null;
  const counterpart = counterpartId ? users.get(counterpartId) ?? null : null;
  const contact = party && counterpartId && (request.status === "assigned" || request.status === "completed") ? await contactFor(counterpartId) : null;
  const myDone = isAuthor ? request.author_done : request.provider_done;
  const reviewed = party && request.status === "completed" && me ? await hasReviewed(request.id, me) : true;
  const ownOffer = !isAuthor && me ? offers[0] ?? null : null;
  const provider = !isAuthor && me && !ownOffer && request.status === "open" ? await getProvider(me) : null;
  const loginHref = `/${locale}/account/login?return_to=${encodeURIComponent(`${base}/poptavka/${request.id}`)}`;

  const offerCard = (offer: ServicesOffer, showProvider: boolean) => {
    const person = users.get(offer.provider_id);
    const closed = offer.status === "rejected" || offer.status === "withdrawn";
    return (
      <article key={offer.id} className={`svc-offer${offer.status === "accepted" ? " svc-offer--accepted" : ""}`}>
        <div className="svc-spread">
          {showProvider ? (
            <a className="svc-row" href={`${base}/poskytovatel/${offer.provider_id}`} style={{ textDecoration: "none" }}>
              <Avatar name={person?.name ?? "?"} url={person?.avatar_url ?? null} />
              <strong>{person?.name ?? "Poskytovatel"}</strong>
            </a>
          ) : <strong>Vaše nabídka</strong>}
          <StatusBadge status={offer.status} />
        </div>
        <p className="svc-price" style={{ margin: "12px 0 4px" }}>{money(offer.price)}</p>
        {offer.delivery ? <p className="svc-small" style={{ margin: 0 }}>Termín: {offer.delivery}</p> : null}
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
          <details open={offer.status === "accepted" || !isAuthor} style={{ marginTop: 12 }}>
            <summary className="svc-small" style={{ cursor: "pointer" }}>Zprávy ({threads.get(offer.id)?.length ?? 0})</summary>
            <Conversation offerId={offer.id} me={me} initial={threads.get(offer.id) ?? []} closed={closed} />
          </details>
        ) : null}
      </article>
    );
  };

  return (
    <div className="svc-two">
      <div className="svc-stack">
        <article className="svc-card">
          <div className="svc-row">
            <span className="svc-badge svc-badge--cat">{categoryName(categories, request.category)}</span>
            <StatusBadge status={request.status} />
          </div>
          <h1 className="svc-h1" style={{ marginTop: 12 }}>{request.title}</h1>
          <p className="svc-pre">{request.description}</p>
          <div className="svc-meta">
            <span>{placeLabel(request.city, request.remote)}</span>
            <span>{budgetLabel(request.budget_min, request.budget_max)}</span>
            {request.deadline ? <span>Termín {dateLabel(request.deadline)}</span> : null}
            <span>Zadáno {dateLabel(request.created_at)}</span>
            {request.status === "open" ? <span>Vyprší {dateLabel(request.expires_at)}</span> : null}
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
            {offers.length === 0 ? <div className="svc-empty">Zatím žádná nabídka. Dáme vám vědět e-mailem, až nějaká přijde.</div> : (
              <div className="svc-stack">{offers.map((offer) => offerCard(offer, true))}</div>
            )}
          </section>
        ) : ownOffer ? (
          <section>
            <h2 className="svc-h2">Vaše nabídka</h2>
            {offerCard(ownOffer, false)}
          </section>
        ) : request.status === "open" ? (
          <section className="svc-card">
            <h2 className="svc-h2" style={{ marginTop: 0 }}>Poslat nabídku</h2>
            {!me ? (
              <p><a className="svc-btn svc-btn--primary" href={loginHref}>Přihlásit se a nabídnout</a></p>
            ) : provider && provider.active ? (
              <OfferForm requestId={request.id} />
            ) : (
              <p>Nabídky posílají poskytovatelé. <a className="svc-btn svc-btn--sm" href={`${base}/profil`}>Vyplnit profil poskytovatele</a></p>
            )}
          </section>
        ) : null}
      </div>

      <aside className="svc-stack">
        <div className="svc-card">
          <p className="svc-small" style={{ marginBottom: 8 }}>Zadavatel</p>
          <div className="svc-row">
            <Avatar name={author?.name ?? "?"} url={author?.avatar_url ?? null} />
            <strong>{author?.name ?? "Uživatel"}</strong>
          </div>
          {isAuthor && request.status === "open" ? (
            <div style={{ marginTop: 16 }}>
              <ActionButton path={`requests/${request.id}/cancel`} label="Zrušit poptávku" variant="danger" confirm="Opravdu zrušit poptávku? Všechny nabídky se zamítnou." />
            </div>
          ) : null}
        </div>
        <div className="svc-card svc-small">
          Kontakt se zobrazí až po výběru nabídky. Platbu si strany domlouvají přímo mezi sebou; VeVit zakázky jen propojuje.
          {me && !isAuthor ? <div style={{ marginTop: 10 }}><ReportButton kind="request" target={request.id} /></div> : null}
        </div>
        <a className="svc-btn" href={base}>← Všechny poptávky</a>
      </aside>
    </div>
  );
}
