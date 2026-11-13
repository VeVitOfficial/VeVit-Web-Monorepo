// /edu/lekce/vytvorit → create page (static segment, musí předčit [id]).
// Legacy router.js: "Vytvořit lekci".
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduCreatePage } from "@/components/edu/pages/create-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Vytvořit lekci – VeVit Edu" };
}

export default async function EduCreatePageRoute({ params }: LocaleParams) {
  const locale = await readEduLocale(params);
  return (
    <EduRoot locale={locale}>
      <EduCreatePage locale={locale} />
    </EduRoot>
  );
}