// Stránka funkce učitele, která se teprve staví (tvorba vlastního obsahu, komunita, AI ze sešitu):
// co funkce bude dělat a odkaz na to, co už funguje. Žádné tlačítko, které by nic nedělalo.

import Link from "next/link";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import { schoolGroupsPath } from "@/lib/edu/school/school";

export function PlannedPage({ t, locale, feature }: { t: AifbT; locale: string; feature: "create" | "community" | "workbook" }) {
  return (
    <>
      <header className="aifb-head">
        <p className="aifb-eyebrow">{t("aifb.comingSoon")}</p>
        <h1>{t(`school.nav.${feature}`)}</h1>
        <p className="aifb-lead">{t(`school.planned.${feature}.lead`)}</p>
      </header>
      <section className="aifb-section">
        <ul className="aifb-link-list">
          {[1, 2, 3].map((n) => <li key={n}>{t(`school.planned.${feature}.p${n}`)}</li>)}
        </ul>
      </section>
      <p className="aifb-callout" role="note">
        {t("school.planned.now")} <Link className="aifb-textlink" href={schoolGroupsPath(locale)}>{t("school.nav.groups")}</Link>
      </p>
    </>
  );
}
