"use client";

import { useState } from "react";
import { accountT as t, type AccountLocale } from "@/lib/account-i18n";
import { useAccountApi } from "./api";
import { useSession } from "./session";

/**
 * Ports of the imperative dialogs from app.js: showConfirmDialog,
 * showTotpSetup and showRecoveryCodes. Modal stack ownership (which dialog is
 * open, swap TOTP → recovery codes after confirmation) lives in the caller
 * (sections/security.tsx).
 */

export function ConfirmDialog({
  locale,
  title,
  message,
  confirmLabel,
  dangerous = false,
  cancel,
  onResult,
}: {
  locale: AccountLocale;
  title: string;
  message: string;
  confirmLabel?: string;
  dangerous?: boolean;
  cancel: () => void;
  onResult: (confirmed: boolean) => void;
}) {
  function close(result: boolean) {
    cancel();
    onResult(result);
  }
  return (
    <div
      className="overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) close(false);
      }}
    >
      <div className={`modal${dangerous ? " modal--danger" : ""}`} role="dialog" aria-modal="true" aria-labelledby="vvConfirmTitle">
        <h2 className="modal-title" id="vvConfirmTitle">{title}</h2>
        <p className="modal-sub">{message}</p>
        <div className="modal-actions">
          <button className="btn btn--ghost" type="button" onClick={() => close(false)}>{t("action.cancel", locale)}</button>
          <button autoFocus className={`btn ${dangerous ? "btn--warn" : "btn--primary"}`} type="button" onClick={() => close(true)}>
            {confirmLabel || t("action.confirm", locale)}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TotpSetupModal({
  locale,
  data,
  cancel,
  onSuccess,
}: {
  locale: AccountLocale;
  data: { challenge: string; qr_code: string; secret: string };
  cancel: () => void;
  onSuccess: (recoveryCodes: string[]) => void;
}) {
  const { showToast } = useSession();
  const run = useAccountApi();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await run<{ recovery_codes?: string[] }>("2fa/setup-confirm.php", {
        method: "POST",
        body: { challenge: data.challenge, code },
      });
      onSuccess(result.recovery_codes || []);
    } catch (caught) {
      setBusy(false);
      const message = caught instanceof Error ? caught.message : t("error.requestFailed", locale);
      setError(message);
      showToast(message, "error");
    }
  }

  return (
    <div className="overlay">
      <form className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="totpSetupTitle" onSubmit={submit}>
        <h2 className="modal-title" id="totpSetupTitle">{t("totp.title", locale)}</h2>
        <p className="modal-sub">{t("totp.desc", locale)}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr" src={data.qr_code} alt={t("totp.qrAlt", locale)} />
        <p className="modal-hint">
          {t("totp.manualKey", locale)} <strong>{data.secret}</strong>
        </p>
        <label htmlFor="totpSetupCode">{t("totp.codeLabel", locale)}</label>
        <input
          className="input"
          id="totpSetupCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
        <p className="field-error" role="alert">{error}</p>
        <div className="modal-actions">
          <button className="btn btn--ghost" type="button" onClick={cancel}>{t("action.cancel", locale)}</button>
          <button className="btn btn--primary" type="submit" disabled={busy}>{t("totp.verifyAndEnable", locale)}</button>
        </div>
      </form>
    </div>
  );
}

export function RecoveryCodesModal({
  locale,
  codes,
  close,
}: {
  locale: AccountLocale;
  codes: string[];
  close: () => void;
}) {
  const { showToast } = useSession();
  const [saved, setSaved] = useState(false);
  const text = codes.join("\n");

  function copy() {
    navigator.clipboard.writeText(text).then(() => showToast(t("recovery.copied", locale)));
  }
  function download() {
    const url = URL.createObjectURL(new Blob([`${t("recovery.fileHeader", locale)}\n\n${text}\n`], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vevit-recovery-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overlay">
      <div className="modal modal--wide" role="dialog" aria-modal="true" aria-labelledby="recoveryTitle">
        <h2 className="modal-title" id="recoveryTitle">{t("recovery.title", locale)}</h2>
        <p className="modal-sub">{t("recovery.desc", locale)}</p>
        <div className="codes">
          {codes.map((code) => <code className="code" key={code}>{code}</code>)}
        </div>
        <div className="modal-actions">
          <button className="btn btn--ghost" type="button" onClick={copy}>{t("recovery.copy", locale)}</button>
          <button className="btn btn--ghost" type="button" onClick={download}>{t("recovery.download", locale)}</button>
        </div>
        <label className="settings-toggle">
          <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
          <span>{t("recovery.savedConfirm", locale)}</span>
        </label>
        <button className="btn btn--primary" type="button" disabled={!saved} onClick={close}>{t("recovery.done", locale)}</button>
      </div>
    </div>
  );
}