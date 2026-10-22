// Serverový rámec stránek AIFB: Edu shell + obsahová plocha ve stylu .aigram (stejné tokeny
// jako zbytek sekce, světlý i tmavý režim) + upozornění, že obsah je zatím jen česky.

import type { ReactNode } from "react";
import { EduRoot } from "../edu-root";
import { aifbT } from "@/lib/edu/aifb/i18n";
import type { EduLocale } from "@/lib/edu/i18n-data";

export function AifbFrame({ locale, theme, children }: { locale: EduLocale; theme?: string; children: ReactNode }) {
  const t = aifbT(locale);
  return (
    <EduRoot locale={locale}>
      <div className={`aigram aifb${theme ? ` aifb--${theme}` : ""}`}>
        <main className="aigram-main aifb-main">
          {locale !== "cs" ? <p className="aifb-notice" role="note">{t("aifb.langNotice")}</p> : null}
          {children}
        </main>
      </div>
    </EduRoot>
  );
}
