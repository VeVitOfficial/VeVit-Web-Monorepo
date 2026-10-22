// /edu/ai-gramotnost/aifb/[category] → přehled kategorie (výběr levelu).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { requireCategory } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { CategoryView } from "@/components/edu/aifb/category-view";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const [t, content] = [aifbT(await readEduLocale()), await requireCategory(category)];
  return { title: `${content.category.title} – ${t("aifb.crumbs.hub")}`, description: content.category.subtitle };
}

export default async function AifbCategoryRoute({ params }: Props) {
  await connection();
  const { category } = await params;
  const [locale, content] = await Promise.all([readEduLocale(), requireCategory(category)]);
  return (
    <AifbFrame locale={locale} theme={content.category.theme}>
      <CategoryView locale={locale} content={content} />
    </AifbFrame>
  );
}
