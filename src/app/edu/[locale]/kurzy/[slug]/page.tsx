// /edu/kurzy/[slug] → course page. Legacy router.js: "Kurz".
import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CourseIndexMeta } from "@/lib/edu/config";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduCoursePage } from "@/components/edu/pages/course-page";

interface RouteProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Obsah se načítá na klientu, stránka (shell) je statická. Seznam bere z public/edu/data/courses/index.json
// při buildu; neznámý kurz je 404 a nezakládá nové položky v cache.
export const dynamicParams = false;

export async function generateStaticParams() {
  const index = JSON.parse(await readFile(path.join(process.cwd(), "public/edu/data/courses/index.json"), "utf8")) as CourseIndexMeta[];
  return index.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Kurz – VeVit Edu` , description: `Kurz ${decodeURIComponent(slug)}` };
}

export default async function EduCoursePageRoute({ params }: RouteProps) {
  const locale = await readEduLocale(params);
  const { slug } = await params;
  return (
    <EduRoot locale={locale}>
      <EduCoursePage locale={locale} slug={decodeURIComponent(slug)} />
    </EduRoot>
  );
}