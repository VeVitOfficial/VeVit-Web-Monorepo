// /edu/ai-gramotnost/aifb/[category]/[level]/tisk → tisková verze celého levelu (A4).
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { findLevel, getTheory, requireCategory } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { LevelPrintView } from "@/components/edu/aifb/level-print-view";

type Props = { params: Promise<{ category: string; level: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, level: levelSlug } = await params;
  const [t, content] = [aifbT(await readEduLocale()), await requireCategory(category)];
  const level = findLevel(content, levelSlug);
  if (!level) notFound();
  return { title: `${t("aifb.print.levelPage")}: ${level.code} ${level.title}`, robots: { index: false } };
}

export default async function AifbLevelPrintRoute({ params }: Props) {
  await connection();
  const { category, level: levelSlug } = await params;
  const [locale, content] = await Promise.all([readEduLocale(), requireCategory(category)]);
  const level = findLevel(content, levelSlug);
  if (!level) notFound();
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <LevelPrintView locale={locale} content={content} level={level} theory={getTheory(level.id)} />
    </AifbFrame>
  );
}
