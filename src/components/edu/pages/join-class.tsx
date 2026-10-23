"use client";

// „Máš kód třídy?“ na stránce VeVit Edu pro školy: přihlášený žák zadá kód od učitele, připojí se
// ke třídě a dostane rank student (endpoint /edu/api/aifb/pripojit). Nepřihlášený dostane odkaz
// na přihlášení s návratem zpět. Třídy jde i opustit. Styly jen z tříd, které stránka už používá.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { normalizeClassCode } from "@/lib/edu/aifb/access";
import { postAifb } from "../aifb/api-client";

const INPUT_CLS =
  "w-full rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";
const PRIMARY_CLS =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const LINK_CLS = "text-sm font-semibold text-emerald-500 hover:text-emerald-400";

export type JoinedClass = { id: string; name: string; categoryTitle: string };

const ERRORS: Record<string, string> = {
  bad_code: "aifb.join.badCode",
  unknown_code: "aifb.join.unknown",
  own_class: "aifb.join.own",
  rate_limited: "aifb.join.rate",
};

export function JoinClass({
  loggedIn, csrfToken, classes, isStaff, loginHref, registerHref, aifbHref, teacherHref,
}: {
  loggedIn: boolean;
  csrfToken: string | null;
  classes: JoinedClass[];
  isStaff: boolean;
  loginHref: string;
  registerHref: string;
  aifbHref: string;
  teacherHref: string;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!normalizeClassCode(code)) {
      setError(t("aifb.join.badCode"));
      return;
    }
    setBusy(true);
    const result = await postAifb("pripojit", { action: "join", code }, csrfToken);
    setBusy(false);
    if (!result.ok) {
      setError(t(ERRORS[result.error ?? ""] ?? "aifb.join.failed"));
      return;
    }
    setSuccess(t("aifb.join.success", { name: String(result.name ?? "") }));
    setCode("");
    router.refresh();
  }

  async function leave(item: JoinedClass) {
    if (!window.confirm(t("aifb.join.leaveConfirm", { name: item.name }))) return;
    setBusy(true);
    const result = await postAifb("pripojit", { action: "leave", class_id: item.id }, csrfToken);
    setBusy(false);
    if (result.ok) {
      setSuccess(t("aifb.join.left", { name: item.name }));
      router.refresh();
    } else {
      setError(t("aifb.join.failed"));
    }
  }

  return (
    <section id="trida" className="py-14 scroll-mt-24" aria-labelledby="skoly-join-title">
      <div className="max-w-lg mx-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 md:p-8">
        <h2 id="skoly-join-title" className="text-lg font-semibold mb-1.5 text-[var(--color-text-primary)]">{t("aifb.join.title")}</h2>
        <p className="text-sm mb-6 text-[var(--color-text-secondary)]">{t("aifb.join.lead")}</p>

        {!loggedIn ? (
          <>
            <p className="text-sm mb-4 text-[var(--color-text-secondary)]">{t("aifb.join.login")}</p>
            <p className="flex flex-wrap items-center gap-4">
              <a className={PRIMARY_CLS} href={loginHref}>{t("aifb.join.loginCta")}</a>
              <a className={LINK_CLS} href={registerHref}>{t("aifb.join.registerCta")}</a>
            </p>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="skoly-class-code" className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">{t("aifb.join.label")}</label>
              <input
                id="skoly-class-code"
                className={INPUT_CLS}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("aifb.join.placeholder")}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "skoly-class-error" : undefined}
              />
            </div>
            {error ? <p id="skoly-class-error" className="mt-1 text-xs text-red-400" role="alert">{error}</p> : null}
            <button type="submit" className={`w-full ${PRIMARY_CLS}`} disabled={busy || code.trim() === ""}>{t("aifb.join.submit")}</button>
          </form>
        )}

        <div role="status" aria-live="polite">
          {success ? (
            <p className="mt-4 text-sm text-[var(--color-text-primary)]">
              {success} <a className={LINK_CLS} href={aifbHref}>{t("aifb.join.open")}</a>
            </p>
          ) : null}
        </div>

        {loggedIn && classes.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-2 text-[var(--color-text-primary)]">{t("aifb.join.myClasses")}</h3>
            <ul className="space-y-3">
              {classes.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span><strong className="text-[var(--color-text-primary)]">{item.name}</strong> · {item.categoryTitle}</span>
                  <button type="button" className={LINK_CLS} disabled={busy} onClick={() => leave(item)}>{t("aifb.join.leave")}</button>
                </li>
              ))}
            </ul>
            <p className="mt-4"><a className={LINK_CLS} href={aifbHref}>{t("aifb.join.open")}</a></p>
          </div>
        ) : null}

        {isStaff ? (
          <p className="mt-6 text-sm text-[var(--color-text-secondary)]">
            {t("aifb.join.teacher")} <a className={LINK_CLS} href={teacherHref}>{t("aifb.teacher.title")}</a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
