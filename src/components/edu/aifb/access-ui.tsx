// Prvky podle role návštěvníka: odkaz „Upravit“ pro admina, štítek zámku a stránka zamčené lekce
// pro studenta. Stav je vždy i textem, ne jen ikonou nebo barvou.

import Link from "next/link";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { AifbRole } from "@/lib/edu/aifb/access";
import type { EditDoc } from "@/lib/edu/aifb/edits";
import { editorPath, schoolsPath } from "@/lib/edu/aifb/routes";

export function EditLink({ role, locale, doc, path, t }: { role: AifbRole; locale: string; doc: EditDoc; path: string; t: AifbT }) {
  if (role !== "admin") return null;
  return (
    <Link href={editorPath(locale, doc, path)} className="aifb-edit-link aifb-noprint">
      {t("aifb.edit.link")}
    </Link>
  );
}

export function LockBadge({ unlocked, total, t }: { unlocked: number; total: number; t: AifbT }) {
  if (unlocked === 0) return <span className="aifb-badge aifb-badge--lock">{t("aifb.access.locked")}</span>;
  return <span className="aifb-badge">{t("aifb.access.unlocked", { n: unlocked, total })}</span>;
}

export function LockedNotice({ backHref, backLabel, t }: { backHref: string; backLabel: string; t: AifbT }) {
  return (
    <section className="aifb-locked" aria-labelledby="aifb-locked-title">
      <h1 id="aifb-locked-title">{t("aifb.access.lockedTitle")}</h1>
      <p>{t("aifb.access.lockedBody")}</p>
      <p><Link href={backHref} className="btn btn-primary">{backLabel}</Link></p>
    </section>
  );
}

export function NoClassNotice({ locale, t }: { locale: string; t: AifbT }) {
  return (
    <div className="aifb-callout" role="note">
      <p className="aifb-callout__title">{t("aifb.access.noClass.title")}</p>
      <p>{t("aifb.access.noClass.body")}</p>
      <p><a href={schoolsPath(locale)} className="aifb-textlink">{t("aifb.access.noClass.link")}</a></p>
    </div>
  );
}
