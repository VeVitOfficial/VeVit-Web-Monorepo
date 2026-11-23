// 404 uvnitř sekce AI gramotnosti: neznámá kategorie, level nebo lekce.
import Link from "next/link";
import { headers } from "next/headers";
import { toEduLocale } from "@/lib/edu/locale";
import { aifbT } from "@/lib/edu/aifb/i18n";
import { hubPath } from "@/lib/edu/aifb/routes";
import { AifbFrame } from "@/components/edu/aifb/frame";

export default async function AifbNotFound() {
  // not-found nedostává params; proxy posílá locale i v hlavičce x-vv-locale.
  const locale = toEduLocale((await headers()).get("x-vv-locale") ?? undefined);
  const t = aifbT(locale);
  return (
    <AifbFrame locale={locale}>
      <h1>{t("aifb.notFound.title")}</h1>
      <p className="aifb-lead">{t("aifb.notFound.body")}</p>
      <p><Link href={hubPath(locale)} className="aifb-textlink">{t("aifb.notFound.link")}</Link></p>
    </AifbFrame>
  );
}
