// /edu/kurzy/[slug] → course page. Legacy router.js: "Kurz".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduCoursePage } from "@/components/edu/pages/course-page";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Kurz – VeVit Edu` , description: `Kurz ${decodeURIComponent(slug)}` };
}

export default async function EduCoursePageRoute({ params }: RouteProps) {
  await connection();
  const locale = await readEduLocale();
  const { slug } = await params;
  return (
    <EduRoot locale={locale}>
      <EduCoursePage locale={locale} slug={decodeURIComponent(slug)} />
    </EduRoot>
  );
}