"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { accountT, type AccountLocale } from "@/lib/account-i18n";
import { OtpInput, type OtpResult } from "./otp-input";

class VerifyError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/**
 * Dvoufázové ověření — React port account/verify-2fa.html + assets/verify-2fa.js.
 * Tato stránka má vlastní standalonový design (vlastní CSS proměnné, žádný
 * styles.css). Kód z aplikace se zadává do 6 políček s animací (OtpInput),
 * obnovovací kód zůstává jedno textové pole s tlačítkem.
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
    setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 14));
  }

  /** Vrátí redirect po úspěchu, jinak vyhodí VerifyError s hláškou a HTTP statusem. */
  async function verify(endpoint: string, value: string): Promise<string> {
    const res = await fetch(`/account/api/2fa/${endpoint}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge, code: value }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; redirect?: string };
    if (!res.ok || !data.redirect) throw new VerifyError(data.error || t("auth.verify2fa.errFailed"), res.status);
    return data.redirect;
  }

  const redirectRef = useRef("");
  const expiredRef = useRef(false);

  async function verifyTotp(value: string): Promise<OtpResult> {
    setStatus("");
    try {
      redirectRef.current = await verify("login-verify.php", value);
      return { ok: true };
    } catch (err) {
      const status = err instanceof VerifyError ? err.status : 0;
      // Špatný kód: stačí ✕. Vypršelé/použité ověření: zpět na přihlášení (nový kód nepomůže).
      // Text jen u ostatních chyb (limit pokusů, výpadek), kde ✕ sám nic nevysvětlí.
      expiredRef.current = status === 409 || status === 410;
      if (status !== 422 && !expiredRef.current) {
        setStatus(err instanceof Error ? err.message : t("auth.verify2fa.errFailed"));
      }
      return { ok: false };
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      window.location.replace(await verify("recovery-verify.php", code));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : t("auth.verify2fa.errFailed"));
      setSending(false);
    }
  }

  return (
    <main className="card">
      <h1>{t("auth.verify2fa.title")}</h1>
      <p>{recovery ? t("auth.verify2fa.recoveryDesc") : t("auth.verify2fa.desc")}</p>
      {recovery ? (
        <form onSubmit={submit}>
          <label htmlFor="code">{t("auth.verify2fa.code")}</label>
          <input
            id="code"
            ref={codeRef}
            inputMode="text"
            autoComplete="off"
            maxLength={14}
            required
            value={code}
            onChange={(event) => handleInput(event.target.value)}
          />
          <button className="btn primary" type="submit" disabled={sending}>
            {t("auth.verify2fa.submit")}
          </button>
        </form>
      ) : (
        <OtpInput
          label={t("auth.verify2fa.code")}
          digitLabel={(n, total) => t("auth.otp.digit").replace("{n}", String(n)).replace("{total}", String(total))}
          okText={t("auth.otp.ok")}
          failText={t("auth.otp.fail")}
          onComplete={verifyTotp}
          onSuccess={() => window.location.replace(redirectRef.current)}
          onFail={() => { if (expiredRef.current) window.location.replace(`/${locale}/account/login`); }}
        />
      )}
      <button className="btn ghost" type="button" onClick={switchMode}>
        {recovery ? t("auth.verify2fa.switchApp") : t("auth.verify2fa.switchRecovery")}
      </button>
      <p className="status" role="alert" aria-live="polite">{status}</p>
      <a href={`/${locale}/account/login`}>{t("auth.common.backToLogin")}</a>
    </main>
  );
}