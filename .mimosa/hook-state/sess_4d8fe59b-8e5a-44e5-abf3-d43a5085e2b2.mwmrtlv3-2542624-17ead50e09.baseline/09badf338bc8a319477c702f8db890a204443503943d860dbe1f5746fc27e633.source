import type { ReactNode } from "react";
import { servicesLocale } from "@/lib/services-locale";
import { unreadCounts, viewer } from "@/lib/services";
import { ServicesHeader } from "@/components/services/header";

import "../../../public/assets/fonts/vevit-fonts.css";
import "../../../public/assets/shared/session.css";
import "../../../public/assets/shared/app-switcher.css";
import "./services.css";

export default async function ServicesLayout({ children }: { children: ReactNode }) {
  const locale = await servicesLocale();
  const session = await viewer();
  const unread = session ? (await unreadCounts(session.user.id).catch(() => null))?.total ?? 0 : 0;
  return (
    <div className="svc">
      <ServicesHeader locale={locale} unread={unread} />
      <main className="svc-main">
        <div className="svc-container">{children}</div>
      </main>
      <footer className="svc-footer">
        <div className="svc-container svc-spread">
          <span>VeVit Services · beta. VeVit zakázky jen propojuje a za jejich provedení neručí.</span>
          <nav className="svc-row" aria-label="Odkazy v patičce">
            <a href={`/${locale}/services/poptavky`}>Poptávky</a>
            <a href={`/${locale}/services/poskytovatele`}>Poskytovatelé</a>
            <a href={`/${locale}/account/services`}>Services v účtu</a>
            <a href={`/${locale}/home/support`}>Podpora</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
