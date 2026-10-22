// Karta levelu (seznamový pohled i podklad pro mapy): kód, název, podtitul, ročníky, hodiny,
// počet lekcí, doporučení pro pokročilé a štítek certifikace („Připravuje se").
// Pracuje s LevelSummary (malý podstrom obsahu), aby se na klienta neposílal celý obsah.

import Link from "next/link";
import type { ReactNode } from "react";
import { aifbT, countWord } from "@/lib/edu/aifb/i18n";
import { levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import type { Certification, CategoryId, Level, Visual } from "@/lib/edu/aifb/types";
import { lessonsLabel, type EduLocale } from "@/lib/edu/i18n-data";
import { CertBadge } from "./shared";

/** Co o levelu potřebují přehledy (karty, mapy, tabulka); posílá se do klientských komponent. */
export type LevelSummary = {
  id: string;
  slug: string;
  order: number;
  code: string;
  title: string;
  subtitle?: string;
  grades?: string;
  recommendedPlacement?: string;
  hours: string;
  lessonCount: number;
  certification: Certification;
  visual?: Visual;
  advanced: boolean;
  /** Id lekcí levelu (pro lokální průběh). */
  lessonIds: string[];
};

/** Levely 4–6 (2. stupeň, SŠ) jsou určené pokročilým / kroužkům (recommendedPlacement). */
export function isAdvanced(level: Pick<Level, "order">, categoryId: string): boolean {
  return categoryId !== "zs1" && level.order >= 4;
}

export function toLevelSummary(categoryId: CategoryId, level: Level): LevelSummary {
  return {
    id: level.id,
    slug: levelSlug(categoryId, level.id),
    order: level.order,
    code: level.code,
    title: level.title,
    subtitle: level.subtitle,
    grades: level.grades,
    recommendedPlacement: level.recommendedPlacement,
    hours: level.hours,
    lessonCount: level.lessons.length,
    certification: level.certification,
    visual: level.visual,
    advanced: isAdvanced(level, categoryId),
    lessonIds: level.lessons.map((lesson) => lesson.id),
  };
}

export function LevelCard({
  locale, categoryId, level, progress,
}: { locale: EduLocale; categoryId: CategoryId; level: LevelSummary; progress?: ReactNode }) {
  const t = aifbT(locale);
  return (
    <li className="aifb-level-card">
      <Link href={levelPath(locale, categoryId, level.slug)}>
        <span className="aifb-level-card__code">{level.code}</span>
        <span className="aifb-level-card__title">{level.title}</span>
        {level.subtitle ? <span className="aifb-level-card__sub">{level.subtitle}</span> : null}
        <span className="aifb-level-card__meta">
          {level.grades ?? level.recommendedPlacement ?? ""}
          {" · "}
          {level.hours}
          {" · "}
          {lessonsLabel(level.lessonCount, locale)}
        </span>
        <span className="aifb-level-card__badges">
          {level.advanced ? <span className="aifb-badge">{t("aifb.level.advanced")}</span> : null}
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
