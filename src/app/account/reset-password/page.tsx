import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { ResetForm } from "@/components/account/auth/reset-form";

// Legacy auth design: tokens + komponenty (.btn/.input).
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";
import "./reset.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<AccountLocale> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? (headerValue as AccountLocale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountT("auth.reset.docTitle", await readLocale()) };
}

export default async function ResetPasswordPage() {
  const locale = await readLocale();
  return (
    <Suspense fallback={null}>
      <ResetForm locale={locale} />
    </Suspense>
  );
}