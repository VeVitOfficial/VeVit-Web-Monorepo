// /edu/ai-gramotnost/aifb/[category]/pro-ucitele → průvodce pro učitele (kapitoly guide[]).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { getDownloads, requireCategory } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { GuideView } from "@/components/edu/aifb/guide-view";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const [t, content] = [aifbT(await readEduLocale()), await requireCategory(category)];
  return { title: `${t("aifb.guide.title")} – ${content.category.title}` };
}

export default async function AifbGuideRoute({ params }: Props) {
  await connection();
  const { category } = await params;
  const [locale, content] = await Promise.all([readEduLocale(), requireCategory(category)]);
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <GuideView locale={locale} content={content} downloads={getDownloads(content.category.id)} />
    </AifbFrame>
  );
}
