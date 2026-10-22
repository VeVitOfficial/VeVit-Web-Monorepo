"use client";

// Postup v levelu (hotové lekce z místního průběhu) jako ukazatel s číslem.

import { useEduLang } from "../i18n";
import { levelProgress } from "@/lib/edu/aifb/progress";
import { ProgressBadge } from "./shared";
import { useAifbProgress } from "./use-progress";

export function LevelProgressSummary({ lessonIds }: { lessonIds: string[] }) {
  const { t } = useEduLang();
  const { done, total } = levelProgress(useAifbProgress(), lessonIds);
  return <ProgressBadge done={done} total={total} label={t("aifb.progress.label")} />;
}
