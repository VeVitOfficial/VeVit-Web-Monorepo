"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountT, type AccountLocale } from "@/lib/account-i18n";

/**
 * Nastavení nového hesla — React port account/reset-password.html + reset-password.js.
 * Token čteme z ?token=; bez něj formulář schováme a zobrazíme chybu.
 */
export function ResetForm({ locale }: { locale: AccountLocale }) {
  const t = useCallback((key: string) => accountT(key, locale), [locale]);
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  // Chybějící token: zobraz chybu a schovej formulář (legacy chování 1:1).
  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => setError(t("auth.reset.errInvalid")));
    }
  }, [token, t]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("auth.reset.errShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.reset.errMismatch"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/account/api/reset-password.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setSending(false);
        setError(data.error || t("auth.reset.errDefault"));
      }
    } catch {
      setSending(false);
      setError(t("auth.common.networkErrorShort"));
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-brand">
        <div className="brand-mark">v</div>
        <span className="brand-name">vevit</span>
      </div>
      <div className="auth-card">
        <h1 className="auth-title">{t("auth.reset.title")}</h1>
        <div className="auth-error" hidden={!error}>{error}</div>
        <div className="auth-ok" hidden={!done}>
          <span>{t("auth.reset.ok")}</span>{" "}
          <a href={`/${locale}/account/login`}>{t("auth.reset.okLogin")}</a>.
        </div>
        <form style={{ display: done || !token ? "none" : "flex", flexDirection: "column", gap: 14 }} onSubmit={submit} noValidate>
          <div>
            <label className="label" htmlFor="inpPass">
              <span>{t("auth.reset.password")}</span> <span style={{ color: "var(--text-3)", fontSize: 11 }}>{t("auth.reset.passwordHint")}</span>
            </label>
            <input
              id="inpPass"
              className="input input--mono"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="inpPass2">{t("auth.reset.confirm")}</label>
            <input
              id="inpPass2"
              className="input input--mono"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>
          <button id="btnSet" type="submit" className="btn btn--primary" style={{ justifyContent: "center" }} disabled={sending}>
            {sending ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </button>
        </form>
      </div>
    </main>
  );
}