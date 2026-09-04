// /edu/lekce/vytvorit → create page (static segment, musí předčit [id]).
// Legacy router.js: "Vytvořit lekci".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduCreatePage } from "@/components/edu/pages/create-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Vytvořit lekci – VeVit Edu" };
}

export default async function EduCreatePageRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduCreatePage locale={locale} />
    </EduRoot>
  );
}