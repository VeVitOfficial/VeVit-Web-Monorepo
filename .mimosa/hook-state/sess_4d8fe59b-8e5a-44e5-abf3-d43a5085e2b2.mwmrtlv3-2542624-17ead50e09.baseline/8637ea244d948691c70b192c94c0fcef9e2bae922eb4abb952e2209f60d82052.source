import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { accountDictFor, accountT, type AccountLocale } from "@/lib/account-i18n-server";
import { AccountI18n } from "@/components/account/i18n-provider";
import { Verify2faForm } from "@/components/account/auth/verify-2fa-form";

// Verify-2fa má vlastní standalonový design (žádný styles.css) — viz verify-2fa.css.
import "./verify-2fa.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<AccountLocale> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? (headerValue as AccountLocale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountT("auth.verify2fa.docTitle", await readLocale()) };
}

export default async function Verify2faPage() {
  const locale = await readLocale();
  return (
    <AccountI18n dicts={accountDictFor(locale)}>
      <Suspense fallback={null}>
        <Verify2faForm locale={locale} />
      </Suspense>
    </AccountI18n>
  );
}