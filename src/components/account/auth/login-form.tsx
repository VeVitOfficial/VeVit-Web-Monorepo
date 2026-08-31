"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { AuthError, HpFields, readHoneypot } from "./hp-fields";
import { OauthButtons } from "./oauth-buttons";
import { TurnstileField, captchaToken, resetCaptcha } from "./captcha";

/**
 * Přihlašovací formulář — React port account/login.html + assets/login.js.
 * Chování je přenesené 1:1: honeypot, Turnstile, OAuth chyby z query,
 * maskotka překrývající oči při odhalení hesla a přesměrování přes
 * location.replace (aby se login nedostal do historie jako samostatný krok).
 */

// Absolutní cesty: stránka se servuje na locale-prefixed URL (/cs/account/login),
// relativní ./images/ by se vyřešilo vůči /cs/account/images/ a vrátilo 404.
const GIRL_FRAMES = [
  "/account/images/holka odkryté oči.webp",
  "/account/images/zakrývání 1.webp",
  "/account/images/zakrývání 2.webp",
  "/account/images/holka zakryté oči.webp",
];

const OAUTH_ERROR_KEYS: Record<string, string> = {
  oauth_cancelled: "auth.common.oauthCancelled",
  oauth_invalid_state: "auth.common.oauthInvalidState",
  oauth_exchange_failed: "auth.common.oauthExchangeFailed",
  oauth_profile_failed: "auth.common.oauthProfileFailed",
  oauth_email_missing: "auth.common.oauthEmailMissing",
  oauth_email_unverified: "auth.common.oauthEmailUnverified",
  account_already_exists: "auth.common.accountAlreadyExists",
  oauth_configuration_error: "auth.common.oauthConfigError",
};

