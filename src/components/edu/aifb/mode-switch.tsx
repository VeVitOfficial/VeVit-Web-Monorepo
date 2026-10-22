// Přepínač režimu lekce (Pro učitele / Projekce / Žák): odkazy s ?rezim=..., aktuální je aria-current.

import Link from "next/link";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import { LESSON_MODES, withMode, type LessonMode } from "@/lib/edu/aifb/mode";

export function ModeSwitch({ path, mode, t }: { path: string; mode: LessonMode; t: AifbT }) {
  return (
    <nav className="aifb-toggle aifb-noprint" aria-label={t("aifb.mode.label")}>
      {LESSON_MODES.map((item) => (
        <Link
          key={item}
          href={withMode(path, item)}
          className="aifb-toggle__btn"
          aria-current={item === mode ? "true" : undefined}
          scroll={false}
        >
          {t(`aifb.mode.${item}`)}
        </Link>
      ))}
    </nav>
  );
}
