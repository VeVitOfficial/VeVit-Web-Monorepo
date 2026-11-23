"use client";

import { useCallback, useEffect, useState } from "react";
import { accountT as t } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { useAccountApi } from "../api";
import { useSession } from "../session";
import { StateError } from "../ui";

/** Port of loadNotifications + the notificationsForm submit branch from app.js. */

type NotificationsData = {
  prefs: {
    product_updates: boolean;
    marketing: boolean;
    billing_summary: boolean;
  };
};

export function NotificationsSection() {
  const locale = useAccountLocale();
  const { showToast } = useSession();
  const run = useAccountApi();
  const [data, setData] = useState<NotificationsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => run<NotificationsData>("notifications.php"), [run]);

  const refresh = useCallback(() => {
    fetch().then(
      (data) => {
        setData(data);
        setFailed(false);
      },
      (error) => {
        console.error("Notifications load failed", error);
        setFailed(true);
      },
    );
  }, [fetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    setSaving(true);
    try {
      await run("notifications.php", {
        method: "POST",
        body: {
          product_updates: (form.elements.namedItem("product_updates") as HTMLInputElement).checked,
          marketing: (form.elements.namedItem("marketing") as HTMLInputElement).checked,
          billing_summary: (form.elements.namedItem("billing_summary") as HTMLInputElement).checked,
        },
      });
      showToast(t("notif.saved", locale));
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    } finally {
      setSaving(false);
    }
  }

  if (failed) {
    return <StateError message={t("notif.loadFailed", locale)} onRetry={refresh} retryLabel={t("action.retry", locale)} />;
  }
  if (!data) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  const prefs = data.prefs || { product_updates: false, marketing: false, billing_summary: false };
  return (
    <form className="card settings-form" onSubmit={save}>
      <div className="card-heading">
        <div>
          <h2>{t("notif.securityTitle", locale)}</h2>
          <p>{t("notif.securityDesc", locale)}</p>
        </div>
      </div>
      <label className="settings-toggle">
        <input type="checkbox" checked disabled readOnly />
        <span>{t("notif.securityToggle", locale)}</span>
      </label>
      <div className="card-heading">
        <div>
          <h2>{t("notif.productTitle", locale)}</h2>
          <p>{t("notif.productDesc", locale)}</p>
        </div>
      </div>
      <label className="settings-toggle">
        <input name="product_updates" type="checkbox" defaultChecked={prefs.product_updates} />
        <span>{t("notif.productUpdates", locale)}</span>
      </label>
      <label className="settings-toggle">
        <input name="marketing" type="checkbox" defaultChecked={prefs.marketing} />
        <span>{t("notif.marketing", locale)}</span>
      </label>
      <label className="settings-toggle">
        <input name="billing_summary" type="checkbox" defaultChecked={prefs.billing_summary} />
        <span>{t("notif.billingSummary", locale)}</span>
      </label>
      <div className="form-actions">
        <button className="btn btn--primary" type="submit" disabled={saving}>{t("action.saveSettings", locale)}</button>
      </div>
    </form>
  );
}