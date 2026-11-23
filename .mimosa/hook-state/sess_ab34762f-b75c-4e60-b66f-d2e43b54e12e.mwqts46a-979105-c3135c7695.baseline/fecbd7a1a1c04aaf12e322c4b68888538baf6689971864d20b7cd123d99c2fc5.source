"use client";

import { useState } from "react";
import { accountT, type AccountLocale } from "@/lib/account-i18n";

/**
 * OAuth tlačítka (Google/GitHub/Discord) — port z login.html + register.html.
 * Kliknutie zakáže všechna tlačítka, označí aktivní a přesměruje na start
 * endpoint (legacy 1:1). Ikony jsou převzaté z původního HTML. OAuth start
 * endpoint stále běží přes catch-all proxy na edge function `auth`.
 */

const PROVIDERS = [
  { id: "google", url: "/account/api/oauth/start.php?provider=google" },
  { id: "github", url: "/account/api/oauth/start.php?provider=github" },
  { id: "discord", url: "/account/api/oauth/start.php?provider=discord" },
] as const;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.23-.19-1.77H12v3.35h5.38a4.6 4.6 0 0 1-1.99 3.02l3.22 2.5c1.88-1.74 2.74-4.3 2.74-7.1Z" />
      <path fill="#34A853" d="M12 21.72c2.62 0 4.82-.87 6.43-2.39l-3.22-2.5c-.9.6-2.05.96-3.21.96-2.52 0-4.66-1.7-5.42-3.99l-3.33 2.57A9.72 9.72 0 0 0 12 21.72Z" />
      <path fill="#FBBC05" d="M6.58 13.8A5.84 5.84 0 0 1 6.28 12c0-.62.11-1.22.3-1.8L3.25 7.63A9.72 9.72 0 0 0 2.28 12c0 1.57.38 3.05.97 4.37l3.33-2.57Z" />
      <path fill="#EA4335" d="M12 6.21c1.42 0 2.69.49 3.69 1.45l2.77-2.77C16.81 3.34 14.62 2.28 12 2.28a9.72 9.72 0 0 0-8.75 5.35l3.33 2.57C7.34 7.91 9.48 6.21 12 6.21Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.3a9.7 9.7 0 0 0-3.07 18.9c.49.09.67-.21.67-.47v-1.86c-2.73.6-3.3-1.16-3.3-1.16-.45-1.13-1.09-1.43-1.09-1.43-.9-.61.07-.6.07-.6 1 .07 1.52 1.02 1.52 1.02.88 1.51 2.32 1.07 2.88.82.09-.64.35-1.07.63-1.32-2.18-.25-4.47-1.09-4.47-4.85 0-1.07.38-1.95 1.01-2.64-.1-.25-.44-1.25.1-2.61 0 0 .83-.27 2.67 1.01A9.2 9.2 0 0 1 12 6.16c.83 0 1.67.11 2.45.33 1.84-1.28 2.67-1.01 2.67-1.01.54 1.36.2 2.36.1 2.61.63.69 1.01 1.57 1.01 2.64 0 3.77-2.29 4.6-4.47 4.85.35.3.66.88.66 1.78v2.64c0 .26.18.57.67.47A9.7 9.7 0 0 0 12 2.3Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.54 4.35A16.7 16.7 0 0 0 15.44 3l-.5 1a15.5 15.5 0 0 0-5.88 0l-.5-1c-1.44.25-2.82.7-4.1 1.35C1.87 8.17 1.18 11.9 1.52 15.58a16.5 16.5 0 0 0 5.03 2.54l1.22-1.67a9.7 9.7 0 0 1-1.92-.92l.46-.36c3.7 1.73 7.68 1.73 11.33 0l.46.36c-.62.36-1.26.67-1.92.92l1.22 1.67a16.4 16.4 0 0 0 5.03-2.54c.4-4.27-.69-7.96-2.89-11.23ZM8.67 13.3c-1.1 0-2-1-2-2.23s.88-2.23 2-2.23 2.02 1 2 2.23c0 1.23-.88 2.23-2 2.23Zm6.66 0c-1.1 0-2-1-2-2.23s.88-2.23 2-2.23 2.02 1 2 2.23c0 1.23-.88 2.23-2 2.23Z" />
    </svg>
  );
}

const ICONS: Record<(typeof PROVIDERS)[number]["id"], React.ReactNode> = {
  google: <GoogleIcon />,
  github: <GithubIcon />,
  discord: <DiscordIcon />,
};

export function OauthButtons({ locale, mode }: { locale: AccountLocale; mode: "login" | "register" }) {
  const t = (key: string, vars?: Record<string, unknown>) => accountT(key, locale, vars);
  // Které tlačítko právě přechází — ostatní se při prvním kliknutí zamknou.
  const [active, setActive] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  function start(provider: typeof PROVIDERS[number]) {
    if (active) return;
    setActive(provider.id);
    setStatus(t("auth.common.redirectingOauth"));
     
    window.location.assign(provider.url);
  }

  return (
    <>
      <div className="oauth-divider" aria-hidden="true">{t("auth.common.oauthDivider")}</div>
      <div
        className="oauth-buttons"
        aria-label={mode === "login" ? t("auth.common.oauthAriaLogin") : t("auth.common.oauthAriaRegister")}
      >
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            className="oauth-button"
            type="button"
            disabled={active !== null}
            aria-label={t(`auth.common.oauth${provider.id[0].toUpperCase()}${provider.id.slice(1)}` as const)}
            onClick={() => start(provider)}
          >
            {ICONS[provider.id]}
            <span>
              {active === provider.id
                ? t("auth.common.redirecting")
                : t(`auth.common.oauth${provider.id[0].toUpperCase()}${provider.id.slice(1)}`)}
            </span>
          </button>
        ))}
      </div>
      <p className="oauth-status" role="status" aria-live="polite">{status}</p>
    </>
  );
}