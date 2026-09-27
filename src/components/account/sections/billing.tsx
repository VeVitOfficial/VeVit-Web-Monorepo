"use client";

import { useCallback, useEffect, useState } from "react";
import { accountT as t, accountFormatDate, type AccountLocale } from "@/lib/account-i18n";
import { RANKS } from "@/lib/ranks";
import { useAccountLocale } from "../use-account-locale";
import { AccountApiError, useAccountApi } from "../api";
import { StateError } from "../ui";

/**
 * Current subscription, Bronze / Silver / Gold checkout (Stripe) and the
 * Platinum enquiry. Activation happens in the stripe-webhook edge function;
 * this page only starts Checkout or opens the Stripe customer portal.
 */

type SubscriptionData = {
  subscription: {
    tier: string;
    status: string;
    started_at: string;
    expires_at: string | null;
  } | null;
};

type Plan = {
  key: string;
  xp_bonus_pct: number;
  ai_daily_limit: number | null;
  store_discount_pct: number;
  prices: { monthly: number | null; yearly: number | null };
  available: { monthly: boolean; yearly: boolean };
};

type PlansData = { current_tier: string; plans: Plan[] };
type Cycle = "monthly" | "yearly";

const PLATINUM_ENQUIRY = "mailto:info@vevit.cz?subject=VEVIT%20Platinum%20%E2%80%93%20popt%C3%A1vka";

function statusLabel(status: unknown, locale: AccountLocale): string {
  const known = ["active", "trialing", "past_due", "canceling", "canceled"];
  return known.includes(String(status)) ? t(`sub.${String(status)}`, locale) : t("sub.none", locale);
}

export function BillingSection() {
  const locale = useAccountLocale();
  const run = useAccountApi();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<PlansData | null>(null);
  const [failed, setFailed] = useState(false);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const refresh = useCallback(() => {
    Promise.all([run<SubscriptionData>("subscription.php"), run<PlansData>("billing/plans.php")]).then(
      ([subscription, planData]) => {
        setData(subscription);
        setPlans(planData);
        setFailed(false);
      },
      (error) => {
        console.error("Billing load failed", error);
        setFailed(true);
      },
    );
  }, [run]);

  useEffect(() => {
    refresh();
    // Result of the Stripe redirect (?checkout=success|cancelled), read after mount.
    const result = new URLSearchParams(window.location.search).get("checkout");
    if (result !== "success" && result !== "cancelled") return;
    void Promise.resolve().then(() =>
      setMessage(result === "success"
        ? { kind: "ok", text: t("billing.checkoutSuccess", locale) }
        : { kind: "err", text: t("billing.checkoutCancelled", locale) }),
    );
  }, [refresh, locale]);

  async function redirectTo(path: string, body: unknown, key: string) {
    setBusy(key);
    setMessage(null);
    try {
      const result = await run<{ url: string }>(path, { method: "POST", body });
      window.location.assign(result.url);
    } catch (error) {
      setBusy(null);
      setMessage({
        kind: "err",
        text: error instanceof AccountApiError && error.message ? error.message : t("billing.unavailable", locale),
      });
    }
  }

  if (failed) {
    return <StateError message={t("billing.loadFailed", locale)} onRetry={refresh} retryLabel={t("action.retry", locale)} />;
  }
  if (!data || !plans) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  const subscription = data.subscription;
  const subscribed = plans.current_tier !== "free";

  return (
    <section className="account-panel">
      {message && <p className={`status status--${message.kind}`} role="status">{message.text}</p>}

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("billing.currentTier", locale)}</h2>
            <p>{t("billing.currentTierDesc", locale)}</p>
          </div>
          {subscription && (
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              disabled={busy !== null}
              onClick={() => redirectTo("billing/portal.php", {}, "portal")}
            >
              {t("billing.manage", locale)}
            </button>
          )}
        </div>
        <strong className="metric-value">{t(`tier.${plans.current_tier}`, locale)}</strong>
        {subscription ? (
          <p className="overview-detail">
            {statusLabel(subscription.status, locale)} · {accountFormatDate(subscription.started_at, locale)}
            {subscription.expires_at ? ` · ${t("billing.renewal", locale)} ${accountFormatDate(subscription.expires_at, locale)}` : ""}
          </p>
        ) : (
          <p className="overview-detail">{subscribed ? "" : t("billing.freeTier", locale)}</p>
        )}
      </article>

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("billing.availableTiers", locale)}</h2>
            <p>{t("billing.availableDesc", locale)} {t("billing.vatIncluded", locale)}</p>
          </div>
          <div className="cycle-toggle" role="radiogroup" aria-label={t("billing.availableTiers", locale)}>
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={cycle === value}
                className={`btn btn--sm ${cycle === value ? "btn--primary" : "btn--ghost"}`}
                onClick={() => setCycle(value)}
              >
                {t(`billing.${value}`, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className="plan-grid">
          {plans.plans.map((plan) => {
            const price = plan.prices[cycle];
            const isCurrent = plans.current_tier === plan.key;
            const canBuy = !subscribed && plan.available[cycle] && price !== null;
            return (
              <div
                key={plan.key}
                className={`plan-card${isCurrent ? " plan-card--current" : ""}`}
                style={{ "--rank-color": RANKS[plan.key]?.color ?? "#9aa4b2" } as React.CSSProperties}
              >
                <div className="plan-name">
                  {t(`tier.${plan.key}`, locale)}
                  {isCurrent && <span className="badge badge--ok">{t("billing.current", locale)}</span>}
                </div>
                <div className="plan-price">
                  {price === null ? "—" : price.toLocaleString(locale)}{" "}
                  <span>{t(cycle === "monthly" ? "billing.perMonth" : "billing.perYear", locale)}</span>
                </div>
                <ul className="plan-benefits">
                  <li>{t("billing.xpBonus", locale, { n: plan.xp_bonus_pct })}</li>
                  <li>
                    {plan.ai_daily_limit === null
                      ? t("billing.aiUnlimited", locale)
                      : t("billing.aiLimit", locale, { n: plan.ai_daily_limit })}
                  </li>
                  <li>{t("billing.storeDiscount", locale, { n: plan.store_discount_pct })}</li>
                </ul>
                {!subscribed && (
                  <button
                    className="btn btn--primary btn--sm"
                    type="button"
                    disabled={!canBuy || busy !== null}
                    title={canBuy ? undefined : t("billing.unavailable", locale)}
                    onClick={() => redirectTo("billing/checkout.php", { tier: plan.key, billing_cycle: cycle }, plan.key)}
                  >
                    {canBuy ? t("billing.choose", locale, { tier: t(`tier.${plan.key}`, locale) }) : t("billing.comingSoon", locale)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </article>

      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("billing.platinumTitle", locale)}</h2>
            <p>{t("billing.platinumDesc", locale)}</p>
          </div>
          <a className="btn btn--ghost btn--sm" href={PLATINUM_ENQUIRY}>{t("billing.platinumCta", locale)}</a>
        </div>
      </article>
    </section>
  );
}
