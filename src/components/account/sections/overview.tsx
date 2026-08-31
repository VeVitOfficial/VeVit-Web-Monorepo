"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { accountT as t, accountTp, accountFormatDate, type AccountLocale } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { SectionSkeleton, StateError } from "../ui";

/**
 * Port of loadOverviewCore + loadSubscriptionOverview + render* from app.js:
 * three summary cards (profile, security, subscription) and the activity feed.
 */

type OverviewData = {
  profile: { completion: number; missing: string[] };
  security: { two_factor_enabled: boolean; active_sessions: number; last_password_change: string | null };
  activity: Array<{ kind: string; detail: string; created_at: string }>;
  errors?: { security?: string; activity?: string };
};

type SubscriptionData = {
  subscription: {
    tier: string;
    status: string;
    started_at: string;
    expires_at: string | null;
    billing_cycle: string;
    price: number | null;
  } | null;
  price: { price_czk?: number | null } | null;
};

const ACTIVITY_LABELS: Record<string, [labelKey: string, icon: string]> = {
  login: ["activity.login", "↗"],
  password_change: ["activity.password_change", "◇"],
  profile_update: ["activity.profile_update", "○"],
  session_revoke: ["activity.session_revoke", "×"],
  connection: ["activity.connection", "↗"],
  subscription: ["activity.subscription", "▱"],
  invoice: ["activity.invoice", "▤"],
};

function subscriptionStatus(status: unknown, locale: AccountLocale): string {
  const known = ["active", "trialing", "past_due", "canceling", "canceled"];
  return known.includes(String(status)) ? t(`sub.${String(status)}`, locale) : t("sub.none", locale);
}