export function LoginForm({ locale }: { locale: AccountLocale }) {
  const t = useCallback((key: string, vars?: Record<string, unknown>) => accountT(key, locale, vars), [locale]);

  const params = useSearchParams();
  // return_to předáváme dál serveru — ten přidá locale prefix.
  const returnTo = params.get("return_to") || "";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [girlFrame, setGirlFrame] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const girlTimer = useRef<number | null>(null);
  // Aktuální index snímku (legacy currentGirlFrame) — animace potřebuje znát start.
  const girlFrameIndex = useRef(0);
  const restFramesPreloaded = useRef(false);
  const girlImage = useRef<HTMLImageElement>(null);

  const preloadRestFrames = useCallback(() => {
    if (restFramesPreloaded.current) return;
    restFramesPreloaded.current = true;
    for (let i = 1; i < GIRL_FRAMES.length; i++) {
      const img = new Image();
      img.src = GIRL_FRAMES[i];
    }
  }, []);

  // Maskotka se načítá lazy: .login-girl je skrytá ≤1120px (CSS), takže na mobilu
  // frame 0 vůbec nestahujeme. Zbylé snímky se preloadují až při focusu hesla.
  // setState jde přes .then() callback, ne přímo v efektu (react-hooks v6).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1121px)");
    if (!mq.matches) return undefined;
    Promise.resolve().then(() => setGirlFrame(GIRL_FRAMES[0]));
    const input = document.getElementById("inputPass");
    input?.addEventListener("focus", preloadRestFrames, { once: true });
    return () => {
      input?.removeEventListener("focus", preloadRestFrames);
    };
  }, [preloadRestFrames]);

  useEffect(() => {
    const callbackError = params.get("error");
    const key = callbackError ? OAUTH_ERROR_KEYS[callbackError] : undefined;
    if (key) {
      const onOk = () => setError(t(key));
      const onErr = () => undefined;
      Promise.resolve().then(onOk, onErr);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [params, t]);

  useEffect(
    () => () => {
      if (girlTimer.current !== null) window.clearTimeout(girlTimer.current);
    },
    []
  );

  function animateGirlTo(targetFrame: number) {
    if (girlTimer.current !== null) {
      window.clearTimeout(girlTimer.current);
      girlTimer.current = null;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      girlFrameIndex.current = targetFrame;
      setGirlFrame(GIRL_FRAMES[targetFrame]);
      return;
    }

    const step = () => {
      const current = girlFrameIndex.current;
      if (current === targetFrame) {
        girlTimer.current = null;
        return;
      }
      const next = current + (targetFrame > current ? 1 : -1);
      girlFrameIndex.current = next;
      setGirlFrame(GIRL_FRAMES[next]);
      if (next !== targetFrame) {
        girlTimer.current = window.setTimeout(step, 110);
      } else {
        girlTimer.current = null;
      }
    };
    step();
  }

  function togglePassword() {
    const visible = !passwordVisible;
    setPasswordVisible(visible);
    preloadRestFrames();
    animateGirlTo(visible ? GIRL_FRAMES.length - 1 : 0);
    document.getElementById("inputPass")?.focus({ preventScroll: true });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const id = identifier.trim();
    if (!id) {
      setError(t("auth.login.errIdentifier"));
      return;
    }
    if (!password) {
      setError(t("auth.login.errPassword"));
      return;
    }
    setSubmitting(true);
    const hp = readHoneypot();
    try {
      const res = await fetch("/account/api/login.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: id,
          password,
          remember,
          return_to: returnTo,
          hp_confirm: hp.hp_confirm,
          hp_ts: hp.hp_ts,
          cf_turnstile: captchaToken(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Server vrací redirect s locale prefixem (/cs/account, /de/account/security, …).
         
        window.location.replace(data?.redirect || `/${locale}/account`);
        return;
      }
      resetCaptcha();
      setError((data && data.error) || t("auth.login.errFailed"));
    } catch {
      setError(t("auth.common.networkError"));
    }
    setSubmitting(false);
  }

  const visibleLabel = passwordVisible ? t("auth.common.hidePassword") : t("auth.common.showPassword");

  return (
    <>
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="brand-mark">v</div>
          <span className="brand-name">vevit</span>
        </div>
    <div className="auth-card">
      <div>
        <h1 className="auth-title">{t("auth.login.title")}</h1>
        <p className="auth-sub">{t("auth.login.sub")}</p>
      </div>
      <AuthError message={error} id="authErr" role="alert" />
      <form id="loginForm" className="step" onSubmit={submit} noValidate>
        <div>
          <label className="label" htmlFor="inputEmail">{t("auth.login.identifier")}</label>
          <input
            id="inputEmail"
            className="input input--mono"
            type="text"
            autoComplete="username"
            inputMode="email"
            placeholder={t("auth.login.identifierPlaceholder")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="inputPass">{t("auth.login.password")}</label>
          <div className="password-field">
            <input
              id="inputPass"
              className="input"
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              id="toggleLoginPassword"
              className="password-toggle"
              type="button"
              aria-controls="inputPass"
              aria-pressed={passwordVisible}
              aria-label={visibleLabel}
              title={visibleLabel}
              onClick={togglePassword}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <g data-eye-open style={{ display: passwordVisible ? "none" : undefined }}>
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </g>
                <g data-eye-closed style={{ display: passwordVisible ? undefined : "none" }}>
                  <path d="m3 3 18 18" />
                  <path d="M10.6 6.1A9.4 9.4 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.1 2.8M6.1 6.1C3.7 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 3.1-.5" />
                </g>
              </svg>
            </button>
          </div>
        </div>
        <label className="remember-control" htmlFor="inputRemember">
          <input
            id="inputRemember"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>{t("auth.login.remember")}</span>
        </label>
        <div style={{ textAlign: "right" }}>
          <a href={`/${locale}/account/forgot-password`} style={{ fontSize: 13 }}>
            {t("auth.login.forgot")}
          </a>
        </div>
        <HpFields />
        <TurnstileField style={{ marginTop: 14 }} />
        <button id="btnLogin" type="submit" className="btn btn--primary" style={{ justifyContent: "center" }} disabled={submitting}>
          {submitting ? t("auth.common.loading") : t("auth.login.submit")}
        </button>
      </form>
      <OauthButtons locale={locale} mode="login" />
      <p className="oauth-status" role="status" aria-live="polite" />
    </div>
    <p className="auth-hint">
      <span>{t("auth.login.noAccount")}</span>{" "}
      <a href={`/${locale}/account/register`}>{t("auth.login.register")}</a>
    </p>
  </div>
      <div className="login-girl" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- legacy asset mimo public/ */}
        <img
          ref={girlImage}
          src={girlFrame ?? undefined}
          alt=""
          width={860}
          height={1290}
          draggable={false}
        />
      </div>
    </>
  );
}