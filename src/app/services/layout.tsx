import type { ReactNode } from "react";
import { servicesLocale } from "@/lib/services-locale";
import { ServicesHeader } from "@/components/services/header";

import "../../../public/assets/fonts/vevit-fonts.css";
import "../../../public/assets/shared/session.css";
import "../../../public/assets/shared/app-switcher.css";
import "./services.css";

export default async function ServicesLayout({ children }: { children: ReactNode }) {
  const locale = await servicesLocale();
  return (
    <div className="svc">
      <ServicesHeader locale={locale} />
      <main className="svc-main">
        <div className="svc-container">{children}</div>
      </main>
      <footer className="svc-footer">
        <div className="svc-container svc-spread">
          <span>VeVit Services · beta. VeVit zakázky jen propojuje a za jejich provedení neručí.</span>
          <a href={`/${locale}/home/support`}>Podpora</a>
        </div>
      </footer>
    </div>
  );
}
