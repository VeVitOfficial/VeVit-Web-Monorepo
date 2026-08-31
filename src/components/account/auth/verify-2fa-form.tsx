"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountT, type AccountLocale } from "@/lib/account-i18n";

/**
 * Dvoufázové ověření — React port account/verify-2fa.html + assets/verify-2fa.js.
 * Tato stránka má vlastní standalonový design (vlastní CSS proměnné, žádný
 * styles.css). Přepínání TOTP ↔ obnovovací kód mění normalizaci vstupu.
 */
export function Verify2faForm({ locale }: { locale: AccountLocale }) {
  const t = useCallback((key: string) => accountT(key, locale), [locale]);
  const params = useSearchParams();
  const challenge = params.get("challenge") || "";

  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const codeRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  function switchMode() {
    setRecovery((prev) => !prev);
    setCode("");
    window.setTimeout(() => codeRef.current?.focus(), 0);
  }

  function handleInput(value: string) {
    setCode(
      recovery
        ? value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 14)
        : value.replace(/\D/g, "").slice(0, 6)
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      const endpoint = recovery ? "recovery-verify.php" : "login-verify.php";
      const res = await fetch(`/account/api/2fa/${endpoint}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("auth.verify2fa.errFailed"));
       
      window.location.replace(data.redirect);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("auth.verify2fa.errFailed"));
      setSending(false);
    }
  }

  return (
    <main className="card">
      <h1>{t("auth.verify2fa.title")}</h1>
      <p>{recovery ? t("auth.verify2fa.recoveryDesc") : t("auth.verify2fa.desc")}</p>
      <form onSubmit={submit}>
        <label htmlFor="code">{t("auth.verify2fa.code")}</label>
        <input
          id="code"
          ref={codeRef}
          inputMode={recovery ? "text" : "numeric"}
          autoComplete={recovery ? "off" : "one-time-code"}
          maxLength={recovery ? 14 : 6}
          required
          value={code}
          onChange={(event) => handleInput(event.target.value)}
        />
        <button className="btn primary" type="submit" disabled={sending}>
          {t("auth.verify2fa.submit")}
        </button>
      </form>
      <button className="btn ghost" type="button" onClick={switchMode}>
        {recovery ? t("auth.verify2fa.switchApp") : t("auth.verify2fa.switchRecovery")}
      </button>
      <p className="status" role="alert" aria-live="polite">{status}</p>
      <a href={`/${locale}/account/login`}>{t("auth.common.backToLogin")}</a>
    </main>
  );
}