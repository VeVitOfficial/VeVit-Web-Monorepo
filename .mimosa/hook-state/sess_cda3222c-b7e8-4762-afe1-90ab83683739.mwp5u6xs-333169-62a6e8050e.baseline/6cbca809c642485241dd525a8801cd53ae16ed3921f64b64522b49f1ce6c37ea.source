"use client";

import type { ReactNode } from "react";
import { registerAccountDict } from "@/lib/account-i18n";

/**
 * Předá klientským komponentám účtu slovník od serveru (jen aktuální jazyk + cs), místo aby
 * se do JS bundlu dostalo všech 7 jazyků. Registruje se při renderu rodiče, tedy dřív, než
 * děti zavolají accountT() — při SSR i hydrataci. Registrace je idempotentní (per jazyk).
 */
export function AccountI18n({ dicts, children }: { dicts: Record<string, Record<string, string>>; children: ReactNode }) {
  registerAccountDict(dicts);
  return <>{children}</>;
}
