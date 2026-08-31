"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { accountT, accountIntlLocale } from "@/lib/account-i18n";
import { useAccountApi } from "./api";
import { useSession, type AccountUser } from "./session";
import { AppSwitcher } from "./app-switcher";
import { LanguagePill } from "./language-pill";
import { useAccountLocale } from "./use-account-locale";
import { Avatar } from "./ui";

/**
 * Port of the account/index.html shell: topbar (brand + language pill + app
 * switcher + user menu), settings sidebar, mobile section picker and the
 * per-section heading. routeFromPath/syncRouteUi from app.js are replaced by
 * usePathname().
 */

/** Port of account_route_from_uri + routeFromPath from app.js. */
export const ACCOUNT_ROUTES: Record<string, { path: string; descKey: string }> = {
  overview: { path: "/account", descKey: "route.overview.desc" },
  profile: { path: "/account/profile", descKey: "route.profile.desc" },
  security: { path: "/account/security", descKey: "route.security.desc" },
  billing: { path: "/account/billing", descKey: "route.billing.desc" },
  connections: { path: "/account/connections", descKey: "route.connections.desc" },
  notifications: { path: "/account/notifications", descKey: "route.notifications.desc" },
  preferences: { path: "/account/preferences", descKey: "route.preferences.desc" },
  privacy: { path: "/account/privacy", descKey: "route.privacy.desc" },
};

export function accountRouteFromPathname(pathname: string): string {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const found = Object.entries(ACCOUNT_ROUTES).find(([, route]) => route.path === normalized);
  return found ? found[0] : "overview";
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  overview: <path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />,
  profile: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  security: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4" />,
  billing: <path d="M3 5h18v14H3zM3 10h18M7 15h3" />,
  connections: <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />,
  notifications: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  preferences: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />,
  privacy: <path d="M4 10h16v11H4zM8 10V7a4 4 0 0 1 8 0v3M12 15h.01" />,
};

function initialsFor(user: AccountUser, locale: string): string {
  const source = (user.full_name || user.nickname || user.email || "").trim();
  if (!source) return "VV";
  const words = source.split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? words[0][0] + words[words.length - 1][0]
    : words[0].slice(0, 2);
  return initials.toLocaleUpperCase(accountIntlLocale(locale));
}

function UserMenu({ user, locale }: { user: AccountUser; locale: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const run = useAccountApi();

  useEffect(() => {
    function onOutside(event: MouseEvent) {
      if (open && wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("click", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user.full_name || user.nickname || accountT("name.fallback", locale);
  const email = user.email || "";
  const avatarUrl = (user.avatar_url ?? "").trim();

  async function signOut() {
    try {
      await run("logout.php", { method: "POST" });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      location.replace("/account/login");
    }
  }

  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        className="user-menu-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar avatar--sm" aria-hidden="true">
          <Avatar url={avatarUrl} initials={initialsFor(user, locale)} className="avatar__initials" />
        </span>
        <span className="user-menu-button__copy">
          <strong>{name}</strong>
          <span>{email}</span>
        </span>
        <svg className="user-menu-button__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="user-menu" role="menu">
          <div className="user-menu__identity">
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>{accountT("menu.myAccount", locale)}</Link>
          <a href="https://vevit.cz/home" role="menuitem">{accountT("menu.backToApp", locale)}</a>
          <div className="user-menu__divider" role="separator" />
          <button type="button" role="menuitem" onClick={signOut}>{accountT("menu.signOut", locale)}</button>
        </div>
      )}
    </div>
  );
}

export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const pathname = usePathname() ?? "/account";
  const locale = useAccountLocale();
  const currentRoute = accountRouteFromPathname(pathname);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const route = ACCOUNT_ROUTES[currentRoute];
  return (
    <div className="account-page">
      <header className="account-topbar">
        <div className="account-topbar__inner">
          <span className="vv-app-brand" aria-label={accountT("section.eyebrow", locale)}>
            <a href="/home">VeVit</a>
            <a href="/account">Account</a>
          </span>
          <div className="vv-app-actions">
            <LanguagePill baseLanguage={user.language === "en" ? "cs" : user.language} currentUrl={pathname} locale={locale} />
            <AppSwitcher locale={locale} currentApp="Account" />
            <UserMenu user={user} locale={locale} />
          </div>
        </div>
      </header>

      <div className="account-shell">
        <aside className="settings-sidebar">
          <div className="settings-sidebar__heading">
            <span>{accountT("sidebar.heading", locale)}</span>
            <small>{accountT("sidebar.subheading", locale)}</small>
          </div>
          <nav className="settings-nav" aria-label={accountT("sidebar.ariaLabel", locale)}>
            {Object.keys(ACCOUNT_ROUTES).map((key) => (
              <Link
                key={key}
                className={`settings-nav__item${key === currentRoute ? " is-active" : ""}`}
                href={ACCOUNT_ROUTES[key].path}
                aria-current={key === currentRoute ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{NAV_ICONS[key]}</svg>
                </span>
                <span>{accountT(`nav.${key}`, locale)}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="account-main" id="mainContent" tabIndex={-1}>
          <div className="mobile-section-picker">
            <label htmlFor="mobileSectionSelect">{accountT("mobile.label", locale)}</label>
            <select
              id="mobileSectionSelect"
              className="input"
              aria-label={accountT("mobile.ariaLabel", locale)}
              value={currentRoute}
              onChange={(event) => router.push(ACCOUNT_ROUTES[event.target.value].path)}
            >
              {Object.keys(ACCOUNT_ROUTES).map((key) => (
                <option key={key} value={key}>{accountT(`nav.${key}`, locale)}</option>
              ))}
            </select>
          </div>

          <header className="section-heading">
            <div>
              <p className="eyebrow">{accountT("section.eyebrow", locale)}</p>
              <h1>{accountT(`nav.${currentRoute}`, locale)}</h1>
              <p>{accountT(route.descKey, locale)}</p>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}