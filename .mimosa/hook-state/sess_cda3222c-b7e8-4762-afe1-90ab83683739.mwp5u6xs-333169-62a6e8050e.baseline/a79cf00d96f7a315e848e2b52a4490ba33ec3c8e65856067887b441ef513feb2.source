"use client";

// Školy (VeVit admin): založení školy, správci školy podle e-mailu účtu VeVit (vybírá je ředitel),
// odkaz na správu školy a zrušení školy.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import { formatSchoolCode, schoolManagePath } from "@/lib/edu/school/school";
import { postSchool } from "./api-client";

export type AdminSchool = {
  id: string; name: string; code: string; teachers: number; students: number;
  admins: { userId: string; label: string }[];
};

export function SchoolsAdmin({ locale, schools, csrfToken }: { locale: string; schools: AdminSchool[]; csrfToken: string | null }) {
  const { t } = useEduLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const call = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMessage("");
    const result = await postSchool("sprava", body, csrfToken);
    setBusy(false);
    setMessage(result.ok ? t("school.saved") : t(result.error === "unknown_user" ? "school.manage.unknownUser" : "school.failed"));
    if (result.ok) router.refresh();
    return result.ok;
  };

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await call({ action: "create_school", name: name.trim() })) setName("");
  }

  async function addAdmin(schoolId: string) {
    const email = (emails[schoolId] ?? "").trim();
    if (email && (await call({ action: "add_admin", school_id: schoolId, email }))) setEmails({ ...emails, [schoolId]: "" });
  }

  return (
    <>
      <p className="aifb-status" role="status" aria-live="polite">{message}</p>
      <form className="aifb-form aifb-section" onSubmit={create}>
        <label className="aifb-form__field">
          <span>{t("school.admin.name")}</span>
          <input type="text" value={name} minLength={2} maxLength={120} required onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={busy || name.trim().length < 2}>{t("school.admin.create")}</button>
      </form>

      {schools.length === 0 ? <p className="aifb-muted">{t("school.admin.none")}</p> : (
        <ul className="aifb-class-list">
          {schools.map((school) => (
            <li key={school.id} className="aifb-class-card">
              <p className="aifb-class-card__title"><Link href={`${schoolManagePath(locale)}?skola=${school.id}`}>{school.name}</Link></p>
              <p className="aifb-chips">
                <span className="aifb-badge">{formatSchoolCode(school.code)}</span>
                <span className="aifb-badge">{t("school.admin.teachers", { n: school.teachers })}</span>
                <span className="aifb-badge">{t("school.groups.students", { n: school.students })}</span>
              </p>
              <p className="school-nav__label">{t("school.admin.admins")}</p>
              {school.admins.length === 0 ? <p className="aifb-muted">{t("school.admin.noAdmins")}</p> : (
                <ul className="aifb-unlock__list">
                  {school.admins.map((admin) => (
                    <li key={admin.userId} className="school-row">
                      <span>{admin.label}</span>
                      <button type="button" className="btn btn-ghost aifb-btn-sm" disabled={busy} onClick={() => call({ action: "remove_admin", school_id: school.id, user_id: admin.userId })}>{t("school.admin.removeAdmin")}</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="aifb-form">
                <label className="aifb-form__field">
                  <span>{t("school.admin.adminEmail")}</span>
                  <input type="email" value={emails[school.id] ?? ""} maxLength={200} onChange={(e) => setEmails({ ...emails, [school.id]: e.target.value })} />
                </label>
                <button type="button" className="btn btn-ghost" disabled={busy || !(emails[school.id] ?? "").trim()} onClick={() => addAdmin(school.id)}>{t("school.admin.addAdmin")}</button>
              </div>
              <p className="aifb-unlock__actions">
                <button
                  type="button"
                  className="btn btn-ghost aifb-btn-sm aifb-btn-danger"
                  disabled={busy}
                  onClick={() => window.confirm(t("school.admin.archiveConfirm", { name: school.name })) && call({ action: "archive_school", school_id: school.id })}
                >
                  {t("school.admin.archive")}
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
