"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { accountT as t, accountTz } from "@/lib/account-i18n";
import { useAccountLocale } from "../use-account-locale";
import { writeLocaleCookie } from "../language-pill";
import { useAccountApi } from "../api";
import { useSession, type AccountUser } from "../session";
import { StateError } from "../ui";

/**
 * Port of loadPreferences + the preferencesForm submit branch from app.js,
 * including the language change → profile-update PATCH → redirect to
 * /<newBase>/<section> flow (vevit:locale-basechange contract).
 */

type PreferencesData = {
  preferences: {
    timezone: string | null;
    date_format: string | null;
    week_starts_on: string | null;
  };
};

const LANGUAGES: Array<[value: string, label: string]> = [
  ["cs", "Čeština"],
  ["de", "Deutsch"],
  ["es", "Español"],
  ["uk", "Українська"],
  ["fr", "Français"],
  ["sk", "Slovenčina"],
];

const ZONE_VALUES = [
  "Europe/Prague", "Europe/Bratislava", "Europe/Berlin", "Europe/Madrid", "Europe/Paris",
  "Europe/Kyiv", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo",
  "Australia/Sydney", "UTC",
];

export function PreferencesSection() {
  const locale = useAccountLocale();
  const { user, setUser, showToast } = useSession();
  const router = useRouter();
  const run = useAccountApi();
  const [data, setData] = useState<PreferencesData | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => run<PreferencesData>("preferences.php"), [run]);

  const refresh = useCallback(() => {
    fetch().then(
      (data) => {
        setData(data);
        setFailed(false);
      },
      (error) => {
        console.error("Preferences load failed", error);
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
    const language = (form.elements.namedItem("language") as HTMLSelectElement).value;
    setSaving(true);
    try {
      await run("preferences.php", {
        method: "POST",
        body: {
          timezone: (form.elements.namedItem("timezone") as HTMLSelectElement).value,
          date_format: (form.elements.namedItem("date_format") as HTMLSelectElement).value,
          week_starts_on: (form.elements.namedItem("week_starts_on") as HTMLSelectElement).value,
        },
      });
      if (language !== user.language) {
        const result = await run<{ user: AccountUser }>("profile-update.php", { method: "PATCH", body: { language } });
        setUser(result.user);
        // Base language stored in DB → navigate to /<newBase>/<section> so the
        // whole dashboard re-renders in the new base locale (legacy pill
        // contract: EN can never be the base, defensive fallback to cs).
        const base = (result.user as AccountUser).language === "en" ? "cs" : (result.user as AccountUser).language;
        writeLocaleCookie(base);
        const sectionPath = window.location.pathname.replace(/^\/(?:cs|en|de|es|uk|fr|sk)/, "");
        router.push(`/${base}${sectionPath || "/account"}`);
        return;
      }
      showToast(t("notif.saved", locale));
      refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("error.requestFailed", locale), "error");
    } finally {
      setSaving(false);
    }
  }

  if (failed) {
    return <StateError message={t("prefs.loadFailed", locale)} onRetry={refresh} retryLabel={t("action.retry", locale)} />;
  }
  if (!data) {
    return <div className="card"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line skeleton--short" /></div>;
  }

  const prefs = data.preferences || {};
  const language = user.language || "cs";
  return (
    <form className="card settings-form" onSubmit={save}>
      <div className="card-heading">
        <div>
          <h2>{t("prefs.title", locale)}</h2>
          <p>{t("prefs.desc", locale)}</p>
        </div>
      </div>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="prefLanguage">{t("prefs.language", locale)}</label>
          <select className="input" id="prefLanguage" name="language" defaultValue={language}>
            {LANGUAGES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="prefTimezone">{t("prefs.timezone", locale)}</label>
          <select className="input" id="prefTimezone" name="timezone" defaultValue={prefs.timezone ?? ""}>
            {ZONE_VALUES.map((value) => (
              <option key={value} value={value}>{accountTz(value, locale)} ({value})</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="prefDateFormat">{t("prefs.dateFormat", locale)}</label>
          <select className="input" id="prefDateFormat" name="date_format" defaultValue={prefs.date_format ?? "DD. MM. YYYY"}>
            <option>DD. MM. YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="prefWeek">{t("prefs.weekStart", locale)}</label>
          <select className="input" id="prefWeek" name="week_starts_on" defaultValue={prefs.week_starts_on ?? "monday"}>
            <option value="monday">{t("prefs.monday", locale)}</option>
            <option value="sunday">{t("prefs.sunday", locale)}</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn--primary" type="submit" disabled={saving}>{t("action.saveSettings", locale)}</button>
      </div>
    </form>
  );
}