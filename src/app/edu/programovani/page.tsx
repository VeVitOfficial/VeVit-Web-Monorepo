// /edu/programovani → programovani page. Legacy router.js: "Programování".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduProgramovaniPage } from "@/components/edu/pages/programovani-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Programování – VeVit Edu" };
}

export default async function EduProgramovaniPageRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduProgramovaniPage locale={locale} />
    </EduRoot>
  );
}