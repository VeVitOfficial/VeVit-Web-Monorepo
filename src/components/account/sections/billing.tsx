"use client";

import { useCallback, useEffect, useState } from "react";
import { accountT as t, accountFormatDate, type AccountLocale } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { StateError } from "../ui";

/** Port of loadBilling from app.js — static until paid tiers ship. */

type SubscriptionData = {
  subscription: {
    tier: string;
    status: string;
    started_at: string;
    expires_at: string | null;
  } | null;
};

function statusLabel(status: unknown, locale: AccountLocale): string {
  const known = ["active", "trialing", "past_due", "canceling", "canceled"];
  return known.includes(String(status)) ? t(`sub.${String(status)}`, locale) : t("sub.none", locale);
}

export function BillingSection() {
  const locale = useAccountLocale();
  const run = useAccountApi();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [failed, setFailed] = useState(false);

  const fetch = useCallback(() => run<SubscriptionData>("subscription.php"), [run]);

  const refresh = useCallback(() => {
    fetch().then(
      (data) => {
        setData(data);
        setFailed(false);
      },
      (error) => {
        console.error("Billing load failed", error);
        setFailed(true);
      },
    );
  }, [fetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (failed) {
    return <StateError message={t("billing.loadFailed", locale)} onRetry={refresh} retryLabel={t("action.retry", locale)} />;
  }
  if (!data) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  const subscription = data.subscription;
  return (
    <section>
      <article className="card">
        <div className="card-heading">
          <div>
            <h2>{t("billing.currentTier", locale)}</h2>
            <p>{t("billing.currentTierDesc", locale)}</p>
          </div>
        </div>
        {subscription ? (
          <>
            <strong className="metric-value">{subscription.tier}</strong>
            <p className="overview-detail">
              {statusLabel(subscription.status, locale)} · {accountFormatDate(subscription.started_at, locale)}
              {subscription.expires_at ? ` · ${t("billing.renewal", locale)} ${accountFormatDate(subscription.expires_at, locale)}` : ""}
            </p>
          </>
        ) : (
          <>
            <strong className="metric-value">{t("billing.noSubscription", locale)}</strong>
            <p className="overview-detail">{t("billing.freeTier", locale)}</p>
          </>
        )}
      </article>

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("billing.availableTiers", locale)}</h2>
            <p>{t("billing.availableDesc", locale)}</p>
          </div>
          <button className="btn btn--ghost btn--sm" type="button" disabled>{t("billing.comingSoon", locale)}</button>
        </div>
      </article>

      <article className="card">
        <div className="card-heading">
          <div>
            <h2>{t("billing.invoicesTitle", locale)}</h2>
            <p>{t("billing.noInvoices", locale)}</p>
          </div>
        </div>
      </article>
    </section>
  );
}