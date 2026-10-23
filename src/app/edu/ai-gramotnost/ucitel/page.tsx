// /edu/ai-gramotnost/ucitel → Moje třídy (rank teacher nebo admin): založení třídy a kódy pro žáky.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { listTeacherClasses } from "@/lib/edu/aifb/classes";
import { getCatalog } from "@/lib/edu/aifb/content";
import { gateStaff } from "@/lib/edu/aifb/gate";
import { hubPath, teacherPath } from "@/lib/edu/aifb/routes";
import { CONTENT_CATEGORY_IDS } from "@/lib/edu/aifb/types";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { Crumbs } from "@/components/edu/aifb/crumbs";
import { TeacherDashboard } from "@/components/edu/aifb/teacher-dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("aifb.teacher.title")} – ${t("aifb.crumbs.hub")}`, robots: { index: false } };
}

export default async function TeacherRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  gateStaff(viewer, locale);
  const t = aifbT(locale);
  const classes = viewer.userId ? await listTeacherClasses(viewer.userId) : [];
  const categories = getCatalog().categories
    .filter((category) => (CONTENT_CATEGORY_IDS as readonly string[]).includes(category.id))
    .map((category) => ({ id: category.id, title: category.title }));
  return (
    <AifbFrame locale={locale}>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: t("aifb.teacher.title"), href: teacherPath(locale) },
        ]}
      />
      <header className="aifb-head">
        <h1>{t("aifb.teacher.title")}</h1>
        <p className="aifb-lead">{t("aifb.teacher.lead")}</p>
        <p className="aifb-muted">{t("aifb.teacher.howJoin")}</p>
      </header>
      {!viewer.userId ? (
        <p className="aifb-callout" role="note">{t("aifb.teacher.loginNeeded")}</p>
      ) : classes === null ? (
        <p className="aifb-callout" role="alert">{t("aifb.teacher.loadFailed")}</p>
      ) : (
        <TeacherDashboard locale={locale} categories={categories} classes={classes} csrfToken={viewer.csrfToken} />
      )}
    </AifbFrame>
  );
}
