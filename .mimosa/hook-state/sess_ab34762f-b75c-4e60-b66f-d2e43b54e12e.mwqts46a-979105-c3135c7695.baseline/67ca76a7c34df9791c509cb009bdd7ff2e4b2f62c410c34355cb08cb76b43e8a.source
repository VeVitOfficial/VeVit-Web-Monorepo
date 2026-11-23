"use client";

import { useCallback, useState } from "react";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { HpFields, readHoneypot } from "./hp-fields";

/**
 * Zapomenuté heslo — React port account/forgot-password.html + assets/forgot-password.js.
 * Po odeslání vidí uživatel vždy OK panel (fail-open, anti-enumeration) —
 * jediná chyba, která se zobrazí, je čistě síťová.
 */
export function ForgotForm({ locale }: { locale: AccountLocale }) {
  const t = useCallback((key: string) => accountT(key, locale), [locale]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const value = email.trim();
    if (!value) {
      setError(t("auth.forgot.errEmail"));
      return;
    }
    setSending(true);
    const hp = readHoneypot();
    try {
      const res = await fetch("/account/api/forgot-password.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, hp_confirm: hp.hp_confirm, hp_ts: hp.hp_ts }),
      });
      await res.json();
      // Legacy chování: na jakoukoliv odpověď serveru ukážeme OK (neodhalujeme,
      // jestli účet existuje). Chyba se zobrazuje jen při síťovém selhání.
      setDone(true);
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
        <div>
          <h1 className="auth-title">{t("auth.forgot.title")}</h1>
          <p className="auth-sub">{t("auth.forgot.sub")}</p>
        </div>
        <div className="auth-error" hidden={!error}>{error}</div>
        <div className="auth-ok" hidden={!done}>{t("auth.forgot.ok")}</div>
        <form style={{ display: done ? "none" : "flex", flexDirection: "column", gap: 14 }} onSubmit={submit} noValidate>
          <div>
            <label className="label" htmlFor="inpEmail">{t("auth.forgot.email")}</label>
            <input
              id="inpEmail"
              className="input input--mono"
              type="email"
              autoComplete="email"
              placeholder={t("auth.forgot.emailPlaceholder")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <HpFields />
          <button id="btnSend" type="submit" className="btn btn--primary" style={{ justifyContent: "center" }} disabled={sending}>
            {sending ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </button>
          <a href={`/${locale}/account/login`} style={{ fontSize: 13, textAlign: "center" }}>{t("auth.forgot.back")}</a>
        </form>
      </div>
    </main>
  );
}