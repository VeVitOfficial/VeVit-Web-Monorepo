"use client";

import { useState } from "react";
import { accountT as t } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { useSession } from "../session";

/** Port of loadPrivacy + export-data / delete-account actions from app.js. */

export function PrivacySection() {
  const locale = useAccountLocale();
  const { showToast } = useSession();
  const run = useAccountApi();
  const [exporting, setExporting] = useState(false);

  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await fetch("/account/api/export-data.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error(t("privacy.exportFailed", locale));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vevit-export.json";
      link.click();
      URL.revokeObjectURL(url);
      showToast(t("privacy.exported", locale));
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("privacy.exportFailed", locale), "error");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if ((prompt(t("privacy.deleteConfirmPrompt", locale)) || "") !== "SMAZAT") return;
    const password = prompt(t("privacy.deletePasswordPrompt", locale));
    if (password === null) return;
    try {
      await run("delete-account.php", { method: "POST", body: { confirmation: "SMAZAT", current_password: password } });
      window.location.replace("/account/login");
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    }
  }

  return (
    <section>
      <article className="card">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("privacy.exportTitle", locale)}</h2>
            <p>{t("privacy.exportDesc", locale)}</p>
          </div>
          <button className="btn btn--primary btn--sm" type="button" disabled={exporting} aria-busy={exporting} onClick={exportData}>
            {t("privacy.exportAction", locale)}
          </button>
        </div>
      </article>
      <article className="card card--danger">
        <div className="card-heading card-heading--split">
          <div>
            <h2>{t("privacy.deleteTitle", locale)}</h2>
            <p>{t("privacy.deleteDesc", locale)}</p>
          </div>
          <button className="btn btn--warn btn--sm" type="button" onClick={deleteAccount}>{t("privacy.deleteAction", locale)}</button>
        </div>
      </article>
    </section>
  );
}