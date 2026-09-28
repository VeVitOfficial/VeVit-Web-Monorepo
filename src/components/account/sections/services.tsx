"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { accountT as t, accountFormatDate, type AccountLocale } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { SectionSkeleton, StateError } from "../ui";

/**
 * VeVit Services v účtu: aktivní poptávky a nabídky s nepřečtenými zprávami,
 * hodnocení a stav profilu poskytovatele. Data z /account/api/services.php.
 */

export type ServicesSummary = {
  requests: { id: string; title: string; category: string; status: string; offers: number; unread: number; expires_at: string; created_at: string }[];
  offers: { id: string; request_id: string; title: string; status: string; request_status: string | null; price: number; unread: number; created_at: string }[];
  stats: {
    active_requests: number; total_requests: number; active_offers: number; unread: number; completed_jobs: number;
    rating: number | null; reviews: number; saved_searches: number; bookmarks: number;
  };
  provider: { active: boolean; headline: string } | null;
};

const STATUS_KEYS: Record<string, string> = {
  open: "services.status.open", assigned: "services.status.assigned", sent: "services.status.sent", accepted: "services.status.accepted",
};

export function servicesBase(locale: AccountLocale): string {
  return `/${locale}/services`;
}

export function useServicesSummary() {
  const run = useAccountApi();
  const [data, setData] = useState<ServicesSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    run<ServicesSummary>("services.php").then(
      (value) => { setData(value); setFailed(false); },
      (error) => { console.error("Services summary failed", error); setFailed(true); },
    );
  }, [run]);
  useEffect(() => { load(); }, [load]);
  return { data, failed, load };
}

function czk(value: number, locale: AccountLocale): string {
  return `${new Intl.NumberFormat(locale === "en" ? "en-GB" : "cs-CZ").format(value)} Kč`;
}

