import type { Metadata } from "next";
import { headers } from "next/headers";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { ForgotForm } from "@/components/account/auth/forgot-form";

// Legacy auth design: tokens + komponenty (.btn/.input).
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";
import "./forgot.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<AccountLocale> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? (headerValue as AccountLocale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: accountT("auth.forgot.docTitle", await readLocale()) };
}

export default async function ForgotPasswordPage() {
  const locale = await readLocale();
  return <ForgotForm locale={locale} />;
}