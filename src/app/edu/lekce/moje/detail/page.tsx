// /edu/lekce/moje/detail → my-lesson page (static segment, musí předčit [id]).
// Legacy router.js: "Moje lekce". Legacy my-lesson.js čte query.slug — proto
// předáváme hodnotu searchParamu `slug` jako `query` (kontrakt stage 2).
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduMyLessonPage } from "@/components/edu/pages/my-lesson-page";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function readSlug(sp: { [key: string]: string | string[] | undefined }): string {
  const slug = Array.isArray(sp.slug) ? sp.slug[0] : sp.slug;
  return (slug ?? "").trim();
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const slug = readSlug(await searchParams);
  return { title: "Moje lekce – VeVit Edu", description: slug ? `Lekce: ${slug}` : undefined };
}

export default async function EduMyLessonPageRoute({ searchParams }: PageProps) {
  await connection();
  const locale = await readEduLocale();
  const slug = readSlug(await searchParams);
  return (
    <EduRoot locale={locale}>
      <EduMyLessonPage locale={locale} query={slug} />
    </EduRoot>
  );
}