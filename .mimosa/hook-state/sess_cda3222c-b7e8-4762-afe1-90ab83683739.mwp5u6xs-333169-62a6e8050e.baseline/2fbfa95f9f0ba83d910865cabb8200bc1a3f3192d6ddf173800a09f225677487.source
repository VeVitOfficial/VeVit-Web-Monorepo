"use client";

import { useCallback, useEffect, useState } from "react";
import { accountT as t } from "@/lib/account-i18n";
import { RANKS, rankForLevel, type LevelProgress } from "@/lib/ranks";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { SectionSkeleton, StateError } from "../ui";

/** Level, rank badges and progress to the next level (xp.php). */

type XpData = {
  progress: LevelProgress;
  week_xp: number;
  access: { tier: string; ranks: string[]; permissions: string[] };
};

export function XpCard() {
  const locale = useAccountLocale();
  const run = useAccountApi();
  const [data, setData] = useState<XpData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    run<XpData>("xp.php").then(
      (result) => {
        setData(result);
        setFailed(false);
      },
      (error) => {
        console.error("XP overview failed", error);
        setFailed(true);
      },
    );
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  const progress = data?.progress;
  const levelRank = progress ? rankForLevel(progress.level) : null;
  // Level rank first (always shown next to the level), then the rest by priority.
  const otherRanks = (data?.access.ranks ?? []).filter((key) => RANKS[key]?.kind !== "level");

  return (
    <article className="card overview-card overview-card--wide xp-card" aria-labelledby="overviewXpTitle">
      <div className="card-heading">
        <span className="card-icon card-icon--green" aria-hidden="true">✦</span>
        <div>
          <h2 id="overviewXpTitle">{t("overview.xp.title", locale)}</h2>
          <p>{t("overview.xp.desc", locale)}</p>
        </div>
      </div>
      {failed ? (
        <StateError message={t("overview.xp.loadFailed", locale)} onRetry={load} retryLabel={t("action.retry", locale)} />
      ) : data && progress && levelRank ? (
        <div className="state-host" data-state="success" aria-live="polite">
          <div className="metric-row">
            <strong className="metric-value">{t("overview.xp.level", locale, { level: progress.level })}</strong>
            <span className="metric-label">{t("overview.xp.total", locale, { n: progress.xp.toLocaleString(locale) })}</span>
          </div>
          <div className="rank-chips">
            <span className="rank-chip" style={{ "--rank-color": levelRank.color } as React.CSSProperties}>
              {t(`rank.${levelRank.key}`, locale)}
            </span>
            {otherRanks.map((key) => (
              <span key={key} className="rank-chip" style={{ "--rank-color": RANKS[key]?.color ?? "#9aa4b2" } as React.CSSProperties}>
                {t(`rank.${key}`, locale)}
              </span>
            ))}
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.pct}
            aria-label={t("overview.xp.title", locale)}
          >
            <div className="progress-value" style={{ width: `${progress.pct}%` }} />
          </div>
          <p className="overview-detail">
            {progress.nextLevelAt === null
              ? t("overview.xp.max", locale)
              : t("overview.xp.toNext", locale, {
                  n: (progress.nextLevelAt - progress.xp).toLocaleString(locale),
                  level: progress.level + 1,
                })}
            {data.week_xp > 0 ? ` · ${t("overview.xp.week", locale, { n: data.week_xp.toLocaleString(locale) })}` : ""}
          </p>
        </div>
      ) : (
        <SectionSkeleton lines={2} />
      )}
    </article>
  );
}
