// /edu/programovani → programovani page. Legacy router.js: "Programování".
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduProgramovaniPage } from "@/components/edu/pages/programovani-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Programování – VeVit Edu" };
}

export default async function EduProgramovaniPageRoute({ params }: LocaleParams) {
  const locale = await readEduLocale(params);
  return (
    <EduRoot locale={locale}>
      <EduProgramovaniPage locale={locale} />
    </EduRoot>
  );
}