import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { RegisterForm } from "@/components/account/auth/register-form";

// Legacy auth design: tokens + komponenty (.btn/.input).
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";
import "./register.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<AccountLocale> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? (headerValue as AccountLocale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountT("auth.register.docTitle", await readLocale()) };
}

export default async function RegisterPage() {
  const locale = await readLocale();
  return (
    <Suspense fallback={null}>
      <RegisterForm locale={locale} />
    </Suspense>
  );
}