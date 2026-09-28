"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SvcIcon } from "./icons";

// Sdílené moduly (jazyk, přepínač aplikací, účet) — stejné jako v Tools a Edu.
const MODULE_SCRIPTS = [
  "/assets/shared/app-switcher.js?v=20260928b",
  "/assets/shared/localization.js?v=20260928b",
  "/assets/shared/session.js?v=20260928a",
] as const;

const LINKS = [
  { href: "/poptavky", label: "Poptávky", match: (path: string) => path.startsWith("/poptavky") || (path.startsWith("/poptavka/") && !path.startsWith("/poptavka/nova")) },
  { href: "/poskytovatele", label: "Poskytovatelé", match: (path: string) => path.startsWith("/poskytovatel") },
  { href: "/moje", label: "Moje zakázky", match: (path: string) => path.startsWith("/moje") },
  { href: "/profil", label: "Profil poskytovatele", match: (path: string) => path.startsWith("/profil") },
];

export function ServicesHeader({ locale, unread = 0 }: { locale: string; unread?: number }) {
  const pathname = usePathname() ?? "";
  const rel = pathname.replace(/^\/[a-z]{2}(?=\/)/, "").replace(/^\/services/, "").replace(/\/$/, "");
  const base = `/${locale}/services`;

  useEffect(() => {
    const injected: HTMLScriptElement[] = [];
    for (const src of MODULE_SCRIPTS) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const script = document.createElement("script");
      script.type = "module";
      script.src = src;
      document.body.appendChild(script);
      injected.push(script);
    }
    return () => injected.forEach((script) => script.remove());
  }, []);

  const nav = LINKS.map((link) => (
    <a key={link.label} href={`${base}${link.href}`} aria-current={link.match(rel) ? "page" : undefined}>
      {link.label}
      {link.href === "/moje" && unread > 0 ? <span className="svc-navbadge" aria-label={`${unread} nepřečtených zpráv`}>{unread > 99 ? "99+" : unread}</span> : null}
    </a>
  ));

  return (
    <header className="svc-header">
      <div className="svc-container svc-header__bar">
        <span className="vv-app-brand" aria-label="VeVit Services">
          <a href={`/${locale}/home`}>VeVit</a>
          <a href={base}>Services</a>
        </span>
        <nav className="svc-nav" aria-label="Navigace VeVit Services">{nav}</nav>
        <a className="svc-btn svc-btn--primary svc-btn--sm svc-header__cta" href={`${base}/poptavka/nova`}>
          <SvcIcon name="plus" size={15} /> Zadat poptávku
        </a>
        <div className="svc-actions vv-app-actions">
          <span data-vevit-language />
          <span data-vevit-app-switcher data-vevit-app="Services" />
          <span data-vevit-session>
            <a className="vv-session vv-session--anonymous" href={`/${locale}/account/login`}>Přihlásit se</a>
          </span>
        </div>
      </div>
      <nav className="svc-subnav" aria-label="Navigace VeVit Services">{nav}</nav>
    </header>
  );
}
