import "server-only";

import { headers } from "next/headers";

const LOCALES = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);

/** Locale z hlavičky x-vv-locale, kterou nastaví proxy.ts při rewrite /<lang>/services. */
export async function servicesLocale(): Promise<string> {
  const value = (await headers()).get("x-vv-locale");
  return value && LOCALES.has(value) ? value : "cs";
}