export function ServicesSection() {
  const locale = useAccountLocale();
  const { data, failed, load } = useServicesSummary();
  const base = servicesBase(locale);

  if (failed) return <StateError message={t("services.loadFailed", locale)} onRetry={load} retryLabel={t("action.retry", locale)} />;
  if (!data) return <div className="card"><SectionSkeleton lines={4} /></div>;
  const { stats } = data;

  return (
    <div className="account-panel">
      <div className="svc-acc-kpis">
        <a className="card svc-acc-kpi" href={`${base}/moje?tab=poptavky`}><strong>{stats.active_requests}</strong><span>{t("services.kpi.requests", locale)}</span></a>
        <a className="card svc-acc-kpi" href={`${base}/moje?tab=nabidky`}><strong>{stats.active_offers}</strong><span>{t("services.kpi.offers", locale)}</span></a>
        <a className={`card svc-acc-kpi${stats.unread ? " is-hot" : ""}`} href={`${base}/moje`}><strong>{stats.unread}</strong><span>{t("services.kpi.unread", locale)}</span></a>
        <div className="card svc-acc-kpi">
          <strong>{stats.rating !== null ? `${stats.rating.toFixed(1)} ★` : "–"}</strong>
          <span>{t("services.kpi.rating", locale, { n: stats.reviews })}</span>
        </div>
      </div>

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("services.requests.title", locale)}</h2>
            <p>{t("services.requests.desc", locale)}</p>
          </div>
          <a className="btn btn--primary btn--sm" href={`${base}/poptavka/nova`}>{t("services.newRequest", locale)}</a>
        </div>
        {data.requests.length === 0 ? (
          <div className="state-card state-card--empty" data-state="empty">
            <span className="state-card__icon" aria-hidden="true">○</span>
            <div><strong>{t("services.requests.emptyTitle", locale)}</strong><p>{t("services.requests.emptyDesc", locale)}</p></div>
          </div>
        ) : (
          <ul className="svc-acc-list">
            {data.requests.map((request) => (
              <li key={request.id}>
                <a href={`${base}/poptavka/${request.id}`}>
                  <span className="svc-acc-list__main">
                    <strong>{request.title}</strong>
                    <small>{request.category} · {t("services.createdAt", locale, { date: accountFormatDate(request.created_at, locale) })}</small>
                  </span>
                  <span className="svc-acc-list__meta">
                    {request.unread ? <span className="svc-acc-dot">{t("services.unread", locale, { n: request.unread })}</span> : null}
                    <span>{t("services.offersCount", locale, { n: request.offers })}</span>
                    <span className="status-badge">{t(STATUS_KEYS[request.status] ?? request.status, locale)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("services.offers.title", locale)}</h2>
            <p>{data.provider ? t("services.offers.desc", locale) : t("services.offers.noProvider", locale)}</p>
          </div>
          <a className="btn btn--ghost btn--sm" href={data.provider ? `${base}/poptavky` : `${base}/profil`}>
            {data.provider ? t("services.browse", locale) : t("services.becomeProvider", locale)}
          </a>
        </div>
        {data.offers.length === 0 ? (
          <div className="state-card state-card--empty" data-state="empty">
            <span className="state-card__icon" aria-hidden="true">○</span>
            <div><strong>{t("services.offers.emptyTitle", locale)}</strong><p>{t("services.offers.emptyDesc", locale)}</p></div>
          </div>
        ) : (
          <ul className="svc-acc-list">
            {data.offers.map((offer) => (
              <li key={offer.id}>
                <a href={`${base}/poptavka/${offer.request_id}`}>
                  <span className="svc-acc-list__main">
                    <strong>{offer.title || t("services.request", locale)}</strong>
                    <small>{czk(offer.price, locale)} · {t("services.sentAt", locale, { date: accountFormatDate(offer.created_at, locale) })}</small>
                  </span>
                  <span className="svc-acc-list__meta">
                    {offer.unread ? <span className="svc-acc-dot">{t("services.unread", locale, { n: offer.unread })}</span> : null}
                    <span className="status-badge">{t(STATUS_KEYS[offer.status] ?? offer.status, locale)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="card">
        <div className="card-heading">
          <div>
            <h2>{t("services.more.title", locale)}</h2>
            <p>{t("services.more.desc", locale, { searches: stats.saved_searches, bookmarks: stats.bookmarks, jobs: stats.completed_jobs })}</p>
          </div>
        </div>
        <div className="overview-actions">
          <a className="btn btn--ghost btn--sm" href={`${base}/moje?tab=hlidaci`}>{t("services.watchdogs", locale)}</a>
          <a className="btn btn--ghost btn--sm" href={`${base}/moje?tab=ulozene`}>{t("services.bookmarks", locale)}</a>
          <a className="btn btn--ghost btn--sm" href={`${base}/profil`}>{t("services.providerProfile", locale)}</a>
        </div>
      </article>
    </div>
  );
}

/** Kompaktní karta do přehledu účtu. */
export function ServicesOverviewCard() {
  const locale = useAccountLocale();
  const { data, failed, load } = useServicesSummary();
  const base = servicesBase(locale);
  return (
    <article className="card overview-card" aria-labelledby="overviewServicesTitle">
      <div className="card-heading">
        <span className="card-icon" aria-hidden="true">⌘</span>
        <div>
          <h2 id="overviewServicesTitle">{t("services.card.title", locale)}</h2>
          <p>{t("services.card.desc", locale)}</p>
        </div>
      </div>
      {failed ? (
        <StateError message={t("services.loadFailed", locale)} onRetry={load} retryLabel={t("action.retry", locale)} />
      ) : !data ? (
        <SectionSkeleton lines={2} />
      ) : (
        <div className="state-host" data-state="success" aria-live="polite">
          <div className="metric-row">
            <strong className="metric-value">{data.stats.active_requests + data.stats.active_offers}</strong>
            <span className="metric-label">{t("services.card.active", locale)}</span>
          </div>
          <p className="overview-detail">
            {data.stats.unread
              ? t("services.card.unread", locale, { n: data.stats.unread })
              : data.requests[0]
                ? t("services.card.latest", locale, { title: data.requests[0].title, n: data.requests[0].offers })
                : t("services.card.empty", locale)}
          </p>
          <div className="overview-actions">
            <Link className="btn btn--ghost btn--sm" href="/account/services">{t("services.card.open", locale)}</Link>
            <a className="btn btn--ghost btn--sm" href={`${base}/poptavka/nova`}>{t("services.newRequest", locale)}</a>
          </div>
        </div>
      )}
    </article>
  );
}
