"use client";

import { useState } from "react";

/**
 * Port of account/assets/onboarding.js + markup z account/onboarding.php:
 * doplnění jména a přezdívky při prvním přihlášení přes OAuth.
 */

const DICT: Record<string, Record<string, string>> = {
  cs: {
    title: "Dokončete svůj profil",
    sub: "Ještě potřebujeme jméno a jedinečnou přezdívku.",
    name: "Jméno a příjmení",
    nickname: "Přezdívka",
    submit: "Pokračovat do účtu",
    error: "Nastavení profilu se nepodařilo dokončit.",
  },
  en: {
    title: "Finish setting up your profile",
    sub: "We still need your name and a unique nickname.",
    name: "Full name",
    nickname: "Nickname",
    submit: "Continue to your account",
    error: "Could not finish setting up your profile.",
  },
};
function tr(locale: string, key: string): string {
  return DICT[locale]?.[key] ?? DICT.cs[key];
}

export function OnboardingForm({ fullName, locale }: { fullName: string; locale: string }) {
  const [name, setName] = useState(fullName);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/account/api/onboarding.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: name, nickname }),
      });
      if (response.ok) {
        location.replace("/account");
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(data.error || tr(locale, "error"));
      setBusy(false);
    } catch {
      setError(tr(locale, "error"));
      setBusy(false);
    }
  }

  return (
    <section className="card" aria-labelledby="title">
      <div className="auth-brand">
        <span className="brand-mark">v</span>
        <span className="brand-name">vevit</span>
      </div>
      <h1 id="title">{tr(locale, "title")}</h1>
      <p className="auth-sub">{tr(locale, "sub")}</p>
      <form onSubmit={submit}>
        <label className="field">
          <span>{tr(locale, "name")}</span>
          <input className="input" id="name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>{tr(locale, "nickname")}</span>
          <input
            className="input input--mono"
            id="nickname"
            required
            autoComplete="username"
            autoCapitalize="none"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </label>
        <p className="error" role="alert" aria-live="polite">{error}</p>
        <button className="btn btn--primary" type="submit" disabled={busy}>{tr(locale, "submit")}</button>
      </form>
    </section>
  );
}