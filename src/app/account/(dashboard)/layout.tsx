import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { loadSessionFromCookies, AccountBackendUnavailableError } from "@/lib/account-session";
import { AccountShell } from "@/components/account/account-shell";
import { SessionProvider, type AccountUser } from "@/components/account/session";
import { AccountLocaleProvider } from "@/components/account/locale-context";
import { accountT, type AccountLocale } from "@/lib/account-i18n";

// Design systém v pořadí podle legacy account/index.php:
// fonty → účtové styly → session (bootstrap states) → app switcher → pill.
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";
import "../../../../public/assets/shared/session.css";
import "../../../../public/assets/shared/app-switcher.css";
import "@/components/account/language-pill.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function requestLocale(): Promise<AccountLocale> {
  const value = (await headers()).get("x-vv-locale");
  return value && SUPPORTED.includes(value) ? (value as AccountLocale) : "cs";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return { title: accountT("doc.sectionSuffix", locale) };
}

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await requestLocale();

  // Paritní verze login_gate_run() z account/index.php: 503, 401 → login,
  // nekompletní profil → /account/onboarding, jinak render s bootstrap daty.
  let user: AccountUser;
  let csrfToken: string;
  try {
    const session = await loadSessionFromCookies();
    if (!session) redirect("/account/login");
    user = session.user as unknown as AccountUser;
    csrfToken = session.csrfToken;
    const fullName = String(user.full_name ?? "").trim();
    const nickname = String(user.nickname ?? "").trim();
    if (!fullName || !nickname) redirect("/account/onboarding");
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily: "var(--font-sans, system-ui)",
            color: "var(--text, inherit)",
          }}
        >
          <p>Služba je dočasně nedostupná. Zkuste to prosím za chvíli.</p>
        </main>
      );
    }
    // redirect() funguje vyhozením — necháme projít i ostatní chyby.
    throw error;
  }

  return (
    <AccountLocaleProvider locale={locale}>
      <SessionProvider user={user} csrfToken={csrfToken}>
        <AccountShell>{children}</AccountShell>
      </SessionProvider>
    </AccountLocaleProvider>
  );
}