"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { AuthError, HpFields, readHoneypot } from "./hp-fields";
import { OauthButtons } from "./oauth-buttons";
import { TurnstileField, captchaToken, resetCaptcha } from "./captcha";

/**
 * Registrační formulář — React port account/register.html + assets/register.js.
 * Přenáší kompletní validace (jméno, přezdívka s debounced kontrolou dostupnosti,
 * e-mail/telefon, pravidla hesla), honeypot + Turnstile a dvoufázový identita
 * režim (e-mail ↔ telefon). Telefonní flow pořád jde na /api/phone/register-start.php
 * (catch-all proxy na edge function `auth`), e-mailový na Nový /account/api/register.php.
 */

type FieldKey = "name" | "nickname" | "email" | "password" | "passwordConfirm";

type FieldUI = Record<FieldKey, { valid: boolean; message: string }>;
type Values = Record<FieldKey, string>;
type Touched = Record<FieldKey, boolean>;

const EMPTY_FIELDS: FieldUI = {
  name: { valid: false, message: "" },
  nickname: { valid: false, message: "" },
  email: { valid: false, message: "" },
  password: { valid: false, message: "" },
  passwordConfirm: { valid: false, message: "" },
};

function normalizeCzechPhone(value: string): string | null {
  let normalized = value.trim().replace(/[\s().-]/g, "");
  if (/^00420\d{9}$/.test(normalized)) normalized = "+420" + normalized.slice(5);
  if (/^\d{9}$/.test(normalized)) normalized = "+420" + normalized;
  return /^\+420\d{9}$/.test(normalized) ? normalized : null;
}

