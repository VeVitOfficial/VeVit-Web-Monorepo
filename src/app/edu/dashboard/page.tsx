// /edu/dashboard → home page. Legacy router.js: "Domů".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduHomePage } from "@/components/edu/pages/home-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Domů – VeVit Edu" };
}

export default async function EduDashboardPageRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduHomePage locale={locale} />
    </EduRoot>
  );
}