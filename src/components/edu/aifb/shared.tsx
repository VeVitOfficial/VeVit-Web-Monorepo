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

/** Zamčená lekce (student, učitel ji ještě neodemkl) není odkaz; `locked` je text stavu. */
export function LessonRow({
  href, kindLabel, title, meta, status, locked,
}: { href: string; kindLabel: string; title: string; meta?: string; status?: ReactNode; locked?: string }) {
  if (locked) {
    return (
      <li className="aifb-lesson-row aifb-lesson-row--locked">
        <span className="aifb-lesson-row__body">
          <span className="aifb-lesson-row__kind">{kindLabel}</span>
          <span className="aifb-lesson-row__title">{title}</span>
          {meta ? <span className="aifb-lesson-row__meta">{meta}</span> : null}
          <span className="aifb-badge aifb-badge--lock">{locked}</span>
        </span>
      </li>
    );
  }
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

/** Štítek: „Teorie“, nebo „Lekce 3“ (lekce = cvičení 1–5; teorie mezi lekce nepatří). */
export function lessonKindLabel(t: AifbT, lesson: { type: "theory" | "exercise"; order: number }): string {
  return lesson.type === "theory" ? t("aifb.lesson.theory") : t("aifb.lesson.exercise", { n: lesson.order });
}

/** Ukazatel postupu: číslo + tenký pruh (informace není jen barvou). */
export function ProgressBadge({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <span className="aifb-progress" role="img" aria-label={`${label}: ${done} / ${total}`}>
      <span className="aifb-progress__text">{done} / {total}</span>
      <span className="aifb-progress__bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
    </span>
  );
}

/** Upozornění / poznámka u sekce (např. ochrana údajů u lekcí s AI). */
export function SectionCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="aifb-callout" role="note" aria-label={title}>
      <p className="aifb-callout__title">{title}</p>
      {children}
    </aside>
  );
}
