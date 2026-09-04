// /edu/lekce/[id] → lesson page. Legacy router.js: "Lekce".
// Static segmenty vytvorit a moje/detail mají přednost (Next App Router
// upřednostňuje statické routy před dynamickými).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduLessonPage } from "@/components/edu/pages/lesson-page";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  return { title: "Lekce – VeVit Edu", description: `Lekce ${decodeURIComponent(id)}` };
}

export default async function EduLessonPageRoute({ params }: RouteProps) {
  await connection();
  const locale = await readEduLocale();
  const { id } = await params;
  return (
    <EduRoot locale={locale}>
      <EduLessonPage locale={locale} id={decodeURIComponent(id)} />
    </EduRoot>
  );
}