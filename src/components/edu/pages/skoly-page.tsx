"use client";

// "VeVit Edu pro školy": coming-soon stránka pro /edu/skoly (Fáze 4).
// Honest pre-launch stránka: hero, co bude nabízet (obecně, na základě
// reálných dnešních schopností VeVit Edu), formulář registrace zájmu
// (Turnstile + API route) a FAQ, kde termín i cena zůstávají výslovně
// neurčené (viz docs/edu-v2/copy-open-questions.md). Žádné RVP/GDPR
// compliance tvrzení, jen "dbáme na to, aby obsah odpovídal potřebám škol".

import { useCallback, useEffect, useRef, useState } from "react";
import { useEduLang } from "../i18n";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { Icon as HomeIcon } from "./home-icons";
import { Icon as BlockIcon } from "../blocks/icon";
import { TurnstileField, captchaToken, resetCaptcha } from "@/components/account/auth/captcha";

const INPUT_CLS =
  "w-full rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

const OFFER_ITEMS = [
  { icon: "book-open", key: "item1" },
  { icon: "star", key: "item2" },
  { icon: "server", key: "item3" },
  { icon: "bar-chart-3", key: "item4" },
] as const;

const FAQ_ITEMS = ["q1", "q2", "q3", "q4"] as const;

type FieldKey = "name" | "school" | "email" | "message";
type Values = Record<FieldKey, string>;
type Touched = Record<FieldKey, boolean>;

