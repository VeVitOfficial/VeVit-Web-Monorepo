// Sdílené malé komponenty AIFB: štítek certifikace (vždy „Připravuje se"), řádek lekce,
// karta levelu. Téma (pirate-map / trail / clean) mění vzhled přes CSS třídu rodiče, data jsou stejná.

import Link from "next/link";
import type { ReactNode } from "react";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { Certification } from "@/lib/edu/aifb/types";

export function CertBadge({ certification, t }: { certification: Certification; t: AifbT }) {
  if (!certification) return null;
  const label = certification.name
    ? t("aifb.level.certificationNamed", { name: certification.name })
    : t("aifb.level.certification");
  // Stav je vždy „Připravuje se", dokud provozovatel nerozhodne jinak (pravidlo R4).
  return <span className="aifb-badge aifb-badge--cert">{label}</span>;
}

export function LessonRow({
  href, kindLabel, title, meta, status,
}: { href: string; kindLabel: string; title: string; meta?: string; status?: ReactNode }) {
  return (
    <li className="aifb-lesson-row">
      <Link href={href}>
        <span className="aifb-lesson-row__kind">{kindLabel}</span>
        <span className="aifb-lesson-row__title">{title}</span>
        {meta ? <span className="aifb-lesson-row__meta">{meta}</span> : null}
        {status}
      </Link>
    </li>
  );
}

/** Štítek typu lekce podle tématu: „Povídání u mapy" / „Úkol 3" / „Teorie" / „Cvičení 3". */
export function lessonKindLabel(t: AifbT, theme: string, lesson: { type: "theory" | "exercise"; order: number }): string {
  return lesson.type === "theory"
    ? t(`aifb.theme.${theme}.theory`)
    : t(`aifb.theme.${theme}.exercise`, { n: lesson.order });
}
