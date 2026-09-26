// /edu/skoly: "VeVit Edu pro školy" coming-soon page. Not linked in primary
// nav (pre-launch); reachable via direct URL and a low-key link on the home
// page. Server component sets metadata + reads locale, client component
// (EduSkolyPage) renders the actual page.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSkolyPage } from "@/components/edu/pages/skoly-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "VeVit Edu pro školy" };
}

export default async function EduSkolyPageRoute() {
  await connection();
  const locale = await readEduLocale();
  return (
    <EduRoot locale={locale}>
      <EduSkolyPage locale={locale} />
    </EduRoot>
  );
}