function passwordRules(value: string) {
  return {
    length: value.length >= 8 && value.length <= 72,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

const RULE_KEYS = ["length", "upper", "lower", "number", "special"] as const;

export function RegisterForm({ locale }: { locale: AccountLocale }) {
  const t = useCallback((key: string, vars?: Record<string, unknown>) => accountT(key, locale, vars), [locale]);
  const params = useSearchParams();

  const [values, setValues] = useState<Values>({ name: "", nickname: "", email: "", password: "", passwordConfirm: "" });
  const [fields, setFields] = useState<FieldUI>(EMPTY_FIELDS);
  const [touched, setTouched] = useState<Touched>({ name: false, nickname: false, email: false, password: false, passwordConfirm: false });
  const [nicknameInfo, setNicknameInfo] = useState(t("auth.register.nicknameInfo"));
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<string>(""); // normalizovaná hodnota potvrzená kontrolou
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [identityMode, setIdentityMode] = useState<"email" | "phone">("email");
  const [passVisible, setPassVisible] = useState({ password: false, passwordConfirm: false });
  const nicknameTimer = useRef<number | null>(null);
  const nicknameRequest = useRef(0);

  const setFieldState = useCallback((key: FieldKey, valid: boolean, message: string) => {
    setFields((prev) => ({ ...prev, [key]: { valid: Boolean(valid), message } }));
    return Boolean(valid);
  }, []);

  const validateName = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      return setFieldState("name", trimmed.length >= 2, trimmed ? t("auth.register.errNameShort") : t("auth.register.errNameEmpty"));
    },
    [setFieldState, t]
  );

  const validateEmail = useCallback(
    (value: string, mode: "email" | "phone") => {
      const trimmed = value.trim();
      if (mode === "phone") {
        return setFieldState("email", normalizeCzechPhone(trimmed) !== null, t("auth.register.errPhone"));
      }
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      return setFieldState("email", valid, trimmed ? t("auth.register.errEmailFormat") : t("auth.register.errEmailEmpty"));
    },
    [setFieldState, t]
  );

  const validatePasswordConfirm = useCallback(
    (value: string, password: string) => {
      return setFieldState("passwordConfirm", value !== "" && value === password, value ? t("auth.register.errPasswordConfirmMismatch") : t("auth.register.errPasswordConfirmEmpty"));
    },
    [setFieldState, t]
  );

  const validatePassword = useCallback(
    (value: string, confirmValue: string) => {
      const rules = passwordRules(value);
      const valid = rules.length && rules.upper && rules.lower && rules.number && rules.special;
      const message = value.length > 72 ? t("auth.register.errPasswordLong") : t("auth.register.errPasswordRules");
      setFieldState("password", valid, message);
      if (confirmValue) validatePasswordConfirm(confirmValue, value);
      return valid;
    },
    [setFieldState, t, validatePasswordConfirm]
  );

  const normalizedNickname = (value: string) => value.trim().replace(/\s+/g, " ");

  const validateNickname = useCallback(
    (value: string) => {
      const normalized = normalizedNickname(value);
      if (nicknameTimer.current !== null) window.clearTimeout(nicknameTimer.current);
      nicknameRequest.current += 1;
      setNicknameAvailable("");
      if (!normalized) return setFieldState("nickname", false, t("auth.register.errNicknameEmpty"));
      const len = Array.from(normalized).length;
      if (len < 2 || len > 30) return setFieldState("nickname", false, t("auth.register.errNicknameLength"));
      if (!/^[\p{L}\p{M}\p{N} ._'’-]+$/u.test(normalized)) return setFieldState("nickname", false, t("auth.register.errNicknameChars"));

      setFields((prev) => ({ ...prev, nickname: { valid: false, message: "" } }));
      setNicknameChecking(true);
      setNicknameInfo(t("auth.register.nickChecking"));
      const requestId = nicknameRequest.current;
      nicknameTimer.current = window.setTimeout(() => {
        fetch(`/account/api/nickname-availability.php?nickname=${encodeURIComponent(normalized)}`, { credentials: "same-origin" })
          .then((response) => response.json().then((data) => ({ ok: response.ok, data })).catch(() => ({ ok: response.ok, data: {} })))
          .then((result) => {
            if (requestId !== nicknameRequest.current) return;
            setNicknameChecking(false);
            if (!result.ok || typeof result.data.available !== "boolean") {
              setNicknameInfo(t("auth.register.nickCheckFailed"));
              setFieldState("nickname", false, t("auth.register.nickVerifyFailed"));
              return;
            }
            if (!result.data.available) {
              setNicknameInfo(t("auth.register.nickTakenHint"));
              setFieldState("nickname", false, t("auth.register.nickTaken"));
              return;
            }
            setNicknameInfo(t("auth.register.nickAvailable"));
            setNicknameAvailable(normalized);
            setFieldState("nickname", true, "");
          })
          .catch(() => {
            if (requestId !== nicknameRequest.current) return;
            setNicknameChecking(false);
            setNicknameInfo("Dostupnost se nepodařilo ověřit.");
            setFieldState("nickname", false, "Přezdívku se nepodařilo ověřit.");
          });
      }, 350);
      return false;
    },
    [setFieldState, t]
  );

  useEffect(() => {
    const paramsMode = params.get("mode");
    if (paramsMode === "phone") Promise.resolve().then(() => setIdentityMode("phone"));
  }, [params]);

  useEffect(
    () => () => {
      if (nicknameTimer.current !== null) window.clearTimeout(nicknameTimer.current);
    },
    []
  );

  function switchIdentityMode() {
    setFields((prev) => ({ ...prev, email: { valid: false, message: "" } }));
    setTouched((prev) => ({ ...prev, email: false }));
    setValues((prev) => ({ ...prev, email: "" }));
    setIdentityMode((mode) => (mode === "email" ? "phone" : "email"));
    window.setTimeout(() => document.getElementById("inpEmail")?.focus(), 0);
  }

  const handleInput = (key: FieldKey, raw: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setError("");
    setValues((prev) => {
      const next = { ...prev, [key]: raw };
      if (key === "name") validateName(raw);
      else if (key === "email") validateEmail(raw, identityMode);
      else if (key === "nickname") validateNickname(raw);
      else if (key === "password") validatePassword(raw, next.passwordConfirm);
      else validatePasswordConfirm(raw, next.password);
      return next;
    });
  };

  const handleBlur = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    if (key === "name") validateName(values.name);
    else if (key === "email") validateEmail(values.email, identityMode);
    else if (key === "nickname" && fields.nickname.valid) validateNickname(values.nickname);
    else if (key === "password") validatePassword(values.password, values.passwordConfirm);
    else validatePasswordConfirm(values.passwordConfirm, values.password);
  };

  const allValid =
    fields.name.valid &&
    fields.nickname.valid &&
    fields.email.valid &&
    fields.password.valid &&
    fields.passwordConfirm.valid &&
    nicknameAvailable === normalizedNickname(values.nickname);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ name: true, nickname: true, email: true, password: true, passwordConfirm: true });
    // Spustíme full validaci před odesláním — výsledky se projeví v UI hned.
    validateName(values.name);
    validateEmail(values.email, identityMode);
    validatePassword(values.password, values.passwordConfirm);
    const nicknameNormalized = normalizedNickname(values.nickname);
    if (!fields.nickname.valid || nicknameAvailable !== nicknameNormalized) validateNickname(values.nickname);
    if (!allValid) {
      setError(t("auth.register.errFields"));
      window.setTimeout(() => (document.querySelector('#registerForm [aria-invalid="true"]') as HTMLElement | null)?.focus(), 0);
      return;
    }

    setError("");
    setSubmitting(true);
    const hp = readHoneypot();
    const isPhone = identityMode === "phone";
    const payload: Record<string, unknown> = {
      nickname: nicknameNormalized,
      full_name: values.name.trim(),
      password: values.password,
      password_confirmation: values.passwordConfirm,
      hp_confirm: hp.hp_confirm,
      hp_ts: hp.hp_ts,
      cf_turnstile: captchaToken(),
    };
    if (isPhone) payload.phone = normalizeCzechPhone(values.email);
    else payload.email = values.email.trim();
    try {
      const res = await fetch(isPhone ? "/account/api/phone/register-start.php" : "/account/api/register.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        /* prázná odpověď */
      }
      if (!res.ok) {
        setSubmitting(false);
        resetCaptcha();
        setError(data.error as string | undefined || t("auth.register.errFailed"));
        return;
      }
      if (isPhone) {
         
        window.location.assign(data.redirect as string);
        return;
      }
      setSuccess(true);
      window.setTimeout(() => {
         
        window.location.replace(`/${locale}/account`);
      }, 1200);
    } catch {
      setSubmitting(false);
      resetCaptcha();
      setError(t("auth.common.networkError"));
    }
  }

  const emailMode = identityMode === "email";
  const emailMeta = emailMode
    ? { label: t("auth.register.emailLabel"), type: "email" as const, autoComplete: "email", inputMode: "email" as const, placeholder: t("auth.register.emailPlaceholder") }
    : { label: t("auth.register.phoneLabel"), type: "tel" as const, autoComplete: "tel", inputMode: "tel" as const, placeholder: t("auth.register.phonePlaceholder") };
  const rules = passwordRules(values.password);
  const busy = submitting;

  return (
    <>
      <main className="auth-wrap">
        <a className="auth-brand" href={`/${locale}/account`} aria-label={t("auth.register.brandAria")}>
          <span className="brand-mark" aria-hidden="true">v</span>
          <span className="brand-name">vevit</span>
        </a>

        <section className="auth-card" aria-labelledby="registerTitle">
          <div className="auth-heading">
            <h1 className="auth-title" id="registerTitle">{t("auth.register.title")}</h1>
            <p className="auth-sub">{t("auth.register.sub")}</p>
          </div>

          <AuthError message={error} id="authErr" role="alert" />

          <form className="register-form" id="registerForm" style={{ display: success ? "none" : undefined }} onSubmit={submit} noValidate>
            <HpFields />
            <div className="identity-grid">
              <div className={`field ${touched.name && !fields.name.valid ? "is-invalid" : ""} ${fields.name.valid ? "is-valid" : ""}`}>
                <label className="field-label" htmlFor="inpName">
                  <span>{t("auth.register.name")}</span> <span className="required" aria-hidden="true">*</span>
                </label>
                <div className="field-control">
                  <input
                    id="inpName"
                    className="input"
                    type="text"
                    autoComplete="name"
                    placeholder={t("auth.register.namePlaceholder")}
                    required
                    aria-required="true"
                    aria-invalid={!fields.name.valid && touched.name}
                    aria-describedby="errName"
                    value={values.name}
                    disabled={busy}
                    onChange={(event) => handleInput("name", event.target.value)}
                    onBlur={() => handleBlur("name")}
                  />
                  <span className="field-check" aria-hidden="true">✓</span>
                </div>
                <span className="field-error" id="errName" aria-live="polite">{touched.name && !fields.name.valid ? fields.name.message : ""}</span>
              </div>

              <div className={`field ${touched.nickname && !fields.nickname.valid ? "is-invalid" : ""} ${fields.nickname.valid ? "is-valid" : ""} ${nicknameChecking ? "is-pending" : ""}`}>
                <label className="field-label" htmlFor="inpNick">
                  <span>{t("auth.register.nickname")}</span> <span className="required" aria-hidden="true">*</span>
                </label>
                <div className="field-control">
                  <input
                    id="inpNick"
                    className="input input--mono"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={t("auth.register.nicknamePlaceholder")}
                    required
                    aria-required="true"
                    aria-invalid={touched.nickname && !fields.nickname.valid}
                    aria-describedby="errNick nickInfo"
                    value={values.nickname}
                    disabled={busy}
                    onChange={(event) => handleInput("nickname", event.target.value)}
                    onBlur={() => handleBlur("nickname")}
                  />
                  <span className="field-check" aria-hidden="true">✓</span>
                </div>
                <span className="field-error" id="errNick" aria-live="polite">{touched.nickname && !fields.nickname.valid ? fields.nickname.message : ""}</span>
                <span className={`field-info ${nicknameChecking ? "is-checking" : ""}`} id="nickInfo" aria-live="polite">{nicknameInfo}</span>
              </div>
            </div>

            <div className={`field ${touched.email && !fields.email.valid ? "is-invalid" : ""} ${fields.email.valid ? "is-valid" : ""}`}>
              <div className="field-label-row">
                <label className="field-label" htmlFor="inpEmail">
                  <span>{emailMeta.label}</span> <span className="required" aria-hidden="true">*</span>
                </label>
                <button id="identityModeToggle" className="identity-mode-toggle" type="button" disabled={busy} onClick={switchIdentityMode}>
                  {emailMode ? t("auth.register.usePhone") : t("auth.register.useEmail")}
                </button>
              </div>
              <div className="field-control">
                <input
                  id="inpEmail"
                  className="input input--mono"
                  type={emailMeta.type}
                  autoComplete={emailMeta.autoComplete}
                  inputMode={emailMeta.inputMode}
                  placeholder={emailMeta.placeholder}
                  required
                  aria-required="true"
                  aria-invalid={touched.email && !fields.email.valid}
                  aria-describedby="errEmail identityHint"
                  value={values.email}
                  disabled={busy}
                  onChange={(event) => handleInput("email", event.target.value)}
                  onBlur={() => handleBlur("email")}
                />
                <span className="field-check" aria-hidden="true">✓</span>
              </div>
              <span className="field-error" id="errEmail" aria-live="polite">{touched.email && !fields.email.valid ? fields.email.message : ""}</span>
              {!emailMode && (
                <span className="field-info" id="identityHint">{t("auth.register.phoneHint")}</span>
              )}
            </div>

            <div className={`field ${touched.password && !fields.password.valid ? "is-invalid" : ""} ${fields.password.valid ? "is-valid" : ""}`}>
              <label className="field-label" htmlFor="inpPass">
                <span>{t("auth.register.password")}</span> <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="field-control">
                <input
                  id="inpPass"
                  className="input input--mono"
                  type={passVisible.password ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.register.passwordPlaceholder")}
                  required
                  aria-required="true"
                  aria-invalid={touched.password && !fields.password.valid}
                  aria-describedby="errPass passwordRules"
                  value={values.password}
                  disabled={busy}
                  onChange={(event) => handleInput("password", event.target.value)}
                  onBlur={() => handleBlur("password")}
                />
                <span className="field-check" aria-hidden="true">✓</span>
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={passVisible.password ? t("auth.common.hidePassword") : t("auth.common.showPassword")}
                  aria-pressed={passVisible.password}
                  disabled={busy}
                  onClick={() => setPassVisible((prev) => ({ ...prev, password: !prev.password }))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.6" />
                  </svg>
                </button>
              </div>
              <span className="field-error" id="errPass" aria-live="polite">{touched.password && !fields.password.valid ? fields.password.message : ""}</span>
            </div>

            <div className="password-rules" id="passwordRules" aria-label={t("auth.register.passwordRulesAria")}>
              <p className="password-rules__title">{t("auth.register.passwordRulesTitle")}</p>
              <ul>
                {RULE_KEYS.map((rule) => (
                  <li key={rule} className={rules[rule] ? "is-met" : ""} data-rule={rule}>
                    <span className="rule-check" aria-hidden="true">✓</span>
                    <span>{t(`auth.register.rule${rule[0].toUpperCase()}${rule.slice(1)}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`field ${touched.passwordConfirm && !fields.passwordConfirm.valid ? "is-invalid" : ""} ${fields.passwordConfirm.valid ? "is-valid" : ""}`}>
              <label className="field-label" htmlFor="inpPassConfirm">
                <span>{t("auth.register.passwordConfirm")}</span> <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="field-control">
                <input
                  id="inpPassConfirm"
                  className="input input--mono"
                  type={passVisible.passwordConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={t("auth.register.passwordConfirmPlaceholder")}
                  required
                  aria-required="true"
                  aria-invalid={touched.passwordConfirm && !fields.passwordConfirm.valid}
                  aria-describedby="errPassConfirm"
                  value={values.passwordConfirm}
                  disabled={busy}
                  onChange={(event) => handleInput("passwordConfirm", event.target.value)}
                  onBlur={() => handleBlur("passwordConfirm")}
                />
                <span className="field-check" aria-hidden="true">✓</span>
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={passVisible.passwordConfirm ? t("auth.common.hidePassword") : t("auth.common.showPassword")}
                  aria-pressed={passVisible.passwordConfirm}
                  disabled={busy}
                  onClick={() => setPassVisible((prev) => ({ ...prev, passwordConfirm: !prev.passwordConfirm }))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.6" />
                  </svg>
                </button>
              </div>
              <span className="field-error" id="errPassConfirm" aria-live="polite">{touched.passwordConfirm && !fields.passwordConfirm.valid ? fields.passwordConfirm.message : ""}</span>
            </div>

            <TurnstileField style={{ marginTop: 14 }} />
            <button
              id="btnRegister"
              className="btn btn--primary btn-register"
              type="submit"
              disabled={!allValid || busy}
              aria-disabled={!allValid || busy}
              aria-busy={busy}
            >
              <span className="button-spinner" aria-hidden="true" />
              <span className="button-label">{busy ? t("auth.register.submitting") : t("auth.register.submit")}</span>
            </button>
          </form>

          <div className="oauth-divider" aria-hidden="true">{t("auth.common.oauthDivider")}</div>
          <OauthButtons locale={locale} mode="register" />
          <p className="oauth-status" role="status" aria-live="polite" />

          <div className="register-success" id="registerSuccess" role="status" aria-live="polite" hidden={!success}>
            <div className="success-check" aria-hidden="true">✓</div>
            <h2>{t("auth.register.successTitle")}</h2>
            <p>{t("auth.register.successDesc")}</p>
          </div>
        </section>

        <p className="auth-hint">
          <span>{t("auth.register.haveAccount")}</span>{" "}
          <a href={`/${locale}/account/login`}>{t("auth.register.login")}</a>
        </p>
      </main>
    </>
  );
}