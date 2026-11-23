// Serverový rámec portálu VeVit Edu pro školy: Edu shell, menu podle role a obsah.
//   žák      Moje lekce
//   učitel   Přehled, Obsah a metodika, Moje třídy, Průběh žáků, Tvorba, Komunita, Ze sešitu přes AI
//   správce  Správa školy
//   admin    Školy (VeVit admin)

import Link from "next/link";
import type { ReactNode } from "react";
import { EduRoot } from "../edu-root";
import { aifbT } from "@/lib/edu/aifb/i18n";
import type { EduLocale } from "@/lib/edu/i18n-data";
import {
  schoolAdminPath, schoolCommunityPath, schoolContentPath, schoolCreatePath, schoolGroupsPath, schoolHome, schoolManagePath,
  schoolProgressPath, schoolWorkbookPath,
} from "@/lib/edu/school/school";
import { isSchoolManager, isSchoolTeacher, type SchoolViewer } from "@/lib/edu/school/viewer";

export type SchoolSection =
  | "home" | "content" | "groups" | "progress" | "create" | "community" | "workbook" | "manage" | "admin";

type NavItem = { key: SchoolSection; href: string; label: string; soon?: string };

function NavGroup({ label, items, active }: { label: string; items: NavItem[]; active: SchoolSection }) {
  return (
    <div>
      <p className="school-nav__label">{label}</p>
      <ul className="school-nav__group">
        {items.map((item) => (
          <li key={item.key}>
            <Link className="school-nav__link" href={item.href} aria-current={item.key === active ? "page" : undefined}>
              <span>{item.label}</span>
              {item.soon ? <span className="school-nav__soon">{item.soon}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SchoolFrame({
  locale, viewer, active, children,
}: { locale: EduLocale; viewer: SchoolViewer; active: SchoolSection; children: ReactNode }) {
  const t = aifbT(locale);
  const teacher = isSchoolTeacher(viewer);
  const schoolName = viewer.student?.schoolName ?? viewer.teacherOf[0]?.name ?? viewer.adminOf[0]?.name ?? "";
  const who = viewer.student
    ? `${viewer.student.firstName} ${viewer.student.lastName}${viewer.student.className ? `, ${viewer.student.className}` : ""}`
    : teacher ? t("school.role.teacher") : isSchoolManager(viewer) ? t("school.role.manager") : "";

  const teaching: NavItem[] = [
    { key: "home", href: schoolHome(locale), label: t("school.nav.home") },
    { key: "content", href: schoolContentPath(locale), label: t("school.nav.content") },
    { key: "groups", href: schoolGroupsPath(locale), label: t("school.nav.groups") },
    { key: "progress", href: schoolProgressPath(locale), label: t("school.nav.progress") },
  ];
  const creating: NavItem[] = [
    { key: "create", href: schoolCreatePath(locale), label: t("school.nav.create") },
    { key: "community", href: schoolCommunityPath(locale), label: t("school.nav.community") },
    { key: "workbook", href: schoolWorkbookPath(locale), label: t("school.nav.workbook") },
  ];

  return (
    <EduRoot locale={locale}>
      <div className="aigram aifb">
        <main className="aigram-main aifb-main">
          {locale !== "cs" ? <p className="aifb-notice" role="note">{t("aifb.langNotice")}</p> : null}
          <div className="school-shell">
            <nav className="school-nav" aria-label={t("school.nav.label")}>
              <p className="school-nav__who">
                <strong>{t("school.title")}</strong>
                {schoolName}{who ? <><br />{who}</> : null}
              </p>
              {teacher ? (
                <>
                  <NavGroup label={t("school.nav.teaching")} items={teaching} active={active} />
                  <NavGroup label={t("school.nav.creating")} items={creating} active={active} />
                </>
              ) : viewer.student ? (
                <NavGroup label={t("school.nav.student")} items={[{ key: "home", href: schoolHome(locale), label: t("school.nav.myLessons") }]} active={active} />
              ) : null}
              {isSchoolManager(viewer) && viewer.adminOf.length > 0 ? (
                <NavGroup label={t("school.nav.school")} items={[{ key: "manage", href: schoolManagePath(locale), label: t("school.nav.manage") }]} active={active} />
              ) : null}
              {viewer.isAdmin ? (
                <NavGroup label={t("school.nav.vevit")} items={[{ key: "admin", href: schoolAdminPath(locale), label: t("school.nav.schools") }]} active={active} />
              ) : null}
            </nav>
            <div>{children}</div>
          </div>
        </main>
      </div>
    </EduRoot>
  );
}
