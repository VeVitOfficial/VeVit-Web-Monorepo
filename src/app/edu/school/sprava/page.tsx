// /edu/school/sprava[?skola=<id>] → Správa školy (správce školy, VeVit admin). Správce víc škol
// a admin vybírají školu parametrem ?skola.
import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { getCatalog } from "@/lib/edu/aifb/content";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { CONTENT_CATEGORY_IDS } from "@/lib/edu/aifb/types";
import { gateManager } from "@/lib/edu/school/gate";
import { fullName, schoolAdminPath, schoolManagePath } from "@/lib/edu/school/school";
import { schoolDetail } from "@/lib/edu/school/store";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";
import { SchoolManager } from "@/components/edu/school/school-manager";

type Props = { searchParams: Promise<{ skola?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("school.nav.manage")} – ${t("school.title")}`, robots: { index: false } };
}

export default async function SchoolManageRoute({ searchParams }: Props) {
  await connection();
  const [{ skola }, locale, viewer] = await Promise.all([searchParams, readEduLocale(), getSchoolViewer()]);
  gateManager(viewer, locale, schoolManagePath(locale));
  const t = aifbT(locale);

  const schoolId = skola ?? (viewer.adminOf.length === 1 ? viewer.adminOf[0].id : undefined);
  if (!schoolId) {
    if (viewer.adminOf.length === 0) redirect(schoolAdminPath(locale));
    return (
      <SchoolFrame locale={locale} viewer={viewer} active="manage">
        <header className="aifb-head"><h1>{t("school.nav.manage")}</h1></header>
        <ul className="aifb-link-list">
          {viewer.adminOf.map((s) => <li key={s.id}><Link href={`${schoolManagePath(locale)}?skola=${s.id}`}>{s.name}</Link></li>)}
        </ul>
      </SchoolFrame>
    );
  }
  if (!viewer.isAdmin && !viewer.adminOf.some((s) => s.id === schoolId)) notFound();
  const detail = await schoolDetail(schoolId);
  if (!detail) notFound();
  const courses = getCatalog().categories
    .filter((c) => (CONTENT_CATEGORY_IDS as readonly string[]).includes(c.id))
    .map((c) => ({ id: c.id, title: c.title }));

  return (
    <SchoolFrame locale={locale} viewer={viewer} active={viewer.adminOf.some((s) => s.id === schoolId) ? "manage" : "admin"}>
      <SchoolManager
        locale={locale}
        schoolId={detail.school.id}
        name={detail.school.name}
        code={detail.school.code}
        courses={courses}
        classes={detail.classes}
        teachers={detail.teachers.map((p) => ({ userId: p.userId, label: p.nickname ? `${p.nickname} (${p.email})` : p.email }))}
        students={detail.students.map((s) => ({ userId: s.userId, name: fullName(s), classId: s.classId, joinedAt: s.joinedAt }))}
        csrfToken={viewer.csrfToken}
      />
    </SchoolFrame>
  );
}
