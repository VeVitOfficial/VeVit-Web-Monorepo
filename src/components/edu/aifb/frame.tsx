// Serverový rámec stránek AIFB: Edu shell + obsahová plocha ve stylu .aigram (stejné tokeny
// jako zbytek sekce, světlý i tmavý režim) + upozornění, že obsah je zatím jen česky.
// Žákovi ve škole navíc synchronizuje průběh se serverem (vidí ho učitel).

import type { ReactNode } from "react";
import { EduRoot } from "../edu-root";
import { SchoolProgressSync } from "../school/progress-sync";
import { aifbT } from "@/lib/edu/aifb/i18n";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { progressOf } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";

async function StudentSync() {
  const viewer = await getSchoolViewer();
  if (!viewer.student || !viewer.userId) return null;
  const rows = await progressOf([viewer.userId]);
  return (
    <SchoolProgressSync
      csrfToken={viewer.csrfToken}
      server={rows.map((row) => ({ lessonId: row.lessonId, status: row.status, at: row.updatedAt }))}
    />
  );
}

export function AifbFrame({ locale, theme, children }: { locale: EduLocale; theme?: string; children: ReactNode }) {
  const t = aifbT(locale);
  return (
    <EduRoot locale={locale}>
      <StudentSync />
      <div className={`aigram aifb${theme ? ` aifb--${theme}` : ""}`}>
        <main className="aigram-main aifb-main">
          {locale !== "cs" ? <p className="aifb-notice" role="note">{t("aifb.langNotice")}</p> : null}
          {children}
        </main>
      </div>
    </EduRoot>
  );
}
