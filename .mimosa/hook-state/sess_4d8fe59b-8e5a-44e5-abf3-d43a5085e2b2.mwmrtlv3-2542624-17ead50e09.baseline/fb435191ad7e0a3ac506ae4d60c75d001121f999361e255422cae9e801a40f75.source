"use client";

// „Máš kód školy?“ na stránce VeVit Edu pro školy. Přihlášený žák zadá kód školy, potom jméno,
// příjmení a vybere svou kmenovou třídu; tím se zapíše do školy (rank student) a otevře se portál
// /edu/school. Kdo už ve škole je (žák, učitel, správce), dostane rovnou tlačítko „Vstoupit do třídy“.
// Endpoint /edu/api/school/vstup. Styly jen z tříd, které stránka už používá.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { normalizePersonName, normalizeSchoolCode } from "@/lib/edu/school/school";
import { postSchool } from "../school/api-client";

const INPUT_CLS =
  "w-full rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-vv-green/50 focus:ring-1 focus:ring-vv-green/20 transition-colors";
const PRIMARY_CLS =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-vv-green text-black hover:bg-vv-green-dim disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const LINK_CLS = "text-sm font-semibold text-vv-green hover:text-vv-green-hi";
const LABEL_CLS = "block text-sm font-medium text-[var(--color-text-primary)] mb-1.5";

const ERRORS: Record<string, string> = {
  bad_code: "school.join.badCode",
  unknown_code: "school.join.unknown",
  unknown_class: "school.join.unknownClass",
  other_school: "school.join.otherSchool",
  bad_name: "school.join.badName",
  rate_limited: "aifb.join.rate",
};

export function JoinSchool({
  loggedIn, csrfToken, schoolName, loginHref, registerHref, portalHref,
}: {
  loggedIn: boolean;
  csrfToken: string | null;
  /** Škola, ve které už přihlášený je (žák, učitel, správce); null = zatím v žádné. */
  schoolName: string | null;
  loginHref: string;
  registerHref: string;
  portalHref: string;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [school, setSchool] = useState<{ name: string; classes: { id: string; name: string }[] } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classId, setClassId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!normalizeSchoolCode(code)) {
      setError(t("school.join.badCode"));
      return;
    }
    setBusy(true);
    const result = await postSchool("vstup", { action: "check", code }, csrfToken);
    setBusy(false);
    if (!result.ok) {
      setError(t(ERRORS[result.error ?? ""] ?? "school.join.failed"));
      return;
    }
    const classes = Array.isArray(result.classes) ? (result.classes as { id: string; name: string }[]) : [];
    setSchool({ name: String(result.name ?? ""), classes });
    setClassId("");
  }

  async function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!normalizePersonName(firstName) || !normalizePersonName(lastName)) {
      setError(t("school.join.badName"));
      return;
    }
    if (!classId) {
      setError(t("school.join.pickClass"));
      return;
    }
    setBusy(true);
    const result = await postSchool("vstup", { action: "join", code, first_name: firstName, last_name: lastName, class_id: classId }, csrfToken);
    setBusy(false);
    if (!result.ok) {
      setError(t(ERRORS[result.error ?? ""] ?? "school.join.failed"));
      return;
    }
    router.push(portalHref);
  }

  return (
    <section id="skola" className="py-14 scroll-mt-24" aria-labelledby="skola-join-title">
      <div className="rounded-xl border border-vv-green/30 bg-vv-green/10 p-6 md:p-8">
        <h2 id="skola-join-title" className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          {schoolName ? t("school.join.inTitle", { name: schoolName }) : t("school.join.title")}
        </h2>

        {schoolName ? (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t("school.join.inLead")}</p>
            <a href={portalHref} className={PRIMARY_CLS}>{t("school.enter")}</a>
          </>
        ) : !loggedIn ? (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t("school.join.login")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <a href={loginHref} className={PRIMARY_CLS}>{t("aifb.join.loginCta")}</a>
              <a href={registerHref} className={LINK_CLS}>{t("aifb.join.registerCta")}</a>
            </div>
          </>
        ) : !school ? (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t("school.join.lead")}</p>
            <form onSubmit={check} noValidate className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[12rem]">
                <label htmlFor="skola-code" className={LABEL_CLS}>{t("school.join.label")}</label>
                <input
                  id="skola-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ABCD-2345"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={12}
                  className={`${INPUT_CLS} font-mono tracking-widest uppercase`}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "skola-error" : undefined}
                />
              </div>
              <button type="submit" disabled={busy} className={PRIMARY_CLS}>{t("school.join.continue")}</button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t("school.join.step2", { name: school.name })}</p>
            <form onSubmit={join} noValidate className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="skola-first" className={LABEL_CLS}>{t("school.join.firstName")}</label>
                <input id="skola-first" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={60} className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="skola-last" className={LABEL_CLS}>{t("school.join.lastName")}</label>
                <input id="skola-last" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" maxLength={60} className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="skola-class" className={LABEL_CLS}>{t("school.join.class")}</label>
                <select id="skola-class" value={classId} onChange={(e) => setClassId(e.target.value)} className={INPUT_CLS}>
                  <option value="">{t("school.join.pickClass")}</option>
                  {school.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <p className="md:col-span-3 text-xs text-[var(--color-text-muted)]">{t("school.join.privacy")}</p>
              <div className="md:col-span-3 flex flex-wrap items-center gap-4">
                <button type="submit" disabled={busy} className={PRIMARY_CLS}>{t("school.join.submit")}</button>
                <button type="button" className={LINK_CLS} onClick={() => { setSchool(null); setError(""); }}>{t("school.join.otherCode")}</button>
              </div>
            </form>
          </>
        )}

        {error ? <p id="skola-error" role="alert" className="mt-3 text-sm text-danger-text">{error}</p> : null}
      </div>
    </section>
  );
}
