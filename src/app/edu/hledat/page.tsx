// /edu/hledat?q=... → search page. Legacy router.js: "Hledat".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSearchPage } from "@/components/edu/pages/search-page";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  return { title: "Hledat – VeVit Edu", description: q ? `Vyhledávání: ${q}` : undefined };
}

export default async function EduSearchPageRoute({ searchParams }: PageProps) {
  await connection();
  const locale = await readEduLocale();
  const sp = await searchParams;
  const query = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  return (
    <EduRoot locale={locale}>
      <EduSearchPage locale={locale} query={query} />
    </EduRoot>
  );
}