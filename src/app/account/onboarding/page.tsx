import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { loadSessionFromCookies, AccountBackendUnavailableError } from "@/lib/account-session";
import { OnboardingForm } from "./onboarding-form";

// Styly pro .card/.input/.btn/.auth-brand z legacy account/onboarding.php.
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";

export const metadata = { title: "Dokončit profil — VEVIT" };

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

export default async function OnboardingPage() {
  let session;
  try {
    session = await loadSessionFromCookies();
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
          }}
        >
          <p>Služba je dočasně nedostupná. Zkuste to prosím za chvíli.</p>
        </main>
      );
    }
    throw error;
  }
  if (!session) redirect("/account/login");

  const headerValue = (await headers()).get("x-vv-locale");
  const locale = headerValue && SUPPORTED.includes(headerValue) ? headerValue : "cs";

  return (
    <main className="wrap">
      <OnboardingForm fullName={String(session.user.full_name ?? "")} locale={locale} />
    </main>
  );
}