"use client";

import { createContext, type ReactNode } from "react";
import type { AccountLocale } from "@/lib/account-i18n";

/**
 * Locale pro dashboard — určuje ho serverový layout z hlavičky x-vv-locale,
 * kterou nastavuje proxy (URL prefix /<lang>/ se při rewrite ztrácí, takže
 * accountLocaleFromPath(usePathname()) by vždy vrátil "cs").
 */
export const AccountLocaleContext = createContext<AccountLocale | null>(null);

export function AccountLocaleProvider({
  locale,
  children,
}: {
  locale: AccountLocale;
  children: ReactNode;
}) {
  return (
    <AccountLocaleContext.Provider value={locale}>
      {children}
    </AccountLocaleContext.Provider>
  );
}