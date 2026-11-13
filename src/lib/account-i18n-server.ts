import "server-only";

// Serverová strana i18n účtu: zaregistruje celý slovník (metadata, serverové stránky) a vybírá
// podmnožinu pro klienta. Klientské komponenty dál importují @/lib/account-i18n.
import { ACCOUNT_DICT } from "./account-i18n-dict";
import { registerAccountDict, type AccountLocale } from "./account-i18n";

registerAccountDict(ACCOUNT_DICT);

export * from "./account-i18n";

/** Slovník pro klienta: jen daný jazyk + cs (fallback chybějících klíčů). */
export function accountDictFor(locale: AccountLocale): Record<string, Record<string, string>> {
  return locale === "cs" ? { cs: ACCOUNT_DICT.cs } : { cs: ACCOUNT_DICT.cs, [locale]: ACCOUNT_DICT[locale] ?? {} };
}
