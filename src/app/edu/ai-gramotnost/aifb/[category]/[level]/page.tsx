// /edu/ai-gramotnost/aifb/[category]/[level] → seznam lekcí levelu.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { findLevel, getTheory, requireCategory } from "@/lib/edu/aifb/content";
import { gateCategory } from "@/lib/edu/aifb/gate";
import { prepareAifb } from "@/lib/edu/aifb/viewer";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { LevelView } from "@/components/edu/aifb/level-view";

type Props = { params: Promise<{ category: string; level: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, level: levelSlug } = await params;
  const [t, content] = [aifbT(await readEduLocale()), await requireCategory(category)];
  const level = findLevel(content, levelSlug);
  if (!level) notFound();
  return { title: `${level.code}: ${level.title} – ${t("aifb.crumbs.hub")}` };
}

export default async function AifbLevelRoute({ params }: Props) {
  await connection();
  const { category, level: levelSlug } = await params;
  const [locale, viewer] = await Promise.all([readEduLocale(), prepareAifb()]);
  gateCategory(viewer, locale, category);
  const content = await requireCategory(category);
  const level = findLevel(content, levelSlug);
  if (!level) notFound();
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <LevelView locale={locale} content={content} level={level} theory={getTheory(level.id)} viewer={viewer} />
    </AifbFrame>
  );
}
