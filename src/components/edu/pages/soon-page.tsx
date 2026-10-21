"use client";

// „Již brzy" stránka pro oddíly Edu, které se připravují (AI gramotnost, Chemie, Historie).
// Rozložení sdílí hex hrdinu z domovské stránky; každé téma má vlastní animovanou scénu.

import { useEffect } from "react";
import Link from "next/link";
import { useEduLang } from "../i18n";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { AiScene, ChemistryScene, HistoryScene } from "./soon-scenes";

export type SoonTopic = "ai" | "chemistry" | "history";

const TOPICS: Record<SoonTopic, { titleKey: string; Scene: () => React.JSX.Element }> = {
  ai: { titleKey: "home.categories.aiLiteracy", Scene: AiScene },
  chemistry: { titleKey: "home.categories.chemistry", Scene: ChemistryScene },
  history: { titleKey: "home.categories.history", Scene: HistoryScene },
};

export function EduSoonPage({ locale, topic }: { locale: string; topic: SoonTopic }) {
  const { t } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const { titleKey, Scene } = TOPICS[topic];
  const title = t(titleKey);

  useEffect(() => {
    setBreadcrumbs([{ label: title }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, title]);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-6xl mx-auto px-6">
        <section className={`eh-hero es-topic es-topic--${topic}`}>
          <div className="eh-hero__text">
            <h1 className="eh-title es-title">
              <span>{title}</span>
              <span>{t("landing.comingSoon")}.</span>
            </h1>
            <p className="eh-lead">{t(`soon.${topic}.body`)}</p>
            <Link href={`/${locale}/edu`} className="eh-btn es-back">{t("soon.back")}</Link>
          </div>
          <div className="eh-art es-art">
            <div className="eh-hex eh-hex--ring es-ring" aria-hidden="true" />
            <div className="eh-hex eh-hex--core es-core" aria-hidden="true" />
            <Scene />
            <p className="es-caption">{t(`soon.${topic}.caption`)}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
