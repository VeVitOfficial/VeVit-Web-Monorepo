// /edu/school/obsah → Obsah a metodika (učitel): všechny kurzy pro školy (AIFB po kategoriích)
// s levely, průvodcem pro učitele a tiskovými podklady, online kurz a ostatní obsah VeVit Edu.
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { getCatalog } from "@/lib/edu/aifb/content";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, coursePath, guidePath, levelPath, levelSlug } from "@/lib/edu/aifb/routes";
import { CONTENT_CATEGORY_IDS } from "@/lib/edu/aifb/types";
import { gateTeacher } from "@/lib/edu/school/gate";
import { schoolContentPath } from "@/lib/edu/school/school";
import { getSchoolViewer } from "@/lib/edu/school/viewer";
import { SchoolFrame } from "@/components/edu/school/frame";

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("school.nav.content")} – ${t("school.title")}`, robots: { index: false } };
}

const OTHER = [
  { key: "programovani", path: "programovani" },
  { key: "chemie", path: "chemie" },
  { key: "historie", path: "historie" },
  { key: "php", path: "php" },
] as const;

export default async function SchoolContentRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getSchoolViewer()]);
  gateTeacher(viewer, locale, schoolContentPath(locale));
  const t = aifbT(locale);
  const categories = getCatalog().categories.filter((c) => (CONTENT_CATEGORY_IDS as readonly string[]).includes(c.id));

  return (
    <SchoolFrame locale={locale} viewer={viewer} active="content">
      <header className="aifb-head">
        <h1>{t("school.nav.content")}</h1>
        <p className="aifb-lead">{t("school.content.lead")}</p>
      </header>

      {categories.map((category) => (
        <section key={category.id} className="aifb-section" aria-labelledby={`school-content-${category.id}`}>
          <div className="school-row">
            <h2 className="eh-h2" id={`school-content-${category.id}`}><span className="eh-bullet" aria-hidden="true" />{category.title}</h2>
            <span className="school-actions">
              <Link className="btn btn-ghost aifb-btn-sm" href={categoryPath(locale, category.id)}>{t("school.content.open")}</Link>
              <Link className="btn btn-primary aifb-btn-sm" href={guidePath(locale, category.id)}>{t("school.content.guide")}</Link>
            </span>
          </div>
          <p className="aifb-muted">{category.subtitle} · {category.grades}</p>
          <div className="aifb-table-wrap">
            <table className="aifb-table">
              <thead>
                <tr>
                  <th scope="col">{t("school.content.level")}</th>
                  <th scope="col">{t("school.content.hours")}</th>
                  <th scope="col">{t("school.content.lessons")}</th>
                  <th scope="col"><span className="sr-only">{t("school.group.actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {category.levels.map((level) => {
                  const href = levelPath(locale, category.id, levelSlug(category.id, level.id));
                  return (
                    <tr key={level.id}>
                      <th scope="row"><Link className="aifb-textlink" href={href}>{level.code}: {level.title}</Link>{level.grades ? <><br /><span className="aifb-muted">{level.grades}</span></> : null}</th>
                      <td>{level.hours}</td>
                      <td>{level.lessonCount}</td>
                      <td><Link className="aifb-textlink" href={`${href}/tisk`}>{t("school.content.print")}</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="aifb-section" aria-labelledby="school-content-other">
        <h2 className="eh-h2" id="school-content-other"><span className="eh-bullet" aria-hidden="true" />{t("school.content.other")}</h2>
        <p className="aifb-muted">{t("school.content.otherLead")}</p>
        <ul className="aifb-link-list">
          <li><Link href={coursePath(locale)}>{t("school.content.course")}</Link></li>
          {OTHER.map((item) => (
            <li key={item.key}><Link href={`/${locale}/edu/${item.path}`}>{t(`school.content.subject.${item.key}`)}</Link></li>
          ))}
        </ul>
      </section>
    </SchoolFrame>
  );
}
