import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { SupportFaq } from "@/components/home/support-faq";
import { SupportForm } from "@/components/home/support-form";
import { SupportBehaviors } from "@/components/home/support-behaviors";

// Legacy CSS — import z public/ jako u home stránky. Support stránka
// nepoužívá tailwind ani premium.css, ani lucide/ui.js/localization.js.
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../public/home/assets/css/main.css";
import "../../../../public/home/assets/css/support.css";
import "../../../../public/assets/shared/session.css";
import "../../../../public/assets/shared/app-switcher.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<string> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? headerValue : "cs";
}

export const metadata: Metadata = {
  title: "Podpora a FAQ",
  description: "Nápověda, časté otázky a kontakt na podporu VeVit.",
  icons: {
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0d0d'/><path d='M8 10l4 12h2L18 10h-3l-2 8-2-8H8zm14 0v12h2v-5h3v-2h-3v-3h4v-2h-6z' fill='%2310b981'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0e",
};

export default async function SupportPage() {
  const locale = await readLocale();
  const L = `/${locale}`;
  return (
    <>
      <a className="skip-link" href="#support-main">
        Přejít k obsahu
      </a>

      <header className="support-header">
        <div className="container support-nav">
          <span
            className="wordmark vv-app-brand"
            aria-label="VeVit Technologies"
          >
            <a href={`${L}/home`}>VeVit</a>
            <a className="wordmark-suffix" href={`${L}/home`}>
              Technologies
            </a>
          </span>
          <nav aria-label="Hlavní navigace">
            <a href={`${L}/home`}>Domů</a>
            <a href={`${L}/home#platforms`}>Aplikace</a>
            <a href={`${L}/home/support`} aria-current="page">
              Podpora
            </a>
          </nav>
          <div
            className="support-account-actions vv-app-actions"
            aria-live="polite"
          >
            <span data-vevit-app-switcher data-vevit-app="Home" />
            <span data-vevit-session>
              <span className="account-session-status">Ověřuji účet…</span>
            </span>
          </div>
        </div>
      </header>

      <main id="support-main">
        <SupportFaq locale={locale}>
          <section
            className="support-contact"
            id="contact"
            aria-labelledby="contact-title"
          >
            <div className="support-contact-copy">
              <span className="eyebrow">Kontakt</span>
              <h2 id="contact-title">Nenašli jste odpověď?</h2>
              <p>
                Vyberte aplikaci a popište dotaz nebo chybu. Odpověď pošleme na
                zadaný e-mail.
              </p>
            </div>
            <SupportForm />
          </section>
        </SupportFaq>

        <section
          className="section support-quick-links"
          aria-labelledby="quick-links-title"
        >
          <div className="container">
            <h2 id="quick-links-title" className="sr-only">
              Rychlé odkazy
            </h2>
            <div className="support-quick-grid">
              <a href={`${L}/account/login`}>
                <strong>Přihlášení k účtu</strong>
                <span>Otevřít VeVit Account</span>
              </a>
              <a href="#contact">
                <strong>Nahlásit chybu</strong>
                <span>Přejít na formulář</span>
              </a>
              <a href="mailto:info@vevit.cz" data-contact-email>
                <strong>Přímý kontakt</strong>
                <span>info@vevit.cz</span>
              </a>
            </div>
            <p
              className="email-copy-status"
              data-email-copy-status
              role="status"
              aria-live="polite"
              hidden
            />
          </div>
        </section>
      </main>

      <footer className="footer support-footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a className="wordmark" href={`${L}/home`}>
                VeVit
              </a>
              <p className="footer-tagline">
                Nápověda a kontakt pro aplikace VeVit.
              </p>
            </div>
            <div className="footer-col">
              <h2>Podpora</h2>
              <ul>
                <li>
                  <a href="#faq">Časté otázky</a>
                </li>
                <li>
                  <a href="#contact">Kontakt</a>
                </li>
                <li>
                  <a href="#contact">Nahlásit chybu</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h2>Account</h2>
              <ul>
                <li>
                  <a href={`${L}/account/login`}>Přihlášení</a>
                </li>
                <li>
                  <a href={`${L}/account/register`}>Registrace</a>
                </li>
              </ul>
            </div>
            <div className="footer-col">
              <h2>Sledujte nás</h2>
              <ul>
                <li>
                  <a
                    href="https://www.instagram.com/vevit.cz/"
                    target="_blank"
                    rel="noopener"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/VeVitOfficial"
                    target="_blank"
                    rel="noopener"
                  >
                    X
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/dJumMfWd6r"
                    target="_blank"
                    rel="noopener"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/VeVitOfficial"
                    target="_blank"
                    rel="noopener"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-base">
            <p className="footer-copy">
              © 2025 - <span data-current-year>2026</span> VeVit. Postaveno v
              Česku.
            </p>
          </div>
        </div>
      </footer>

      <SupportBehaviors />
    </>
  );
}