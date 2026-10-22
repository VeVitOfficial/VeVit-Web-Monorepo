"use client";

// Přehled levelů kategorie podle tématu (pirate-map / trail / clean). Komponenty dostávají stejná
// data (LevelSummary[]); téma řeší jen vzhled a texty. Každé zobrazení má seznamovou variantu
// (Mapa/Seznam, Karty/Tabulka), kterou čtečka i klávesnice projdou stejně dobře.

import { useState } from "react";
import { useEduLang } from "../i18n";
import type { CategoryId, Theme } from "@/lib/edu/aifb/types";
import { maxXpForLevel } from "@/lib/edu/aifb/xp";
import { AdventureMap, type LevelProgress } from "./adventure-map";
import { CleanOverview } from "./clean-overview";
import { LevelCard, type LevelSummary } from "./level-card";
import { ProgressBadge } from "./shared";
import { TrailMap } from "./trail-map";
import { ViewToggle } from "./view-toggle";

export function LevelsOverview({
  categoryId, theme, levels, progress, xp = 0,
}: { categoryId: CategoryId; theme: Theme; levels: LevelSummary[]; progress?: LevelProgress; xp?: number }) {
  const { t, lang } = useEduLang();
  const [view, setView] = useState<string>(theme === "clean" ? "cards" : "map");
  const visual = theme !== "clean";
  const options = visual
    ? [{ value: "map", label: t(theme === "pirate-map" ? "aifb.map.pirate" : "aifb.map.trail") }, { value: "list", label: t("aifb.view.list") }]
    : [{ value: "cards", label: t("aifb.view.cards") }, { value: "table", label: t("aifb.view.table") }];
  const xpMax = levels.reduce(
    (sum, level) => sum + maxXpForLevel(level.lessonIds.map((id) => (id.endsWith("-teorie") ? "theory" : "exercise"))),
    0,
  );

  let body;
  if (view === "map" && theme === "pirate-map") {
    body = <AdventureMap locale={lang} categoryId={categoryId} levels={levels} progress={progress} />;
  } else if (view === "map") {
    body = <TrailMap locale={lang} categoryId={categoryId} levels={levels} progress={progress} xp={xp} xpMax={xpMax} />;
  } else if (view === "list") {
    body = (
      <ol className="aifb-level-list">
        {levels.map((level) => {
          const p = progress?.[level.id];
          return (
            <LevelCard
              key={level.id}
              locale={lang}
              categoryId={categoryId}
              level={level}
              progress={p ? <ProgressBadge done={p.done} total={p.total} label={t("aifb.progress.label")} /> : undefined}
            />
          );
        })}
      </ol>
    );
  } else {
    body = <CleanOverview locale={lang} categoryId={categoryId} levels={levels} progress={progress} view={view === "table" ? "table" : "cards"} />;
  }

  return (
    <div className={`aifb-overview aifb-overview--${theme}`}>
      <ViewToggle options={options} value={view} onChange={setView} label={t("aifb.view.label")} />
      {body}
    </div>
  );
}
