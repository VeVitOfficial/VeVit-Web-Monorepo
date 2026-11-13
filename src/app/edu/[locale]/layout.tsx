// /edu/<locale>/*: locale je segment cesty (src/proxy.ts přepisuje /<lang>/edu/... → /edu/<lang>/...).
// Stránky bez session se tak předgenerují staticky pro každý jazyk.
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { EDU_SUPPORTED_LOCALES } from "@/lib/edu/i18n-data";
import { eduLocaleParams } from "@/lib/edu/locale";

export function generateStaticParams() {
  return eduLocaleParams();
}

export default async function EduLocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  if (!(EDU_SUPPORTED_LOCALES as readonly string[]).includes((await params).locale)) notFound();
  return <>{children}</>;
}