const EMPTY_VALUES: Values = { name: "", school: "", email: "", message: "" };
const EMPTY_TOUCHED: Touched = { name: false, school: false, email: false, message: false };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EduSkolyPage({ locale }: { locale: string }) {
  void locale;
  const { t } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([{ label: t("skoly.pageTitle") }]);
  }, [setBreadcrumbs, t]);

  const scrollToForm = useCallback(() => {
    document.getElementById("skoly-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Hero t={t} onCta={scrollToForm} />
      <main className="max-w-4xl mx-auto px-6 py-4">
        <OfferSection t={t} />
        <InterestForm t={t} />
        <FaqSection t={t} />
      </main>
      <div className="h-20" />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ t, onCta }: { t: (key: string) => string; onCta: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border-subtle)]">
      <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-14 md:pt-24 md:pb-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 mb-6">
          <BlockIcon name="graduation-cap" className="h-3.5 w-3.5" />
          {t("skoly.hero.badge")}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-[var(--color-text-primary)]">
          {t("skoly.hero.title")}
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8 text-[var(--color-text-secondary)]">
          {t("skoly.hero.subtitle")}
        </p>
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
        >
          {t("skoly.hero.cta")}
          <HomeIcon name="arrow-right" className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

// ─── Nabídka ─────────────────────────────────────────────────────────────────

function OfferSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="py-14">
      <h2 className="text-xl md:text-2xl font-bold mb-8 text-center text-[var(--color-text-primary)]">
        {t("skoly.offer.title")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {OFFER_ITEMS.map(({ icon, key }) => (
          <div
            key={key}
            className="rounded-xl p-5 border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 bg-emerald-500/10 text-emerald-500">
              <HomeIcon name={icon} className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold mb-1.5 text-[var(--color-text-primary)]">
              {t(`skoly.offer.${key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t(`skoly.offer.${key}.text`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Formulář registrace zájmu ──────────────────────────────────────────────

function InterestForm({ t }: { t: (key: string) => string }) {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Touched>(EMPTY_TOUCHED);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const errors: Record<FieldKey, string> = {
    name: values.name.trim() === "" ? t("skoly.form.errorName") : "",
    school: values.school.trim() === "" ? t("skoly.form.errorSchool") : "",
    email: EMAIL_RE.test(values.email.trim()) ? "" : t("skoly.form.errorEmail"),
    message: "",
  };
  const allValid = errors.name === "" && errors.school === "" && errors.email === "";

  const handleChange = (key: FieldKey, value: string) => {
    setError("");
    setValues((prev) => ({ ...prev, [key]: value }));
  };
  const handleBlur = (key: FieldKey) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ name: true, school: true, email: true, message: true });
    if (!allValid) {
      setError(t("skoly.form.errorFields"));
      window.setTimeout(
        () => (formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus(),
        0,
      );
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/edu/api/skoly-interest", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          school: values.school.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          cf_turnstile: captchaToken(),
        }),
      });
      let data: { ok?: boolean; message?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* prázdná odpověď */
      }
      setSubmitting(false);
      if (!res.ok || !data.ok) {
        resetCaptcha();
        setError(data.message || t("skoly.form.errorGeneric"));
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitting(false);
      resetCaptcha();
      setError(t("skoly.form.errorNetwork"));
    }
  }

  if (success) {
    return (
      <section id="skoly-form" className="py-14 scroll-mt-24">
        <div className="max-w-lg mx-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center" role="status" aria-live="polite">
          <div className="h-12 w-12 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-500/20 text-emerald-500">
            <BlockIcon name="check-circle" className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-[var(--color-text-primary)]">{t("skoly.form.success")}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="skoly-form" className="py-14 scroll-mt-24">
      <div className="max-w-lg mx-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-6 md:p-8">
        <h2 className="text-lg font-semibold mb-1.5 text-[var(--color-text-primary)]">{t("skoly.form.title")}</h2>
        <p className="text-sm mb-6 text-[var(--color-text-secondary)]">{t("skoly.form.subtitle")}</p>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="skoly-name" className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              {t("skoly.form.name")} <span aria-hidden="true">*</span>
            </label>
            <input
              id="skoly-name"
              className={INPUT_CLS}
              type="text"
              autoComplete="name"
              placeholder={t("skoly.form.namePlaceholder")}
              required
              aria-required="true"
              aria-invalid={touched.name && errors.name !== ""}
              value={values.name}
              disabled={submitting}
              onChange={(e) => handleChange("name", e.target.value)}
              onBlur={() => handleBlur("name")}
            />
            {touched.name && errors.name ? <p className="mt-1 text-xs text-red-400">{errors.name}</p> : null}
          </div>

          <div>
            <label htmlFor="skoly-school" className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              {t("skoly.form.school")} <span aria-hidden="true">*</span>
            </label>
            <input
              id="skoly-school"
              className={INPUT_CLS}
              type="text"
              autoComplete="organization"
              placeholder={t("skoly.form.schoolPlaceholder")}
              required
              aria-required="true"
              aria-invalid={touched.school && errors.school !== ""}
              value={values.school}
              disabled={submitting}
              onChange={(e) => handleChange("school", e.target.value)}
              onBlur={() => handleBlur("school")}
            />
            {touched.school && errors.school ? <p className="mt-1 text-xs text-red-400">{errors.school}</p> : null}
          </div>

          <div>
            <label htmlFor="skoly-email" className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              {t("skoly.form.email")} <span aria-hidden="true">*</span>
            </label>
            <input
              id="skoly-email"
              className={INPUT_CLS}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t("skoly.form.emailPlaceholder")}
              required
              aria-required="true"
              aria-invalid={touched.email && errors.email !== ""}
              value={values.email}
              disabled={submitting}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
            />
            {touched.email && errors.email ? <p className="mt-1 text-xs text-red-400">{errors.email}</p> : null}
          </div>

          <div>
            <label htmlFor="skoly-message" className="block text-xs font-medium mb-1.5 text-[var(--color-text-secondary)]">
              {t("skoly.form.message")}
            </label>
            <textarea
              id="skoly-message"
              className={`${INPUT_CLS} resize-none`}
              rows={4}
              placeholder={t("skoly.form.messagePlaceholder")}
              value={values.message}
              disabled={submitting}
              onChange={(e) => handleChange("message", e.target.value)}
            />
          </div>

          <TurnstileField action="skoly_interest" style={{ marginTop: 4 }} />

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <span className="ai-spinner" aria-hidden="true" /> : null}
            {submitting ? t("skoly.form.submitting") : t("skoly.form.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FaqSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="py-14">
      <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-[var(--color-text-primary)]">
        {t("skoly.faq.title")}
      </h2>
      <div className="max-w-2xl mx-auto space-y-3">
        {FAQ_ITEMS.map((key) => (
          <details
            key={key}
            className="group rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-medium text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-md">
              {t(`skoly.faq.${key}`)}
              <HomeIcon
                name="arrow-right"
                className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t(`skoly.faq.${key.replace("q", "a")}`)}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
