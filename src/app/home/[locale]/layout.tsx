import { notFound } from "next/navigation";

// /home/<locale>/*: locale je segment cesty (src/proxy.ts), stránky se generují staticky per jazyk.
const LOCALES = ["cs", "en", "de", "es", "uk", "fr", "sk"] as const;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function HomeLocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  if (!(LOCALES as readonly string[]).includes((await params).locale)) notFound();
  return children;
}
