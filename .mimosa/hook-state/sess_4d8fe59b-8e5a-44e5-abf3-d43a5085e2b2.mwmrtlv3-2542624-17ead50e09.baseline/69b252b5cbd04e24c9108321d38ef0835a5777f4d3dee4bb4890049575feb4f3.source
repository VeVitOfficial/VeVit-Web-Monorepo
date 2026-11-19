import type { Metadata } from "next";
import { connection } from "next/server";
import {
  bookmarkedRequests, listCategories, myOffers, myRequests, offerCounts, renderTime, savedSearches, unreadCounts, viewer,
} from "@/lib/services";
import { describeFilters, parseRequestFilters } from "@/lib/services-search";
import { servicesLocale } from "@/lib/services-locale";
import { categoryLabel } from "@/components/services/categories";
import { SvcIcon } from "@/components/services/icons";
import { SavedSearchActions } from "@/components/services/interactive";
import { RequestCard } from "@/components/services/request-card";
import { StatusBadge, dateLabel, money, plural, untilLabel } from "@/components/services/ui";

export const metadata: Metadata = { title: "Moje zakázky – VeVit Services" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = [
  { key: "poptavky", label: "Moje poptávky", icon: "send" },
  { key: "nabidky", label: "Moje nabídky", icon: "briefcase" },
  { key: "ulozene", label: "Uložené", icon: "bookmark" },
  { key: "hlidaci", label: "Hlídací psi", icon: "bell" },
] as const;

const ACTIVE_REQUEST = new Set(["open", "assigned"]);
const ACTIVE_OFFER = new Set(["sent", "accepted"]);

export default async function MyJobsPage({ searchParams }: Props) {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty svc-empty--big">
        <h1 className="svc-h2" style={{ marginTop: 0 }}>Své poptávky, nabídky a hlídací psy uvidíte po přihlášení</h1>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/moje`)}`}>Přihlásit se</a>
        </p>
      </div>
    );
  }
  const params = await searchParams;
  const tab = TABS.find((item) => item.key === params.tab)?.key ?? "poptavky";
  const me = session.user.id;
  const [categories, requests, offers, unread, bookmarks, searches] = await Promise.all([
    listCategories(), myRequests(me), myOffers(me), unreadCounts(me), bookmarkedRequests(me), savedSearches(me),
  ]);
  const counts = await offerCounts(requests.map((request) => request.id));
  const now = renderTime();
  const activeRequests = requests.filter((request) => ACTIVE_REQUEST.has(request.status));
  const activeOffers = offers.filter((offer) => ACTIVE_OFFER.has(offer.status));
  const offerUnread = offers.reduce((sum, offer) => sum + (unread.byOffer.get(offer.id) ?? 0), 0);
  const requestUnread = requests.reduce((sum, request) => sum + (unread.byRequest.get(request.id) ?? 0), 0);
  const badge: Record<string, number> = { poptavky: requestUnread, nabidky: offerUnread };

  return (
    <>
      <div className="svc-spread" style={{ marginBottom: 20 }}>
        <div>
          <p className="svc-eyebrow">Moje zakázky</p>
          <h1 className="svc-h1" style={{ marginBottom: 0 }}>Přehled</h1>
        </div>
        <a className="svc-btn svc-btn--primary" href={`${base}/poptavka/nova`}><SvcIcon name="plus" size={15} /> Nová poptávka</a>
      </div>

      <section className="svc-kpis" aria-label="Souhrn">
        <a href={`${base}/moje?tab=poptavky`}><strong>{activeRequests.length}</strong><span>aktivních poptávek</span></a>
        <a href={`${base}/moje?tab=nabidky`}><strong>{activeOffers.length}</strong><span>aktivních nabídek</span></a>
        <div className={unread.total ? "is-hot" : undefined}><strong>{unread.total}</strong><span>nepřečtených zpráv</span></div>
        <a href={`${base}/moje?tab=hlidaci`}><strong>{searches.length}</strong><span>hlídacích psů</span></a>
      </section>

      <nav className="svc-tabs" aria-label="Sekce Moje zakázky">
        {TABS.map((item) => (
          <a key={item.key} href={`${base}/moje?tab=${item.key}`} aria-current={tab === item.key ? "page" : undefined}>
            <SvcIcon name={item.icon} size={15} /> {item.label}
            {badge[item.key] ? <span className="svc-navbadge">{badge[item.key]}</span> : null}
          </a>
        ))}
      </nav>

      {tab === "poptavky" ? (
        requests.length === 0 ? (
          <div className="svc-empty">Zatím jste nic nezadali. <a href={`${base}/poptavka/nova`}>Zadat poptávku</a></div>
        ) : (
          <div className="svc-table" role="list">
            {requests.map((request) => {
              const newMessages = unread.byRequest.get(request.id) ?? 0;
              const offerCount = counts.get(request.id) ?? 0;
              const expiringSoon = request.status === "open" && Date.parse(request.expires_at) - now < 7 * 86_400_000;
              return (
                <div key={request.id} className="svc-trow" role="listitem">
                  <div className="svc-trow__main">
                    <a className="svc-trow__title" href={`${base}/poptavka/${request.id}`}>{request.title}</a>
                    <span className="svc-small">
                      {categoryLabel(request.category, categories)} · zadáno {dateLabel(request.created_at)}
                      {request.status === "open" ? <> · končí {untilLabel(request.expires_at, now)}</> : null}
                      {" · "}{request.views} zobrazení
                    </span>
                  </div>
                  <div className="svc-trow__meta">
                    <span className={offerCount ? "svc-strong" : "svc-small"}>{plural(offerCount, "nabídka", "nabídky", "nabídek")}</span>
                    {newMessages ? <span className="svc-navbadge" title="Nepřečtené zprávy">{newMessages} nové</span> : null}
                    {expiringSoon ? <span className="svc-tag svc-tag--warn">Brzy vyprší</span> : null}
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "nabidky" ? (
        offers.length === 0 ? (
          <div className="svc-empty">Zatím jste neposlali žádnou nabídku. <a href={`${base}/poptavky`}>Procházet poptávky</a></div>
        ) : (
          <div className="svc-table" role="list">
            {offers.map((offer) => {
              const newMessages = unread.byOffer.get(offer.id) ?? 0;
              return (
                <div key={offer.id} className="svc-trow" role="listitem">
                  <div className="svc-trow__main">
                    <a className="svc-trow__title" href={`${base}/poptavka/${offer.request_id}`}>{offer.request?.title ?? "Poptávka"}</a>
                    <span className="svc-small">{money(offer.price)} · odesláno {dateLabel(offer.created_at)}{offer.request ? <> · poptávka: <StatusBadge status={offer.request.status} /></> : null}</span>
                  </div>
                  <div className="svc-trow__meta">
                    {newMessages ? <span className="svc-navbadge">{newMessages} nové</span> : null}
                    <StatusBadge status={offer.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "ulozene" ? (
        bookmarks.length === 0 ? (
          <div className="svc-empty">
            <SvcIcon name="bookmark" size={22} />
            <p>Zatím nic uloženého. Poptávky si uložíte ikonou záložky ve výpisu.</p>
          </div>
        ) : (
          <div className="svc-rlist">
            {bookmarks.map((request) => (
              <div key={request.id} className={request.status === "open" ? undefined : "svc-dim"}>
                {request.status !== "open" ? <p className="svc-small" style={{ margin: "0 0 6px" }}><StatusBadge status={request.status} /> Poptávka už není otevřená.</p> : null}
                <RequestCard request={request} categories={categories} base={base} now={now} bookmark={{ saved: true, loginHref: null }} />
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === "hlidaci" ? (
        <>
          <p className="svc-muted" style={{ marginTop: 0 }}>
            Hlídací pes pošle e-mail, když přibude poptávka odpovídající vašemu hledání (nejvýš jednou za hodinu).
            Nového přidáte ve <a href={`${base}/poptavky`}>výpisu poptávek</a> tlačítkem „Hlídat nové poptávky“.
          </p>
          {searches.length === 0 ? (
            <div className="svc-empty"><SvcIcon name="bell" size={22} /><p>Zatím žádný hlídací pes.</p></div>
          ) : (
            <div className="svc-table" role="list">
              {searches.map((search) => {
                const filters = parseRequestFilters(new URLSearchParams(search.query), categories);
                return (
                  <div key={search.id} id={`saved-${search.id}`} className="svc-trow" role="listitem">
                    <div className="svc-trow__main">
                      <a className="svc-trow__title" href={`${base}/poptavky?${search.query}`}>{search.name}</a>
                      <span className="svc-small">
                        {describeFilters(filters, categories)} · vytvořeno {dateLabel(search.created_at)}
                        {search.last_notified_at ? <> · poslední e-mail {dateLabel(search.last_notified_at)}</> : null}
                      </span>
                    </div>
                    <div className="svc-trow__meta"><SavedSearchActions id={search.id} notify={search.notify} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
