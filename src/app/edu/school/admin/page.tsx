// /edu/school/admin → Školy (jen VeVit admin): založení školy a určení správce školy.
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { gateSchool } from "@/lib/edu/school/gate";
import { schoolAdminPath, schoolHome } from "@/lib/edu/school/school";
import { listSchools } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { SchoolsAdmin } from "@/components/edu/school/schools-admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("school.nav.schools")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolAdminRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getSchoolViewer()]);
  gateSchool(viewer, locale, schoolAdminPath(locale));
  if (!viewer.isAdmin) redirect(schoolHome(locale));
  const t = aifbT(locale);
  const schools = await listSchools();

  return (
    <SchoolFrame locale={locale} viewer={viewer} active="admin">
      <header className="aifb-head">
        <h1>{t("school.nav.schools")}</h1>
        <p className="aifb-lead">{t("school.admin.lead")}</p>
      </header>
      {schools === null ? <p className="aifb-callout" role="alert">{t("school.loadFailed")}</p> : (
        <SchoolsAdmin
          locale={locale}
          schools={schools.map((s) => ({
            id: s.id, name: s.name, code: s.code, teachers: s.teachers, students: s.students,
            admins: s.admins.map((p) => ({ userId: p.userId, label: p.nickname ? `${p.nickname} (${p.email})` : p.email })),
          }))}
          csrfToken={viewer.csrfToken}
        />
      )}
    </SchoolFrame>
  );
}
