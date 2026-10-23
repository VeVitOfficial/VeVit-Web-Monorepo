"use client";

// Moje třídy (učitel, admin): založení třídy, kód pro žáky a odkaz na správu třídy.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { formatClassCode } from "@/lib/edu/aifb/access";
import { classPath } from "@/lib/edu/aifb/routes";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { postAifb } from "./api-client";
import { CopyCode } from "./copy-code";

export type DashboardClass = { id: string; name: string; category: string; code: string; students: number; unlocked: number };

export function TeacherDashboard({
  locale, categories, classes, csrfToken,
}: { locale: EduLocale; categories: { id: string; title: string }[]; classes: DashboardClass[]; csrfToken: string | null }) {
  const { t } = useEduLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const titleOf = (id: string) => categories.find((item) => item.id === id)?.title ?? id;

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const result = await postAifb("tridy", { action: "create", name: name.trim(), category }, csrfToken);
    setBusy(false);
    if (!result.ok) {
      setMessage(t("aifb.teacher.failed"));
      return;
    }
    setMessage(t("aifb.teacher.created", { name: name.trim() }));
    setName("");
    router.refresh();
  }

  return (
    <>
      <section className="aifb-section" aria-labelledby="aifb-new-class">
        <h2 className="eh-h2" id="aifb-new-class"><span className="eh-bullet" aria-hidden="true" />{t("aifb.teacher.create")}</h2>
        <form className="aifb-form" onSubmit={create}>
          <label className="aifb-form__field">
            <span>{t("aifb.teacher.name")}</span>
            <input type="text" value={name} maxLength={80} required placeholder={t("aifb.teacher.namePlaceholder")} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="aifb-form__field">
            <span>{t("aifb.teacher.category")}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>{t("aifb.teacher.submit")}</button>
        </form>
        <p className="aifb-muted" role="status">{message}</p>
      </section>

      <section className="aifb-section" aria-labelledby="aifb-class-list">
        <h2 className="eh-h2" id="aifb-class-list"><span className="eh-bullet" aria-hidden="true" />{t("aifb.teacher.title")}</h2>
        {classes.length === 0 ? <p className="aifb-muted">{t("aifb.teacher.empty")}</p> : (
          <ul className="aifb-class-list">
            {classes.map((item) => (
              <li key={item.id} className="aifb-class-card">
                <p className="aifb-class-card__title">{item.name}</p>
                <p className="aifb-chips">
                  <span className="aifb-badge">{titleOf(item.category)}</span>
                  <span className="aifb-badge">{t("aifb.teacher.students", { n: item.students })}</span>
                  <span className="aifb-badge">{t("aifb.teacher.unlockedCount", { n: item.unlocked })}</span>
                </p>
                <p className="aifb-class-card__code">
                  <span className="aifb-muted">{t("aifb.teacher.code")}</span>{" "}
                  <strong className="aifb-code">{formatClassCode(item.code)}</strong>{" "}
                  <CopyCode code={formatClassCode(item.code)} />
                </p>
                <p><Link href={classPath(locale, item.id)} className="btn btn-ghost">{t("aifb.teacher.manage", { name: item.name })}</Link></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
