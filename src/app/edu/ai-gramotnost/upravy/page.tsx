// /edu/ai-gramotnost/upravy → úpravy obsahu AIFB (jen admin). Bez parametrů přehled všech
// upravitelných částí, s ?doc=…&path=… editor jedné části. Úpravy jsou v databázi (migrace 025),
// soubory v repozitáři se nemění.
import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { editableDoc, getCatalog } from "@/lib/edu/aifb/content";
import { EDIT_DOCS, isEditDoc, listUnits, parsePath, unitOmit, unitValue, type EditDoc } from "@/lib/edu/aifb/edits";
import { editHistory, editsFor, recentEdits } from "@/lib/edu/aifb/edits-store";
import { gateLevels } from "@/lib/edu/aifb/gate";
import {
  categoryPath, courseLessonPath, coursePath, editorPath, guidePath, hubPath, lessonPath, levelPath, levelSlug, lessonSlug, modulePath,
} from "@/lib/edu/aifb/routes";
import { isCategoryId } from "@/lib/edu/aifb/types";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { ContentEditor, type HistoryItem } from "@/components/edu/aifb/content-editor";
import { Crumbs } from "@/components/edu/aifb/crumbs";

type Props = { searchParams: Promise<{ doc?: string; path?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = aifbT(await readEduLocale());
  return { title: `${t("aifb.edit.title")} – ${t("aifb.crumbs.hub")}`, robots: { index: false } };
}

function docTitle(doc: EditDoc, t: ReturnType<typeof aifbT>): string {
  return isCategoryId(doc) ? (getCatalog().categories.find((category) => category.id === doc)?.title ?? doc) : t(`aifb.edit.doc.${doc}`);
}

/** Stránka webu, na které se upravovaná část zobrazuje (pokud je jedna). */
function pageOf(locale: string, doc: EditDoc, path: string): string | null {
  const ids = [...path.matchAll(/\[([a-z0-9-]+)\]/g)].map((match) => match[1]);
  if (isCategoryId(doc)) {
    if (path === "category") return categoryPath(locale, doc);
    if (path.startsWith("guide/")) return guidePath(locale, doc, ids[0]);
    if (ids.length === 1) return levelPath(locale, doc, levelSlug(doc, ids[0]));
    if (ids.length === 2) return lessonPath(locale, doc, levelSlug(doc, ids[0]), lessonSlug(ids[0], ids[1]));
  }
  if (doc === "kurz") {
    if (ids.length === 0) return coursePath(locale);
    const mod = ids[0].replace(/^kurz-/, "");
    return ids.length === 1 ? modulePath(locale, mod) : courseLessonPath(locale, mod, ids[1].slice(ids[0].length + 1));
  }
  if (doc === "pilots") {
    const lessonId = path.replace(/^lessons\//, "");
    const match = /^(zs1|zs2|ss)-(.+)-(teorie|cv[1-5])$/.exec(lessonId);
    if (match) return lessonPath(locale, match[1], match[2], match[3]);
  }
  return null;
}

export default async function EditorRoute({ searchParams }: Props) {
  await connection();
  const [{ doc, path }, locale, viewer] = await Promise.all([searchParams, readEduLocale(), prepareAifb()]);
  gateLevels(viewer, locale);
  if (viewer.role !== "admin") redirect(hubPath(locale));
  const t = aifbT(locale);
  const crumbs = [
    { label: t("aifb.crumbs.edu"), href: `/${locale}/edu` },
    { label: t("aifb.crumbs.hub"), href: hubPath(locale) },
    { label: t("aifb.edit.title"), href: editorPath(locale) },
  ];

  if (doc !== undefined || path !== undefined) {
    if (!isEditDoc(doc) || !path || unitOmit(doc, path) === null || parsePath(path) === null) notFound();
    const { current } = await editableDoc(doc);
    const initial = unitValue(doc, current, path);
    if (!initial) notFound();
    const edited = editsFor(doc).some((edit) => edit.path === path);
    const history = (await editHistory(doc, path)) as HistoryItem[];
    const page = pageOf(locale, doc, path);
    const label = listUnits(doc, current).find((unit) => unit.path === path)?.label ?? path;
    return (
      <AifbFrame locale={locale}>
        <Crumbs label={t("aifb.crumbs.label")} items={[...crumbs, { label: `${docTitle(doc, t)}: ${label}` }]} />
        <header className="aifb-head">
          <p className="aifb-eyebrow">{docTitle(doc, t)}{edited ? ` · ${t("aifb.edit.edited")}` : ""}</p>
          <h1>{label}</h1>
          <p className="aifb-muted"><code>{path}</code></p>
          <p className="aifb-links">
            {page ? <Link href={page} className="aifb-textlink">{t("aifb.edit.view")}</Link> : null}
            <Link href={editorPath(locale)} className="aifb-textlink">{t("aifb.edit.back")}</Link>
          </p>
        </header>
        <ContentEditor
          key={`${doc}:${path}:${history[0]?.id ?? 0}`}
          locale={locale}
          doc={doc}
          path={path}
          initial={initial as never}
          edited={edited}
          history={history}
          csrfToken={viewer.csrfToken}
          canSave={viewer.userId !== null}
        />
      </AifbFrame>
    );
  }

  const recent = await recentEdits();
  const docs = await Promise.all(EDIT_DOCS.map(async (item) => ({ doc: item, units: listUnits(item, (await editableDoc(item)).current) })));
  return (
    <AifbFrame locale={locale}>
      <Crumbs label={t("aifb.crumbs.label")} items={crumbs} />
      <header className="aifb-head">
        <h1>{t("aifb.edit.title")}</h1>
        <p className="aifb-lead">{t("aifb.edit.lead")}</p>
      </header>

      <section className="aifb-section" aria-labelledby="aifb-edit-recent">
        <h2 className="eh-h2" id="aifb-edit-recent"><span className="eh-bullet" aria-hidden="true" />{t("aifb.edit.recent")}</h2>
        {recent.length === 0 ? <p className="aifb-muted">{t("aifb.edit.noRecent")}</p> : (
          <ul className="aifb-link-list">
            {recent.map((item, index) => (
              <li key={index}>
                <Link href={editorPath(locale, item.doc, item.path)}>{docTitle(item.doc, t)}: {item.path}</Link>
                {item.reverted ? <span className="aifb-muted"> · {t("aifb.edit.reverted")}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {docs.map(({ doc: item, units }) => {
        const edited = new Set(editsFor(item).map((edit) => edit.path));
        return (
          <section key={item} className="aifb-section">
            <details className="aifb-details">
              <summary><h2>{docTitle(item, t)}{edited.size > 0 ? ` · ${t("aifb.edit.edited")}: ${edited.size}` : ""}</h2></summary>
              <ul className="aifb-edit-units">
                {units.map((unit) => (
                  <li key={unit.path} data-depth={unit.depth}>
                    <Link href={editorPath(locale, item, unit.path)}>{unit.label || unit.path}</Link>
                    {edited.has(unit.path) ? <span className="aifb-badge">{t("aifb.edit.edited")}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        );
      })}
    </AifbFrame>
  );
}
