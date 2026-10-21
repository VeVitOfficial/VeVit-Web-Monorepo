// /edu/hledat?q=... → search page. Legacy router.js: "Hledat".
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSearchPage } from "@/components/edu/pages/search-page";
import { parseWikiLang } from "@/lib/edu/wikipedia";

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
  const wikiLang = parseWikiLang(Array.isArray(sp.wl) ? sp.wl[0] : sp.wl);
  return (
    <EduRoot locale={locale}>
      <EduSearchPage key={`${wikiLang}:${query}`} locale={locale} query={query} wikiLang={wikiLang} />
    </EduRoot>
  );
}