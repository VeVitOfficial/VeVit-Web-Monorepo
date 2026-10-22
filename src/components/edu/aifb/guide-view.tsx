// Průvodce pro učitele (kapitoly guide[] s čísly kapitol a oddílů). Podrobné rozložení
// (obsah, soubory ke stažení) doplňuje fáze F7.

import { aifbT } from "@/lib/edu/aifb/i18n";
import { categoryPath, hubPath } from "@/lib/edu/aifb/routes";
import type { AifbContent } from "@/lib/edu/aifb/types";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { Blocks } from "./blocks";
import { Crumbs } from "./crumbs";
import type { RichTextContext } from "./rich-text";

export function GuideView({ locale, content }: { locale: EduLocale; content: AifbContent }) {
  const t = aifbT(locale);
  const { category } = content;
  const ctx: RichTextContext = { locale, categoryId: category.id };
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
      <div className="aifb-prose">
        {content.guide.map((chapter) => (
          <section key={chapter.id} id={chapter.id} className="aifb-section" aria-labelledby={`${chapter.id}-title`}>
            <h2 className="aifb-h2" id={`${chapter.id}-title`}>{chapter.number}. {chapter.title}</h2>
            <Blocks blocks={chapter.blocks} ctx={ctx} headingLevel={3} />
            {(chapter.sections ?? []).map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                <h3 className="aifb-h3" id={`${section.id}-title`}>{section.number} {section.title}</h3>
                <Blocks blocks={section.blocks} ctx={ctx} headingLevel={4} />
              </section>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
