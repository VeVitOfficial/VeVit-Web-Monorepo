import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Icon } from "@/components/home/icon";
import { HomeBehaviors } from "@/components/home/home-behaviors";
import { PremiumBehaviors } from "@/components/home/premium-behaviors";

// Legacy CSS — importujeme z public/ (jako account stránky importují
// ../../../../account/assets/styles.css), aby styl zůstal jediný zdroj.
import "../../../public/assets/fonts/vevit-fonts.css";
import "../../../public/assets/css/vevit-tailwind.css";
import "../../../public/home/assets/css/main.css";
import "../../../public/assets/shared/session.css";
import "../../../public/assets/shared/app-switcher.css";
import "../../../public/home/assets/css/premium.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<string> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? headerValue : "cs";
}

export const metadata: Metadata = {
  title: { absolute: "VeVit | Nástroje, hry a vzdělávání" },
  description: "Nástroje, hry a lekce na jednom místě. Bez reklam.",
  openGraph: {
    type: "website",
    title: "VeVit | Nástroje, hry a vzdělávání",
    description: "Nástroje, hry a lekce na jednom místě. Bez reklam.",
    url: "https://vevit.cz",
    locale: "cs_CZ",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230d0d0d'/><path d='M8 10l4 12h2L18 10h-3l-2 8-2-8H8zm14 0v12h2v-5h3v-2h-3v-3h4v-2h-6z' fill='%2310b981'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
};

// CSS custom properties (--n, --c, …) nejsou v CSSProperties typovaný,
// proto je přetypujeme přes Record<string, string>.
const cssVar = (obj: Record<string, string>): CSSProperties => obj as CSSProperties;

export default async function HomePage() {
  const locale = await readLocale();
  const L = `/${locale}`;
  return (
    <>
      {/* ============ NAV ============ */}
      <header className="nav" data-nav role="banner">
        <div className="container nav-inner">
          <span className="wordmark vv-app-brand" aria-label="VeVit Technologies">
            <a href={`${L}/home`}>VeVit</a>
            <a className="wordmark-suffix" href={`${L}/home`}>
              Technologies
            </a>
          </span>

          <nav
            className="nav-links"
            aria-label="Hlavní navigace"
            data-ui-attr="aria-label:page.nav.ariaMain"
          >
            {/* Web apps */}
            <div className="dropdown-wrap">
              <button
                className="nav-link"
                type="button"
                data-dropdown-trigger
                aria-expanded="false"
                aria-haspopup="true"
                aria-controls="dd-webapps"
              >
                <span data-ui-text="page.nav.webApps">Web apps</span>
                <Icon name="chevron-down" size={14} className="chev" />
              </button>
              <div
                className="dropdown"
                id="dd-webapps"
                data-dropdown-menu
                role="menu"
              >
                <a className="dd-item" href={`${L}/tools`} role="menuitem">
                  <span className="dd-icon">
                    <Icon name="wrench" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Tools{" "}
                      <span
                        className="dd-soon-tag"
                        style={{
                          background: "rgba(65,152,62,0.12)",
                          color: "#41983e",
                          borderColor: "rgba(65,152,62,0.25)",
                        }}
                        data-ui-text="page.nav.badgeBeta"
                      >
                        Beta
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.tools">
                      Kalkulačky a nástroje
                    </span>
                  </span>
                </a>
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="gamepad-2" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Games{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.games">
                      Hry s XP odměnami
                    </span>
                  </span>
                </div>
                <a className="dd-item" href={`${L}/edu`} role="menuitem">
                  <span className="dd-icon">
                    <Icon name="graduation-cap" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Edu{" "}
                      <span
                        className="dd-soon-tag"
                        style={{
                          background: "rgba(150,106,200,0.12)",
                          color: "#966ac8",
                          borderColor: "rgba(150,106,200,0.25)",
                        }}
                        data-ui-text="page.nav.badgeBeta"
                      >
                        Beta
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.edu">
                      Lekce a kvízy
                    </span>
                  </span>
                </a>
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="layers" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Services{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="landing.services.navigation" />
                  </span>
                </div>
                <a className="dd-item" href={`${L}/account`} role="menuitem">
                  <span className="dd-icon">
                    <Icon name="user-round" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Account{" "}
                      <span
                        className="dd-soon-tag"
                        style={{
                          background: "rgba(178,174,52,0.12)",
                          color: "#b2ae34",
                          borderColor: "rgba(178,174,52,0.25)",
                        }}
                        data-ui-text="landing.roadmap.account.status"
                      >
                        V betě
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="landing.account.navigation" />
                  </span>
                </a>
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="search" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Search{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.search">
                      Univerzální vyhledávač
                    </span>
                  </span>
                </div>
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="shopping-bag" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      Store{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.store">
                      Merch a digitální produkty
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop apps */}
            <div className="dropdown-wrap">
              <button
                className="nav-link"
                type="button"
                data-dropdown-trigger
                aria-expanded="false"
                aria-haspopup="true"
                aria-controls="dd-desktop"
              >
                <span data-ui-text="page.nav.desktopApps">Desktop apps</span>
                <Icon name="chevron-down" size={14} className="chev" />
              </button>
              <div
                className="dropdown dd-narrow"
                id="dd-desktop"
                data-dropdown-menu
                role="menu"
              >
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="app-window" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      VeVit Browser{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.browser">
                      Náš webový prohlížeč
                    </span>
                  </span>
                </div>
                <div
                  className="dd-item dd-soon"
                  role="menuitem"
                  aria-disabled="true"
                >
                  <span className="dd-icon">
                    <Icon name="file-text" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">
                      VeVit Office{" "}
                      <span className="dd-soon-tag" data-ui-text="hub.preparing">
                        Připravuje se
                      </span>
                    </span>
                    <span className="dd-desc" data-ui-text="page.navItem.office">
                      Kancelářský balík
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Služby VeVit */}
            <div className="dropdown-wrap">
              <button
                className="nav-link"
                type="button"
                data-dropdown-trigger
                aria-expanded="false"
                aria-haspopup="true"
                aria-controls="dd-services"
              >
                <span data-ui-text="page.nav.services">Služby VeVit</span>
                <Icon name="chevron-down" size={14} className="chev" />
              </button>
              <div
                className="dropdown dd-narrow"
                id="dd-services"
                data-dropdown-menu
                role="menu"
              >
                <a
                  className="dd-item"
                  href="https://www.vevit.space"
                  role="menuitem"
                >
                  <span className="dd-icon">
                    <Icon name="code-2" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">VeVit Software Studios</span>
                    <span className="dd-desc" data-ui-text="page.navItem.studios">
                      Software na míru
                    </span>
                  </span>
                </a>
                <a className="dd-item" href="https://vevit.art" role="menuitem">
                  <span className="dd-icon">
                    <Icon name="palette" size={18} />
                  </span>
                  <span>
                    <span className="dd-name">VeVit Art</span>
                    <span className="dd-desc" data-ui-text="page.navItem.art">
                      Platforma pro umělce
                    </span>
                  </span>
                </a>
              </div>
            </div>

            <a className="nav-link" href="#about" data-ui-text="page.nav.aboutUs">
              O nás
            </a>
            <a className="nav-link" href="#kontakt" data-ui-text="nav.contact">
              Kontakt
            </a>
          </nav>

          <div className="nav-cta vv-app-actions" aria-live="polite">
            <span data-vevit-language />
            <span data-vevit-app-switcher data-vevit-app="Home" />
            <span data-vevit-session>
              <span className="account-session-status">Ověřuji účet…</span>
            </span>
          </div>

          <button
            className="hamburger"
            type="button"
            data-mobile-open
            aria-expanded="false"
            aria-controls="mobile-panel"
            aria-label="Otevřít menu"
            data-ui-attr="aria-label:page.nav.ariaOpen"
          >
            <Icon name="menu" size={20} />
          </button>
        </div>
      </header>

      {/* ============ MOBILE PANEL ============ */}
      <div className="mobile-overlay" data-mobile-overlay aria-hidden="true" />
      <aside
        className="mobile-panel"
        id="mobile-panel"
        data-mobile-panel
        aria-label="Mobilní navigace"
        data-ui-attr="aria-label:page.nav.ariaMobile"
      >
        <div className="mobile-head">
          <span className="wordmark">VeVit</span>
          <button
            className="mobile-close"
            type="button"
            data-mobile-close
            aria-label="Zavřít menu"
            data-ui-attr="aria-label:page.nav.ariaClose"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        <ul className="mobile-links">
          <li className="mobile-group" data-ui-text="page.mobile.groupWebApps">
            Webové aplikace
          </li>
          <li>
            <a href={`${L}/tools`}>Tools</a>
          </li>
          <li>
            <a href={`${L}/home#roadmap`}>Games</a>
          </li>
          <li>
            <a href={`${L}/edu`}>Edu</a>
          </li>
          <li>
            <a href="https://services.vevit.cz">Services</a>
          </li>
          <li>
            <a href={`${L}/account`}>Account</a>
          </li>
          <li className="mobile-group" data-ui-text="page.mobile.groupServices">
            Služby VeVit
          </li>
          <li>
            <a href="https://www.vevit.space">VeVit Software Studios</a>
          </li>
          <li>
            <a href="https://vevit.art">VeVit Art</a>
          </li>
          <li className="mobile-group" data-ui-text="page.mobile.groupMore">
            Další
          </li>
          <li>
            <a href="#about" data-ui-text="page.nav.aboutUs">
              O nás
            </a>
          </li>
          <li>
            <a href="#kontakt" data-ui-text="nav.contact">
              Kontakt
            </a>
          </li>
        </ul>
        <div className="mobile-cta" data-vevit-session aria-live="polite">
          <span className="account-session-status">Ověřuji účet…</span>
        </div>
      </aside>

      <main>
        {/* ============ HERO (EPIC) ============ */}
        <section className="hero-epic" aria-labelledby="hero-h1">
          <div className="container">
            <div className="hero-grid-epic">
              <div className="rise">
                <span className="eyebrow">
                  <Icon name="sparkles" size={12} />{" "}
                  <span data-ui-text="page.hero.eyebrow">
                    Český digitální ekosystém
                  </span>
                </span>
                <h1 id="hero-h1" className="hero-h1-epic">
                  <span data-ui-text="page.hero.h1a">Nástroje, hry</span>
                  <br />
                  <span data-ui-text="page.hero.h1b">a lekce.</span>
                  <br />
                  <span className="strike-word" data-ui-text="page.hero.h1c">
                    Bez reklam.
                  </span>
                </h1>
                <p className="hero-sub-epic">
                  <strong
                    style={{ color: "var(--text)", fontWeight: 600 }}
                    data-ui-text="landing.counts.toolsLabel"
                  />{" "}
                  <span data-ui-text="page.hero.sub">
                    21+ her a 300+ lekcí. Nástroje můžeš používat přímo v
                    prohlížeči.
                  </span>
                </p>
                <div className="hero-cta-row">
                  <a
                    className="btn btn-primary"
                    href={`${L}/tools`}
                    data-track="hero:tools"
                  >
                    <span data-ui-text="page.hero.ctaTools">Otevřít Tools</span>
                    <Icon name="arrow-right" size={16} />
                  </a>
                  <a
                    className="btn btn-ghost"
                    href="#platforms"
                    data-track="hero:explore"
                    data-ui-text="page.hero.ctaExplore"
                  >
                    Prozkoumat ekosystém
                  </a>
                </div>

                <div className="hero-meta">
                  <div className="hero-meta-item">
                    <span
                      className="hero-meta-num acc"
                      data-ui-text="landing.counts.tools"
                    />
                    <span data-ui-text="page.hero.metaTools">nástrojů</span>
                  </div>
                  <span className="hero-meta-sep" aria-hidden="true" />
                  <div className="hero-meta-item">
                    <span className="hero-meta-num">21+</span>
                    <span data-ui-text="page.hero.metaGames">her</span>
                  </div>
                  <span className="hero-meta-sep" aria-hidden="true" />
                  <div className="hero-meta-item">
                    <span className="hero-meta-num">300+</span>
                    <span data-ui-text="page.hero.metaLessons">lekcí</span>
                  </div>
                </div>
              </div>

              <div className="orbit rise rise-2" aria-hidden="true">
                <span className="orbit-tag tag-1">vevit.cz/tools</span>
                <span className="orbit-tag tag-2">games.vevit.cz</span>
                <span className="orbit-tag tag-3">vevit.cz/edu</span>
                <span className="orbit-tag tag-4">services.vevit.cz</span>

                <div className="orbit-ring" />
                <div className="orbit-ring r2" />
                <div className="orbit-ring r3" />
                <div className="orbit-ring r4" />

                <div className="orbit-core">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dekorativní orbit logo */}
                  <img
                    className="orbit-core-logo"
                    src="/home/images/logo_text.webp"
                    alt=""
                  />
                </div>

                {/* Outer ring, fast, 4 nodes */}
                <div className="orbit-track t-fast">
                  <span
                    className="orbit-node n-pos-1"
                    style={cssVar({ "--n": "var(--c-tools)" })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="wrench"
                        size={22}
                        style={{ color: "var(--c-tools)" }}
                      />
                    </span>
                  </span>
                  <span
                    className="orbit-node n-pos-2"
                    style={cssVar({ "--n": "var(--c-games)" })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="gamepad-2"
                        size={22}
                        style={{ color: "var(--c-games)" }}
                      />
                    </span>
                  </span>
                  <span
                    className="orbit-node n-pos-3"
                    style={cssVar({ "--n": "var(--c-edu)" })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="graduation-cap"
                        size={22}
                        style={{ color: "var(--c-edu)" }}
                      />
                    </span>
                  </span>
                  <span
                    className="orbit-node n-pos-4"
                    style={cssVar({ "--n": "var(--c-services)" })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="layers"
                        size={22}
                        style={{ color: "var(--c-services)" }}
                      />
                    </span>
                  </span>
                </div>

                {/* Mid ring, slow reverse */}
                <div className="orbit-track t-rev" style={{ inset: "18%" }}>
                  <span
                    className="orbit-node n-pos-5"
                    style={cssVar({
                      "--n": "var(--c-account)",
                      width: "42px",
                    })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="user"
                        size={18}
                        style={{ color: "var(--c-account)" }}
                      />
                    </span>
                  </span>
                  <span
                    className="orbit-node n-pos-6"
                    style={cssVar({
                      "--n": "var(--c-search)",
                      width: "42px",
                    })}
                  >
                    <span className="orbit-node-inner">
                      <Icon
                        name="search"
                        size={18}
                        style={{ color: "var(--c-search)" }}
                      />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ O PROJEKTU ============ */}
        <section className="section solo-note-section" aria-labelledby="solo-note-h2">
          <div className="container">
            <div className="solo-note">
              <span
                className="eyebrow"
                id="solo-note-h2"
                data-ui-text="page.soloNote.eyebrow"
              >
                O projektu
              </span>
              <p data-ui-text="page.soloNote.text">
                VeVit ve volném čase vyvíjí jeden člověk — Vít. Tools, Edu a
                Account běží v betě, zbytek ekosystému postupně přibývá.
              </p>
            </div>
          </div>
        </section>

        {/* Marquee stat strip */}
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>
              <span className="dot" />
              <span data-ui-text="landing.counts.toolsMarquee" />
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.games">21+ HER</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.lessons">300+ LEKCÍ</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.noAds">BEZ REKLAM</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.local">
                VŠE LOKÁLNĚ V PROHLÍŽEČI
              </span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.cz">POSTAVENO V ČR</span>
            </span>
            {/* duplicate for loop */}
            <span>
              <span className="dot" />
              <span data-ui-text="landing.counts.toolsMarquee" />
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.games">21+ HER</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.lessons">300+ LEKCÍ</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.noAds">BEZ REKLAM</span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.local">
                VŠE LOKÁLNĚ V PROHLÍŽEČI
              </span>
            </span>
            <span>
              <span className="dot" />
              <span data-ui-text="page.marquee.cz">POSTAVENO V ČR</span>
            </span>
          </div>
        </div>

        {/* ============ PROZKOUMEJTE DALŠÍ ČASTI VEVIT ============ */}
        <section
          className="section explore-section"
          id="explore"
          aria-labelledby="explore-h2"
        >
          <div className="container">
            <header className="section-head-c">
              <span className="eyebrow">
                <Icon name="compass" size={12} />{" "}
                <span data-ui-text="page.explore.eyebrow">Více než web</span>
              </span>
              <h2
                id="explore-h2"
                className="t-2xl"
                style={{ margin: "12px 0 12px" }}
                data-ui-text="page.explore.title"
              >
                Další projekty VeVit
              </h2>
              <p data-ui-text="page.explore.subtitle">
                Vedle webových aplikací vyvíjíme software na míru a připravujeme
                platformu pro umělce.
              </p>
            </header>

            <div className="explore-grid">
              <a
                className="explore-card"
                href="https://www.vevit.space"
                data-track="explore:studios"
              >
                <div className="explore-icon">
                  <Icon name="code-2" size={28} />
                </div>
                <h3>VeVit Software Studios</h3>
                <p data-ui-text="page.explore.studiosDesc">
                  Vyvíjíme webové aplikace, interní systémy a integrace na míru
                  firmám i jednotlivcům.
                </p>
                <span className="explore-tag" data-ui-text="page.explore.studiosTag">
                  Software na míru
                </span>
                <span className="explore-cta">
                  vevit.space <Icon name="arrow-up-right" size={16} />
                </span>
              </a>

              <a
                className="explore-card"
                href="https://vevit.art"
                data-track="explore:art"
              >
                <div className="explore-icon">
                  <Icon name="palette" size={28} />
                </div>
                <h3>VeVit Art</h3>
                <p data-ui-text="page.explore.artDesc">
                  VeVit Art připravujeme pro začínající umělce, kteří chtějí
                  sdílet svou tvorbu.
                </p>
                <span className="explore-tag" data-ui-text="page.explore.artTag">
                  Platforma pro umělce
                </span>
                <span className="explore-cta">
                  vevit.art <Icon name="arrow-up-right" size={16} />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ============ APPS / EPIC BENTO ============ */}
        <section className="section" id="platforms" aria-labelledby="platforms-h2">
          <div className="container">
            <header className="section-head">
              <span className="eyebrow">
                <Icon name="grid-3x3" size={12} />{" "}
                <span data-ui-text="page.platforms.eyebrow">Ekosystém</span>
              </span>
              <h2
                id="platforms-h2"
                className="t-3xl"
                style={{ margin: "8px 0 8px" }}
                data-ui-text="page.platforms.title"
              >
                Webové aplikace
              </h2>
              <p data-ui-text="page.platforms.subtitle">
                Každá aplikace má vlastní zaměření. VeVit účet je postupně
                propojuje.
              </p>
            </header>

            <div className="bento-epic">
              {/* TOOLS HERO CARD */}
              <a
                className="ec ec-tools"
                href={`${L}/tools`}
                data-track="bento:tools"
              >
                <span className="ec-badge" data-ui-text="page.platforms.badgeBeta">
                  Beta testing
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="ec-icon-wrap">
                    <Icon name="wrench" size={22} />
                  </span>
                  <span className="eyebrow" style={{ color: "var(--c-tools)" }}>
                    vevit.cz/tools
                  </span>
                </div>

                <div className="ec-tools-num" data-ui-text="landing.counts.tools" />
                <h3 className="ec-title">Tools</h3>
                <p
                  className="ec-desc"
                  style={{ maxWidth: "420px" }}
                  data-ui-text="page.platforms.toolsDesc"
                >
                  Kalkulačky, konvertory, generátory, PDF nástroje, AI pomocníci
                  a dev utility. Nástroje běží lokálně v prohlížeči. Soubory
                  nemusíš nahrávat na server.
                </p>

                <div className="toolkit-grid" aria-hidden="true">
                  <span className="toolkit-tile hot">
                    <Icon name="calculator" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="palette" size={18} />
                  </span>
                  <span className="toolkit-tile hot">
                    <Icon name="file-text" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="qr-code" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="ruler" size={18} />
                  </span>
                  <span className="toolkit-tile hot">
                    <Icon name="key-round" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="scissors" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="image" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="hash" size={18} />
                  </span>
                  <span className="toolkit-tile hot">
                    <Icon name="braces" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="timer" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="link" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="percent" size={18} />
                  </span>
                  <span className="toolkit-tile">
                    <Icon name="type" size={18} />
                  </span>
                  <span className="toolkit-tile dim">
                    <Icon name="more-horizontal" size={18} />
                  </span>
                  <span className="toolkit-tile dim" />
                </div>

                <span className="ec-arrow">
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </a>

              {/* GAMES */}
              <div className="ec ec-games" aria-disabled="true">
                <span className="ec-badge muted">
                  <Icon name="lock" size={10} />{" "}
                  <span data-ui-text="hub.preparing">Připravuje se</span>
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="gamepad-2" size={22} />
                </span>
                <h3 className="ec-title">Games</h3>
                <p className="ec-desc" data-ui-text="page.platforms.gamesDesc">
                  Připravujeme 21+ her, včetně Snake, Tetrisu, Pac-Mana a 2048.
                </p>
                <div className="ec-meta">
                  <span className="ec-count" style={{ fontSize: "24px" }}>
                    21<sup style={{ fontSize: "0.5em" }}>+</sup>
                  </span>
                  <span data-ui-text="page.platforms.gamesMeta">her na výběr</span>
                </div>
                <div className="pixel-row" aria-hidden="true">
                  <span className="pixel-cell on" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell" />
                  <span className="pixel-cell on" />
                  <span className="pixel-cell on" />
                </div>
              </div>

              {/* EDU */}
              <a
                className="ec ec-edu"
                href={`${L}/edu`}
                data-track="bento:edu"
              >
                <span className="ec-badge" data-ui-text="page.platforms.badgeBeta">
                  Beta testing
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="graduation-cap" size={22} />
                </span>
                <h3 className="ec-title">Edu</h3>
                <p className="ec-desc" data-ui-text="page.platforms.eduDesc">
                  300+ lekcí, kvízů a článků. Programování, matematika, jazyky.
                </p>
                <div className="ec-meta">
                  <span className="ec-count" style={{ fontSize: "24px" }}>
                    300<sup style={{ fontSize: "0.5em" }}>+</sup>
                  </span>
                  <span data-ui-text="page.platforms.eduMeta">lekcí zdarma</span>
                </div>
                <div className="lesson-bars" aria-hidden="true">
                  <span style={{ height: "40%" }} />
                  <span style={{ height: "65%" }} />
                  <span style={{ height: "50%" }} />
                  <span style={{ height: "80%" }} />
                  <span style={{ height: "60%" }} />
                  <span style={{ height: "95%" }} />
                  <span style={{ height: "70%" }} />
                  <span style={{ height: "85%" }} />
                  <span style={{ height: "55%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "90%" }} />
                  <span style={{ height: "62%" }} />
                </div>
                <span className="ec-arrow">
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </a>

              {/* SERVICES */}
              <div className="ec ec-services" aria-disabled="true">
                <span className="ec-badge muted">
                  <Icon name="lock" size={10} />{" "}
                  <span data-ui-text="hub.preparing">Připravuje se</span>
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="layers" size={22} />
                </span>
                <h3 className="ec-title">Services</h3>
                <p className="ec-desc" data-ui-text="landing.services.card" />
                <div className="ec-meta">
                  <span data-ui-text="landing.services.meta" />
                  <span style={{ color: "var(--c-services)" }}>→</span>
                </div>
              </div>

              {/* ACCOUNT */}
              <a
                className="ec ec-account"
                href={`${L}/account`}
                data-track="bento:account"
              >
                <span
                  className="ec-badge"
                  data-ui-text="landing.roadmap.account.status"
                >
                  V betě
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="user-round" size={22} />
                </span>
                <h3 className="ec-title">Account</h3>
                <p className="ec-desc" data-ui-text="landing.account.card" />
                <div className="xp-bar" aria-hidden="true" hidden>
                  <div className="xp-bar-track">
                    <div className="xp-bar-fill" />
                  </div>
                  <div className="xp-bar-meta">
                    <span data-xp-level>LVL 1 · NOVICE</span>
                    <span data-xp-value>0 / 10 000 XP</span>
                  </div>
                </div>
                <span className="ec-arrow">
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </a>

              {/* SEARCH (Soon) */}
              <div className="ec ec-search" aria-disabled="true">
                <span className="ec-badge muted">
                  <Icon name="lock" size={10} />{" "}
                  <span data-ui-text="hub.preparing">Připravuje se</span>
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="search" size={22} />
                </span>
                <h3 className="ec-title">Search</h3>
                <p className="ec-desc" data-ui-text="page.platforms.searchDesc">
                  Univerzální vyhledávač přes celý VeVit ekosystém.
                </p>
                <div className="ec-meta">
                  <span>search.vevit.cz</span>
                </div>
              </div>

              {/* STORE (Soon) */}
              <div className="ec ec-store" aria-disabled="true">
                <span className="ec-badge muted">
                  <Icon name="lock" size={10} />{" "}
                  <span data-ui-text="hub.preparing">Připravuje se</span>
                </span>
                <span className="ec-icon-wrap">
                  <Icon name="shopping-bag" size={22} />
                </span>
                <h3 className="ec-title">Store</h3>
                <p className="ec-desc" data-ui-text="page.platforms.storeDesc">
                  Oficiální merch, digitální produkty a Premium plány.
                </p>
                <div className="ec-meta">
                  <span>vevit.cz/store</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TOOLS SHOWCASE ============ */}
        <section className="section" id="tools" aria-labelledby="tools-h2">
          <div className="container">
            <header className="section-head-c">
              <span className="eyebrow" data-ui-text="page.toolsShowcase.eyebrow">
                Výběr nástrojů
              </span>
              <h2
                id="tools-h2"
                className="t-2xl"
                data-ui-text="page.toolsShowcase.title"
              >
                Nejnovější nástroje
              </h2>
              <p data-ui-text="landing.counts.toolsAvailable" />
            </header>

            <div className="tools-showcase">
              <a
                className="tool-mini"
                href={`${L}/tools/bg-remover`}
                data-tool-slug="bg-remover"
              >
                <span className="tool-badge" data-ui-text="page.toolsShowcase.recommended">
                  Doporučeno
                </span>
                <span className="tool-ico">
                  <Icon name="eraser" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.0.name"
                >
                  Odstranit pozadí
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.images"
                >
                  Obrázky
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.0.desc"
                >
                  Odstraní pozadí z fotografie pomocí AI.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/img-compress`}
                data-tool-slug="img-compress"
              >
                <span className="tool-ico">
                  <Icon name="image" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.1.name"
                >
                  Komprese obrázku
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.images"
                >
                  Obrázky
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.1.desc"
                >
                  Zmenší obrázek a uloží ho jako JPEG nebo WebP.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/pdf-compress`}
                data-tool-slug="pdf-compress"
              >
                <span className="tool-ico">
                  <Icon name="shrink" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.2.name"
                >
                  Komprese PDF
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.pdf"
                >
                  PDF
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.2.desc"
                >
                  Zmenší velikost PDF souboru.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/pdf-merge`}
                data-tool-slug="pdf-merge"
              >
                <span className="tool-ico">
                  <Icon name="files" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.3.name"
                >
                  Sloučení PDF
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.pdf"
                >
                  PDF
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.3.desc"
                >
                  Sloučí více PDF souborů do jednoho.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/qr-generator`}
                data-tool-slug="qr-generator"
              >
                <span className="tool-ico">
                  <Icon name="qr-code" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.4.name"
                >
                  QR generátor
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.dev"
                >
                  Dev
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.4.desc"
                >
                  Vytvoří QR kód pro text, odkaz, Wi-Fi nebo kontakt.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/json-formatter`}
                data-tool-slug="json-formatter"
              >
                <span className="tool-ico">
                  <Icon name="braces" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.5.name"
                >
                  JSON formátovač
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.dev"
                >
                  Dev
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.5.desc"
                >
                  Formátuje a zkontroluje JSON strukturu.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/password-gen`}
                data-tool-slug="password-gen"
              >
                <span className="tool-ico">
                  <Icon name="lock" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.6.name"
                >
                  Generátor hesel
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.security"
                >
                  Bezpečnost
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.6.desc"
                >
                  Vytvoří bezpečné heslo podle zvolených pravidel.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
              <a
                className="tool-mini"
                href={`${L}/tools/translate`}
                data-tool-slug="translate"
              >
                <span className="tool-badge" data-ui-text="page.toolsShowcase.recommended">
                  Doporučeno
                </span>
                <span className="tool-ico">
                  <Icon name="languages" size={18} />
                </span>
                <span
                  className="tool-name"
                  data-ui-text="page.toolsShowcase.tools.7.name"
                >
                  Překlad textu
                </span>
                <span
                  className="tool-category"
                  data-ui-text="page.toolsShowcase.cat.text"
                >
                  Text
                </span>
                <span
                  className="tool-desc"
                  data-ui-text="page.toolsShowcase.tools.7.desc"
                >
                  Přeloží text mezi vybranými jazyky pomocí AI.
                </span>
                <span className="tool-use" data-ui-text="page.toolsShowcase.use">
                  Použít
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ============ ABOUT / WHY-6 ============ */}
        <section className="section" id="about" aria-labelledby="why-h2">
          <div className="container">
            <header className="section-head-c">
              <span className="eyebrow" data-ui-text="page.why.eyebrow">
                O VeVitu
              </span>
              <h2
                id="why-h2"
                className="t-2xl"
                data-ui-text="page.why.title"
              >
                Proč VeVit existuje
              </h2>
              <p data-ui-text="page.why.subtitle">
                VeVit stavíme podle šesti jednoduchých zásad.
              </p>
            </header>

            <div className="why6">
              <article className="why-cell">
                <span className="why-num">01</span>
                <span className="why-icon-wrap">
                  <Icon name="shield-off" size={22} />
                </span>
                <h3 data-ui-text="page.why.cells.0.title">Bez reklam</h3>
                <p data-ui-text="page.why.cells.0.desc">
                  Nepoužíváme personalizované reklamy ani sledovací pixely.
                  Projekt financujeme přes Premium a Store.
                </p>
              </article>

              <article className="why-cell why-cell-stat">
                <span className="why-num">02</span>
                <div className="stat-big" data-ui-text="landing.counts.tools" />
                <h3 data-ui-text="page.why.cells.1.title">
                  Nástroje na jednom místě
                </h3>
                <p data-ui-text="page.why.cells.1.desc">
                  Najdeš tu PDF nástroje, kalkulačky, konvertory, AI pomocníky i
                  nástroje pro vývojáře.
                </p>
              </article>

              <article className="why-cell">
                <span className="why-num">03</span>
                <span className="why-icon-wrap">
                  <Icon name="zap" size={22} />
                </span>
                <h3 data-ui-text="page.why.cells.2.title">
                  Postup, který je vidět
                </h3>
                <p data-ui-text="page.why.cells.2.desc">
                  Za používání aplikací můžeš získávat XP, levely a profilové
                  odměny.
                </p>
              </article>

              <article className="why-cell why-cell-quote">
                <span className="why-num">04</span>
                <h3 data-ui-text="page.why.cells.3.title">
                  Projekt jednoho vývojáře
                </h3>
                <p data-ui-text="page.why.cells.3.desc">
                  VeVit ve volném čase vyvíjí Vít. Jednotlivé aplikace vznikají
                  postupně podle toho, co je připravené k použití.
                </p>
              </article>

              <article className="why-cell">
                <span className="why-num">05</span>
                <span className="why-icon-wrap">
                  <Icon name="globe-2" size={22} />
                </span>
                <h3 data-ui-text="page.why.cells.4.title">Čeština od začátku</h3>
                <p data-ui-text="page.why.cells.4.desc">
                  Rozhraní i podpora vznikají nejdřív v češtině. Další jazyky
                  přidáváme postupně.
                </p>
                <div className="why-timeline">
                  <span className="done" data-ui-text="page.why.timeline4.0">
                    2023 start
                  </span>
                  <span className="done" data-ui-text="page.why.timeline4.1">
                    2024 Tools
                  </span>
                  <span className="now" data-ui-text="page.why.timeline4.2">
                    2025 Premium
                  </span>
                </div>
              </article>

              <article className="why-cell">
                <span className="why-num">06</span>
                <span className="why-icon-wrap">
                  <Icon name="git-branch" size={22} />
                </span>
                <h3 data-ui-text="page.why.cells.5.title">Veřejná roadmapa</h3>
                <p data-ui-text="page.why.cells.5.desc">
                  Na této stránce najdeš aktuální stav aplikací a přehled toho,
                  na čem pracujeme.
                </p>
                <div className="why-timeline">
                  <span className="done" data-ui-text="page.why.timeline5.0">
                    v0.9
                  </span>
                  <span className="now" data-ui-text="page.why.timeline5.1">
                    v1.0 (teď)
                  </span>
                  <span data-ui-text="page.why.timeline5.2">v1.1</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ ROADMAP ============ */}
        <section className="section" id="roadmap" aria-labelledby="roadmap-h2">
          <div className="container">
            <header className="section-head-c">
              <span className="eyebrow" data-ui-text="page.roadmap.eyebrow">
                Roadmap
              </span>
              <h2
                id="roadmap-h2"
                className="t-2xl"
                data-ui-text="page.roadmap.title"
              >
                Co chystáme
              </h2>
              <p data-ui-text="page.roadmap.subtitle">
                Account, Tools a Edu jsou v betě. Ostatní aplikace dál
                připravujeme.
              </p>
            </header>

            <div className="roadmap-track">
              <article className="roadmap-item roadmap-account">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.account.status"
                >
                  V betě
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="user-round" size={20} />
                  </span>
                  <h3>Account</h3>
                </div>
                <p data-ui-text="landing.account.roadmap" />
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_ACCOUNT_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.account.progress" />
                  <span>vevit.cz/account</span>
                </div>
              </article>

              <article className="roadmap-item roadmap-tools">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.tools.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="wrench" size={20} />
                  </span>
                  <h3>Tools</h3>
                </div>
                <p>
                  <span data-ui-text="page.roadmap.toolsDescA">
                    Kalkulačky, konvertory, generátory, PDF nástroje a dev
                    utility. Běží lokálně v prohlížeči na
                  </span>{" "}
                  <strong>vevit.cz/tools</strong>.
                </p>
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_TOOLS_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.tools.progress" />
                </div>
              </article>

              <article className="roadmap-item roadmap-edu">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.edu.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="graduation-cap" size={20} />
                  </span>
                  <h3>Edu</h3>
                </div>
                <p>
                  <span data-ui-text="page.roadmap.eduDescA">
                    Lekce, kvízy a články o programování, matematice a jazycích.
                    Otevřená beta běží na
                  </span>{" "}
                  <strong>vevit.cz/edu</strong>.
                </p>
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_EDU_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.edu.progress" />
                </div>
              </article>

              <article className="roadmap-item roadmap-games">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.games.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="gamepad-2" size={20} />
                  </span>
                  <h3>Games</h3>
                </div>
                <p data-ui-text="page.roadmap.gamesDesc">
                  Připravujeme 21+ her s XP odměnami, včetně Snake, Tetrisu,
                  Pac-Mana a 2048.
                </p>
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_GAMES_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.games.progress" />
                  <span>games.vevit.cz</span>
                </div>
              </article>

              <article className="roadmap-item roadmap-services">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.services.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="layers" size={20} />
                  </span>
                  <h3>Services</h3>
                </div>
                <p data-ui-text="landing.services.roadmap" />
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_SERVICES_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.services.progress" />
                  <span>services.vevit.cz</span>
                </div>
              </article>

              <article className="roadmap-item roadmap-search">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.search.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="search" size={20} />
                  </span>
                  <h3 data-ui-text="page.roadmap.searchTitle">Univerzální Search</h3>
                </div>
                <p>
                  <span data-ui-text="landing.counts.toolsSearch" />{" "}
                  <span data-ui-text="page.roadmap.searchShortcut">
                    Klávesová zkratka
                  </span>{" "}
                  <kbd>⌘K</kbd>{" "}
                  <span data-ui-text="page.roadmap.searchShortcutTail">
                    kdekoliv v ekosystému.
                  </span>
                </p>
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_SEARCH_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.search.progress" />
                </div>
              </article>

              <article className="roadmap-item roadmap-store">
                <div
                  className="roadmap-q"
                  data-ui-text="landing.roadmap.store.status"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="roadmap-icon">
                    <Icon name="shopping-bag" size={20} />
                  </span>
                  <h3>VeVit Store</h3>
                </div>
                <p data-ui-text="page.roadmap.storeDesc">
                  Merch, digitální produkty, e-knihy a kurzy. Premium uživatelé
                  mají 20 % slevu, faktury s DPH automaticky.
                </p>
                <div
                  className="roadmap-prog"
                  data-ui-progress="ROADMAP_STORE_PROGRESS"
                />
                <div className="roadmap-meta">
                  <span data-ui-text="landing.roadmap.store.progress" />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ PREMIUM ============ */}
        <section
          className="premium-section"
          id="premium"
          data-tier-state="free"
          aria-labelledby="premium-h2"
        >
          <div className="container">
            <header className="section-head-c">
              <span className="eyebrow">
                <span data-ui-text="page.premium.eyebrow">Prémiové členství</span>{" "}
                <span
                  className="badge badge-soon"
                  style={{
                    position: "static",
                    display: "inline-flex",
                    verticalAlign: "middle",
                    marginLeft: "8px",
                    fontSize: "11px",
                  }}
                  data-ui-text="landing.premium.status"
                >
                  Připravujeme
                </span>
              </span>
              <h2
                id="premium-h2"
                className="t-2xl"
                style={{ fontWeight: 500 }}
                data-ui-text="landing.premium.title"
              >
                VeVit Premium
              </h2>
            </header>

            {/* Premium připravujeme */}
            <div className="premium-gate">
              <Icon name="sparkles" size={32} />
              <h3 data-ui-text="landing.premium.title">VeVit Premium</h3>
              <p data-ui-text="landing.premium.description">
                VeVit Premium připravujeme. Nech nám kontakt a dáme ti vědět,
                jakmile ho spustíme.
              </p>
              <a
                className="btn btn-ghost"
                href="#kontakt"
                data-premium-notify
                aria-label="Upozornit na spuštění VeVit Premium"
                data-ui-attr="aria-label:landing.premium.notifyAria"
                data-ui-text="landing.premium.notifyCta"
              >
                Upozornit na spuštění
              </a>
            </div>

            {/* Plans (skryté, premium připravujeme) */}
            <div data-premium-plans hidden>
              <div className="billing-wrap">
                <div
                  className="billing-toggle"
                  role="tablist"
                  aria-label="Frekvence plateb"
                >
                  {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- 1:1 legacy markup (role=tab + aria-pressed) */}
                  <button
                    className="billing-btn"
                    data-billing="monthly"
                    aria-pressed="true"
                    role="tab"
                  >
                    Měsíčně
                  </button>
                  {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- 1:1 legacy markup (role=tab + aria-pressed) */}
                  <button
                    className="billing-btn"
                    data-billing="yearly"
                    aria-pressed="false"
                    role="tab"
                  >
                    Ročně
                    <span className="billing-chip">2 měsíce zdarma</span>
                  </button>
                </div>
              </div>

              <div className="tier-grid">
                {/* PREMIUM (individuální) */}
                <article className="tier-card tier-silver" data-tier="premium">
                  <div className="coin coin-silver">
                    <Icon name="medal" size={24} />
                  </div>
                  <div className="tier-avatar-wrap">
                    <div className="tier-avatar">P</div>
                    <div className="tier-frame" />
                  </div>
                  <div className="tier-frame-label">Profilový rámeček</div>

                  <div className="tier-name">Premium</div>
                  <div className="tier-price">
                    <span data-price-monthly="129">129</span>
                    <span data-price-yearly="1290" hidden>
                      1 290
                    </span>{" "}
                    Kč
                  </div>
                  <div className="tier-price-period">
                    <span data-period-monthly>/ měsíc</span>
                    <span data-period-yearly hidden>
                      / rok
                    </span>
                  </div>
                  <div className="tier-price-alt">
                    <span data-alt-monthly>nebo 1 290 Kč / rok</span>
                    <span data-alt-yearly hidden>
                      &nbsp;
                    </span>
                  </div>

                  <div className="tier-divider" />

                  <ul className="tier-perks">
                    <li>Neomezené AI nástroje v Tools a Edu</li>
                    <li>Stahování Edu lekcí offline</li>
                    <li>Prioritní e-mailová podpora</li>
                    <li>20 % sleva ve VeVit Store (po spuštění)</li>
                    <li>Profilový rámeček a +50 % XP</li>
                  </ul>

                  <button className="tier-cta" data-tier-cta="premium">
                    Vybrat Premium
                  </button>
                </article>

                {/* PREMIUM PRO FIRMY */}
                <article
                  className="tier-card tier-platinum"
                  data-tier="business"
                  data-business="true"
                >
                  <span className="tier-pin tier-pin-business">Pro firmy</span>
                  <div className="coin coin-platinum">
                    <Icon name="diamond" size={24} />
                  </div>
                  <div className="tier-avatar-wrap">
                    <div className="tier-avatar">F</div>
                    <div className="tier-frame" />
                  </div>
                  <div className="tier-frame-label">Profilový rámeček</div>

                  <div className="tier-name">Premium pro firmy</div>
                  <div className="tier-price">
                    <span data-price-monthly="799">799</span>
                    <span data-price-yearly="7990" hidden>
                      7 990
                    </span>{" "}
                    Kč
                  </div>
                  <div className="tier-price-period">
                    <span data-period-monthly>/ měsíc</span>
                    <span data-period-yearly hidden>
                      / rok
                    </span>
                  </div>
                  <div className="tier-price-alt">
                    <span data-alt-monthly>nebo 7 990 Kč / rok</span>
                    <span data-alt-yearly hidden>
                      &nbsp;
                    </span>
                  </div>

                  <div className="tier-divider" />

                  <ul className="tier-perks">
                    <li>Vše z Premium, až pro 10 účtů</li>
                    <li>Firemní profil s logem na Services</li>
                    <li>Faktury s DPH automaticky</li>
                    <li>Kontaktní osoba pro účet</li>
                    <li>Podpora do 4 hodin</li>
                  </ul>

                  <button className="tier-cta" data-tier-cta="business">
                    Vybrat Premium pro firmy
                  </button>
                </article>
              </div>

              <div className="premium-foot">
                Plány neobsahují reklamy. Předplatné lze kdykoliv zrušit.
                <a href="#premium">Porovnat plány podrobně →</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ KONTAKT ============ */}
      <section
        className="section kontakt-section"
        id="kontakt"
        aria-labelledby="kontakt-h2"
      >
        <div className="container">
          <header className="section-head-c">
            <span className="eyebrow">
              <Icon name="mail" size={12} />{" "}
              <span data-ui-text="nav.contact">Kontakt</span>
            </span>
            <h2
              id="kontakt-h2"
              className="t-2xl"
              style={{ margin: "12px 0 12px" }}
              data-ui-text="contact.title"
            >
              Napište nám
            </h2>
            <p data-ui-text="contact.subtitle">
              Ozvěte se s dotazem, nápadem nebo nabídkou spolupráce.
            </p>
          </header>

          <div className="kontakt-grid">
            <form className="kontakt-form" id="kontaktForm" noValidate>
              <input
                type="hidden"
                name="_subject"
                defaultValue="Zpráva z VeVit portálu"
              />
              <input type="hidden" name="_template" defaultValue="table" />
              <div className="field">
                <label htmlFor="kf-name" data-ui-text="contact.form.name">
                  Jméno
                </label>
                <input
                  id="kf-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Vaše jméno"
                  data-ui-attr="placeholder:page.kontakt.namePh"
                />
              </div>
              <div className="field">
                <label htmlFor="kf-email" data-ui-text="contact.form.email">
                  E-mail
                </label>
                <input
                  id="kf-email"
                  name="email"
                  type="email"
                  required
                  placeholder="vas@email.cz"
                  data-ui-attr="placeholder:page.kontakt.emailPh"
                />
              </div>
              <div className="field">
                <label htmlFor="kf-msg" data-ui-text="contact.form.message">
                  Zpráva
                </label>
                <textarea
                  id="kf-msg"
                  name="message"
                  rows={5}
                  required
                  placeholder="S čím vám můžeme pomoct?"
                  data-ui-attr="placeholder:page.kontakt.msgPh"
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                data-ui-text="contact.form.send"
              >
                Odeslat zprávu
              </button>
              <p
                className="form-status"
                id="kontaktStatus"
                role="status"
                aria-live="polite"
                hidden
              />
            </form>

            <aside className="kontakt-social">
              <h3 data-ui-text="page.kontakt.socialsTitle">Sledujte nás</h3>
              <a
                className="social-link"
                href="https://www.instagram.com/vevit.cz/"
                target="_blank"
                rel="noopener"
              >
                <svg
                  data-social-icon="instagram"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
                Instagram
              </a>
              <a
                className="social-link"
                href="https://x.com/VeVitOfficial"
                target="_blank"
                rel="noopener"
              >
                <svg
                  data-social-icon="x"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.79l-4.78-6.26L5.93 22H2.67l8.02-9.17L1.5 2h6.96l4.32 5.71L18.244 2zm-1.19 18h1.88L7.04 4H5.04l12.014 16z" />
                </svg>
                X
              </a>
              <a
                className="social-link"
                href="https://discord.gg/dJumMfWd6r"
                target="_blank"
                rel="noopener"
              >
                <svg
                  data-social-icon="discord"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7.2 7.1A11.4 11.4 0 0 1 12 6c1.7 0 3.3.4 4.8 1.1 1.1 2.1 1.8 4.4 2 6.8-1.4 1.7-2.8 2.7-4.2 3.3l-1-1.3c.7-.2 1.3-.5 1.9-.9a8.8 8.8 0 0 1-7 0c.6.4 1.2.7 1.9.9l-1 1.3c-1.4-.6-2.8-1.6-4.2-3.3.2-2.4.9-4.7 2-6.8Z" />
                  <circle cx="9.5" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
                </svg>
                Discord
              </a>
              <a
                className="social-link"
                href="mailto:info@vevit.cz"
                data-contact-email
              >
                <Icon name="mail" size={20} /> info@vevit.cz
              </a>
              <p
                className="email-copy-status"
                data-email-copy-status
                role="status"
                aria-live="polite"
                hidden
              />
            </aside>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="wordmark">VeVit</span>
              <p className="footer-tagline" data-ui-text="footer.desc">
                Nástroje, hry a vzdělávání od českého projektu.
              </p>
            </div>

            <div className="footer-col">
              <h4 data-ui-text="page.footer.colPlatforms">Platformy</h4>
              <ul>
                <li>
                  <a href={`${L}/home#roadmap`} data-ui-text="page.footer.linkGames">
                    Hry
                  </a>
                </li>
                <li>
                  <a href={`${L}/tools`} data-ui-text="page.footer.linkTools">
                    Nástroje
                  </a>
                </li>
                <li>
                  <a href={`${L}/edu`} data-ui-text="page.footer.linkEdu">
                    Vzdělávání
                  </a>
                </li>
                <li>
                  <a
                    href="https://services.vevit.cz"
                    data-ui-text="page.footer.linkServices"
                  >
                    Služby
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 data-ui-text="page.footer.colAccount">Účet</h4>
              <ul>
                <li>
                  <a
                    href={`${L}/account/login`}
                    data-ui-text="page.footer.linkLogin"
                  >
                    Přihlášení
                  </a>
                </li>
                <li>
                  <a
                    href={`${L}/account/register`}
                    data-ui-text="page.footer.linkRegister"
                  >
                    Registrace
                  </a>
                </li>
                <li>
                  <a href="#premium">Premium</a>
                </li>
                <li>
                  <a href={`${L}/account`} data-ui-text="page.footer.linkDashboard">
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 data-ui-text="page.footer.colSupport">Podpora</h4>
              <ul>
                <li>
                  <a
                    href={`${L}/home/support#contact`}
                    data-ui-text="page.footer.linkContact"
                  >
                    Kontakt
                  </a>
                </li>
                <li>
                  <a
                    href={`${L}/home/support#faq`}
                    data-ui-text="page.footer.linkFaq"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a href={`${L}/home/support`} data-ui-text="page.footer.linkSupport">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-base">
            <p className="footer-copy">
              © 2025 - <span data-current-year>2026</span> VeVit.{" "}
              <span data-ui-text="page.footer.copy">Dělá Vít Vedral,</span>{" "}
              <span data-ui-text="page.footer.madeIn">Česko.</span>
            </p>
            <div
              className="social-row"
              data-ui-attr="aria-label:page.footer.socialsAria"
              aria-label="Sociální sítě"
            >
              <a href="https://github.com/VeVitOfficial" aria-label="GitHub">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .5C5.73.5.5 5.74.5 12.04c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56 4.56-1.53 7.85-5.83 7.85-10.91C23.5 5.74 18.27.5 12 .5z" />
                </svg>
              </a>
              <a href="https://x.com/VeVitOfficial" aria-label="X">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.79l-4.78-6.26L5.93 22H2.67l8.02-9.17L1.5 2h6.96l4.32 5.71L18.244 2zm-1.19 18h1.88L7.04 4H5.04l12.014 16z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <HomeBehaviors />
      <PremiumBehaviors />
    </>
  );
}