export function OverviewSection() {
  const locale = useAccountLocale();
  const run = useAccountApi();
  const [core, setCore] = useState<OverviewData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [failed, setFailed] = useState({ core: false, subscription: false });

  const fetchCore = useCallback(() => run<OverviewData>("account-overview.php"), [run]);
  const fetchSubscription = useCallback(() => run<SubscriptionData>("subscription.php"), [run]);

  const loadCore = useCallback(() => {
    fetchCore().then(
      (data) => {
        setCore(data);
        setFailed((current) => ({ ...current, core: false }));
      },
      (error) => {
        console.error("Account overview failed", error);
        setFailed((current) => ({ ...current, core: true }));
      },
    );
  }, [fetchCore]);

  const loadSubscription = useCallback(() => {
    fetchSubscription().then(
      (data) => {
        setSubscription(data);
        setFailed((current) => ({ ...current, subscription: false }));
      },
      (error) => {
        console.error("Subscription overview failed", error);
        setFailed((current) => ({ ...current, subscription: true }));
      },
    );
  }, [fetchSubscription]);

  useEffect(() => {
    loadCore();
    loadSubscription();
  }, [loadCore, loadSubscription]);

  function actionLink(label: string, route: string) {
    return <Link className="btn btn--ghost btn--sm" href={route === "profile" ? "/account/profile" : `/account/${route}`}>{label}</Link>;
  }

  const completion = Math.max(0, Math.min(100, Number(core?.profile.completion) || 0));
  const sub = subscription?.subscription ?? null;
  const price = subscription?.price?.price_czk ?? (sub ? sub.price : null);
  const interval = sub?.billing_cycle === "yearly" ? t("billing.year", locale) : t("billing.month", locale);

  return (
    <div className="overview-grid">
      <article className="card overview-card" aria-labelledby="overviewProfileTitle">
        <div className="card-heading">
          <span className="card-icon card-icon--green" aria-hidden="true">○</span>
          <div>
            <h2 id="overviewProfileTitle">{t("overview.profile.title", locale)}</h2>
            <p>{t("overview.profile.desc", locale)}</p>
          </div>
        </div>
        {failed.core ? (
          <StateError message={t("overview.profileSummaryFailed", locale)} onRetry={loadCore} retryLabel={t("action.retry", locale)} />
        ) : core ? (
          <div className="state-host" data-state="success" aria-live="polite">
            <div className="metric-row">
              <strong className="metric-value">{core.profile.completion} %</strong>
              <span className="metric-label">{t("overview.completed", locale)}</span>
            </div>
            <div className="progress-track"><div className="progress-value" style={{ width: `${completion}%` }} /></div>
            <p className="overview-detail">
              {core.profile.missing?.length
                ? `${t("overview.missingPrefix", locale)} ${core.profile.missing.join(", ")}.`
                : t("overview.profileComplete", locale)}
            </p>
            <div className="overview-actions">
              {actionLink(core.profile.missing?.length ? t("overview.completeProfile", locale) : t("overview.viewProfile", locale), "profile")}
            </div>
          </div>
        ) : (
          <SectionSkeleton lines={2} />
        )}
      </article>

      <article className="card overview-card" aria-labelledby="overviewSecurityTitle">
        <div className="card-heading">
          <span className="card-icon" aria-hidden="true">◇</span>
          <div>
            <h2 id="overviewSecurityTitle">{t("overview.security.title", locale)}</h2>
            <p>{t("overview.security.desc", locale)}</p>
          </div>
        </div>
        {failed.core ? (
          <StateError message={t("overview.securitySummaryFailed", locale)} onRetry={loadCore} retryLabel={t("action.retry", locale)} />
        ) : core?.errors?.security ? (
          <StateError message={core.errors.security} onRetry={loadCore} retryLabel={t("action.retry", locale)} />
        ) : core ? (
          <div className="state-host" data-state="success" aria-live="polite">
            <div className="metric-row">
              <strong className="metric-value">{core.security.two_factor_enabled ? t("overview.2faOn", locale) : t("overview.2faOff", locale)}</strong>
              <span className="metric-label">{accountTp("overview.activeSessions", Number(core.security.active_sessions) || 0, locale, { n: Number(core.security.active_sessions) || 0 })}</span>
            </div>
            <p className="overview-detail">
              {core.security.last_password_change
                ? `${t("overview.lastPasswordChangePrefix", locale)} ${accountFormatDate(core.security.last_password_change, locale)}.`
                : t("overview.noPasswordChange", locale)}
            </p>
            <div className="overview-actions">
              {actionLink(core.security.two_factor_enabled ? t("overview.manageSecurity", locale) : t("overview.secureAccount", locale), "security")}
            </div>
          </div>
        ) : (
          <SectionSkeleton lines={2} />
        )}
      </article>

      <article className="card overview-card overview-card--wide" aria-labelledby="overviewSubscriptionTitle">
        <div className="card-heading">
          <span className="card-icon" aria-hidden="true">▱</span>
          <div>
            <h2 id="overviewSubscriptionTitle">{t("overview.subscription.title", locale)}</h2>
            <p>{t("overview.subscription.desc", locale)}</p>
          </div>
        </div>
        {failed.subscription ? (
          <StateError message={t("billing.loadFailed", locale)} onRetry={loadSubscription} retryLabel={t("action.retry", locale)} />
        ) : !subscription ? (
          <SectionSkeleton lines={2} />
        ) : !sub ? (
          <div className="state-host" data-state="empty" aria-live="polite">
            <div className="metric-row">
              <strong className="metric-value">{t("overview.noSubscriptionValue", locale)}</strong>
            </div>
            <p className="overview-detail">{t("overview.noSubscriptionDesc", locale)}</p>
            <div className="overview-actions">{actionLink(t("overview.chooseTier", locale), "billing")}</div>
          </div>
        ) : (
          <div className="state-host" data-state="success" aria-live="polite">
            <div className="metric-row">
              <strong className="metric-value">{sub.tier || t("overview.tierDefault", locale)}</strong>
              <span className="metric-label">{subscriptionStatus(sub.status, locale)}</span>
            </div>
            <p className="overview-detail">
              {[
                price !== null && price !== undefined ? `${price} Kč / ${interval}` : "",
                sub.expires_at ? `${t("overview.nextPeriodPrefix", locale)} ${accountFormatDate(sub.expires_at, locale)}` : "",
              ].filter(Boolean).join(" · ") || t("overview.billingUnavailable", locale)}
            </p>
            <div className="overview-actions">{actionLink(t("overview.manageSubscription", locale), "billing")}</div>
          </div>
        )}
      </article>

      <article className="card activity-card" aria-labelledby="activityTitle">
        <div className="card-heading">
          <div>
            <h2 id="activityTitle">{t("overview.activity.title", locale)}</h2>
            <p>{t("overview.activity.desc", locale)}</p>
          </div>
        </div>
        {failed.core ? (
          <StateError message={t("overview.activityFailed", locale)} onRetry={loadCore} retryLabel={t("action.retry", locale)} />
        ) : core?.errors?.activity ? (
          <StateError message={core.errors.activity} onRetry={loadCore} retryLabel={t("action.retry", locale)} />
        ) : !core ? (
          <SectionSkeleton lines={2} />
        ) : !core.activity.length ? (
          <div className="state-card state-card--empty" data-state="empty">
            <span className="state-card__icon" aria-hidden="true">○</span>
            <div>
              <strong>{t("activity.emptyTitle", locale)}</strong>
              <p>{t("activity.emptyDesc", locale)}</p>
            </div>
          </div>
        ) : (
          <div className="state-host activity-list" data-state="success" aria-live="polite">
            {core.activity.map((activity, index) => {
              const [labelKey, icon] = ACTIVITY_LABELS[activity.kind] || ["activity.default", "•"];
              return (
                <div className="activity-item" key={index}>
                  <span className="activity-icon" aria-hidden="true">{icon}</span>
                  <div>
                    <strong>{t(labelKey, locale)}</strong>
                    <p>{activity.detail || t("activity.defaultDetail", locale)}</p>
                  </div>
                  <time dateTime={activity.created_at || ""}>{accountFormatDate(activity.created_at, locale)}</time>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}