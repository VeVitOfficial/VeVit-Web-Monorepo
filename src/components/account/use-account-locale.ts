"use client";

import { useContext } from "react";
import { usePathname } from "next/navigation";
import { accountLocaleFromPath, type AccountLocale } from "@/lib/account-i18n";
import { AccountLocaleContext } from "./locale-context";

/** Locale pro aktuální stránku — preferuje kontext z layoutu, fallback je
 * URL prefix /<lang>/ (stejné určení jako v originál i18n.js). */
export function useAccountLocale(): AccountLocale {
  const explicit = useContext(AccountLocaleContext);
  const pathname = usePathname();
  return explicit ?? accountLocaleFromPath(pathname ?? "/account");
}