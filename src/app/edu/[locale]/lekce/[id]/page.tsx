// /edu/lekce/[id] → lesson page. Legacy router.js: "Lekce".
// Static segmenty vytvorit a moje/detail mají přednost (Next App Router
// upřednostňuje statické routy před dynamickými).
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CourseIndexMeta } from "@/lib/edu/config";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduLessonPage } from "@/components/edu/pages/lesson-page";

interface RouteProps {
  params: Promise<{ locale: string; id: string }>;
}

// Obsah se načítá na klientu, stránka (shell) je statická. Seznam bere z public/edu/data/courses/index.json
// při buildu; neznámý lekce je 404 a nezakládá nové položky v cache.
export const dynamicParams = false;

export async function generateStaticParams() {
  const index = JSON.parse(await readFile(path.join(process.cwd(), "public/edu/data/courses/index.json"), "utf8")) as CourseIndexMeta[];
  return index.flatMap((course) => (course.lessons ?? []).map((lesson) => ({ id: lesson.slug })));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  return { title: "Lekce – VeVit Edu", description: `Lekce ${decodeURIComponent(id)}` };
}

export default async function EduLessonPageRoute({ params }: RouteProps) {
  const locale = await readEduLocale(params);
  const { id } = await params;
  return (
    <EduRoot locale={locale}>
      <EduLessonPage locale={locale} id={decodeURIComponent(id)} />
    </EduRoot>
  );
}