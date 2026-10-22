// Karta levelu (seznamový pohled i podklad pro mapy): kód, název, podtitul, ročníky, hodiny,
// počet lekcí, doporučení pro pokročilé a štítek certifikace („Připravuje se").

import Link from "next/link";
import type { ReactNode } from "react";
import { aifbT, countWord } from "@/lib/edu/aifb/i18n";
import { levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { CategoryId, Level } from "@/lib/edu/aifb/types";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import { CertBadge } from "./shared";

/** Levely 4–6 (2. stupeň, SŠ) jsou určené pokročilým / kroužkům (recommendedPlacement). */
export function isAdvanced(level: Pick<Level, "order">, categoryId: string): boolean {
  return categoryId !== "zs1" && level.order >= 4;
}

export function LevelCard({
  locale, categoryId, level, progress,
}: { locale: EduLocale; categoryId: CategoryId; level: Level; progress?: ReactNode }) {
  const t = aifbT(locale);
  return (
    <li className="aifb-level-card">
      <Link href={levelPath(locale, categoryId, levelSlug(categoryId, level.id))}>
        <span className="aifb-level-card__code">{level.code}</span>
        <span className="aifb-level-card__title">{level.title}</span>
        {level.subtitle ? <span className="aifb-level-card__sub">{level.subtitle}</span> : null}
        <span className="aifb-level-card__meta">
          {level.grades ?? level.recommendedPlacement ?? ""}
          {" · "}
          {level.hours}
          {" · "}
          {lessonsLabel(level.lessons.length, locale)}
        </span>
        <span className="aifb-level-card__badges">
          {isAdvanced(level, categoryId) ? <span className="aifb-badge">{t("aifb.level.advanced")}</span> : null}
          <CertBadge certification={level.certification} t={t} />
        </span>
        {progress}
      </Link>
    </li>
  );
}

export function levelUnitCount(t: ReturnType<typeof aifbT>, unit: "Blok" | "Level", n: number): string {
  return countWord(t, `aifb.unit.${unit}`, n);
}
