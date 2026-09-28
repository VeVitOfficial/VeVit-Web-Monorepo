// Serverový rámec stránek AI gramotnosti: Edu shell + data kurzu a přihlášení.

import type { ReactNode } from "react";
import { EduRoot } from "@/components/edu/edu-root";
import { aiGramCourse, loadAiGramSession } from "@/lib/edu/ai-gramotnost";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { AiGramShell } from "./shell";

export async function AiGramFrame({ locale, children }: { locale: EduLocale; children: ReactNode }) {
  const session = await loadAiGramSession();
  return (
    <EduRoot locale={locale}>
      <AiGramShell authenticated={session.authenticated} csrfToken={session.csrfToken} locale={locale} course={aiGramCourse()}>
        {children}
      </AiGramShell>
    </EduRoot>
  );
}
