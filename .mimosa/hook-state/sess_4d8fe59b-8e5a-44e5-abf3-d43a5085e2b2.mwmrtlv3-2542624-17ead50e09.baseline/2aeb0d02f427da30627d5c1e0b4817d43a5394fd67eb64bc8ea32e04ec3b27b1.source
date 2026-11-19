// Serverový obal EduRootClient: přidá slovník jen pro aktuální jazyk (+ cs fallback), aby se do
// klientského bundlu nedostaly slovníky všech 7 jazyků. Stránky dál používají <EduRoot locale>.
import type { ReactNode } from "react";
import { eduDictFor, type EduLocale } from "@/lib/edu/i18n-data";
import { EduRootClient } from "./edu-root-client";

export function EduRoot({ locale, children }: { locale: EduLocale; children: ReactNode }) {
  return <EduRootClient locale={locale} dicts={eduDictFor(locale)}>{children}</EduRootClient>;
}
