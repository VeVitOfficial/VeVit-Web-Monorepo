// Průvodce pro učitele: kapitoly guide[] s čísly kapitol a oddílů, obsah vlevo (kotvy g<N>, g<N>-<M>),
// soubory ke stažení a u dopisu rodičům tisk a zkopírování textu. Odkazy „oddíl N.M" v textu
// vedou na příslušnou kotvu (renderer RichText).

import { aifbT } from "@/lib/edu/aifb/i18n";
import type { DownloadFile } from "@/lib/edu/aifb/content";
import { PRINTABLE_SECTIONS, formatBytes } from "@/lib/edu/aifb/guide";
import { categoryPath, hubPath } from "@/lib/edu/aifb/routes";
import type { AifbContent } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Blocks } from "./blocks";
import { Crumbs } from "./crumbs";
import type { RichTextContext } from "./rich-text";
import { SectionActions } from "./section-actions";

export function GuideView({ locale, content, downloads }: { locale: EduLocale; content: AifbContent; downloads: DownloadFile[] }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
  const printable = new Set(PRINTABLE_SECTIONS[category.id] ?? []);
  return (
    <>
      <Crumbs
        label={t("aifb.crumbs.label")}
        items={[
          { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
          { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
          { label: category.title, href: categoryPath(locale, category.id) },
          { label: t("aifb.guide.title") },
        ]}
      />
      <header className="aifb-head">
        <h1>{t("aifb.guide.title")}</h1>
        <p className="aifb-lead">{category.title}</p>
      </header>
      <div className="aifb-guide">
        <nav className="aifb-toc aifb-noprint" aria-label={t("aifb.guide.toc")}>
          <p className="aifb-toc__title">{t("aifb.guide.contents")}</p>
          <ol>
            {content.guide.map((chapter) => (
              <li key={chapter.id}>
                <a href={`#${chapter.id}`}>{chapter.number}. {chapter.title}</a>
                {(chapter.sections ?? []).length > 0 ? (
                  <ol>
                    {(chapter.sections ?? []).map((section) => (
                      <li key={section.id}><a href={`#${section.id}`}>{section.number} {section.title}</a></li>
                    ))}
                  </ol>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="aifb-toc__title">{t("aifb.guide.downloads")}</p>
          {downloads.length > 0 ? (
            <ul>
              {downloads.map((item) => (
                <li key={item.path}>
                  <a href={item.path} download>
                    {t("aifb.guide.download.link", { title: t("aifb.guide.download.plan"), format: item.format, size: formatBytes(item.bytes) })}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="aifb-muted">{t("aifb.guide.noDownloads")}</p>
          )}
        </nav>
        <div className="aifb-prose aifb-guide__body">
          {content.guide.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="aifb-section aifb-guide-chapter" aria-labelledby={`${chapter.id}-title`}>
              <h2 className="aifb-h2" id={`${chapter.id}-title`}>{chapter.number}. {chapter.title}</h2>
              <Blocks blocks={chapter.blocks} ctx={ctx} headingLevel={3} />
              {(chapter.sections ?? []).map((section) => (
                <section key={section.id} id={section.id} className="aifb-guide-section" aria-labelledby={`${section.id}-title`}>
                  <h3 className="aifb-h3" id={`${section.id}-title`}>{section.number} {section.title}</h3>
                  {printable.has(section.id) ? <SectionActions sectionId={section.id} /> : null}
                  <Blocks blocks={section.blocks} ctx={ctx} headingLevel={4} />
                </section>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
