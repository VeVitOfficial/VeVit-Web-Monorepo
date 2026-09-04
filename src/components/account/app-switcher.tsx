"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Port of the `data-vevit-app-switcher` widget from
 * public/assets/shared/app-switcher.js (labels + app list copied 1:1,
 * markup mirrors renderSwitcher so shared/js/app-switcher.css applies).
 */

const STRINGS: Record<string, { menuTitle: string; home: string; apps: Record<string, string> }> = {
  cs: { menuTitle: "Aplikace VeVit", home: "Domů", apps: { Home: "Hlavní stránka", Account: "Účet a přihlášení", Tools: "Online nástroje", Edu: "Výuka a kurzy", Store: "Obchod VeVit", Art: "Platforma pro umělce", Studios: "Software na míru" } },
  en: { menuTitle: "VeVit apps", home: "Home", apps: { Home: "Main page", Account: "Account & sign-in", Tools: "Online tools", Edu: "Lessons & courses", Store: "VeVit store", Art: "Platform for artists", Studios: "Custom software" } },
  de: { menuTitle: "VeVit-Apps", home: "Startseite", apps: { Home: "Hauptseite", Account: "Konto & Anmeldung", Tools: "Online-Werkzeuge", Edu: "Lernen & Kurse", Store: "VeVit-Shop", Art: "Plattform für Künstler", Studios: "Maßgeschneiderte Software" } },
  es: { menuTitle: "Apps de VeVit", home: "Inicio", apps: { Home: "Página principal", Account: "Cuenta e inicio de sesión", Tools: "Herramientas online", Edu: "Lecciones y cursos", Store: "Tienda VeVit", Art: "Plataforma para artistas", Studios: "Software a medida" } },
  uk: { menuTitle: "Застосунки VeVit", home: "Головна", apps: { Home: "Головна сторінка", Account: "Облік і вхід", Tools: "Онлайн-інструменти", Edu: "Навчання й курси", Store: "Магазин VeVit", Art: "Платформа для митців", Studios: "Програмне рішення на замовлення" } },
  fr: { menuTitle: "Applications VeVit", home: "Accueil", apps: { Home: "Page principale", Account: "Compte et connexion", Tools: "Outils en ligne", Edu: "Leçons et cours", Store: "Boutique VeVit", Art: "Plateforme pour artistes", Studios: "Logiciel sur mesure" } },
  sk: { menuTitle: "Aplikácie VeVit", home: "Domov", apps: { Home: "Hlavná stránka", Account: "Účet a prihlásenie", Tools: "Online nástroje", Edu: "Výuka a kurzy", Store: "Obchod VeVit", Art: "Platforma pre umelcov", Studios: "Software na mieru" } },
};

const APPS = [
  { id: "Home", label: "Home", href: "/home", icon: "V" },
  { id: "Account", label: "Account", href: "/account", icon: "A" },
  { id: "Tools", label: "Tools", href: "/tools", icon: "T" },
  { id: "Edu", label: "Edu", href: "/edu", icon: "E" },
  { id: "Store", label: "Store", href: "/store", icon: "S" },
  { id: "Art", label: "VeVit Art", href: "https://vevit.art", icon: "V" },
  { id: "Studios", label: "Software Studios", href: "https://www.vevit.space", icon: "V" },
] as const;

export function AppSwitcher({ locale, currentApp }: { locale: string; currentApp: string }) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onOutside(event: PointerEvent) {
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  const strings = STRINGS[locale] ?? STRINGS.cs;
  return (
    <div className="vv-app-switcher" ref={hostRef}>
      <button
        type="button"
        className="vv-app-switcher__trigger"
        aria-label={strings.menuTitle}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="vv-app-switcher__grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </span>
      </button>
      {open && (
        <nav className="vv-app-switcher__menu" aria-label={strings.menuTitle}>
          <p className="vv-app-switcher__title">{strings.menuTitle}</p>
          <div className="vv-app-switcher__list">
            {APPS.map((app) => (
              <a
                key={app.id}
                className="vv-app-switcher__link"
                href={app.href}
                aria-current={app.id === currentApp ? "page" : undefined}
                rel={app.href.startsWith("https://") ? "noopener" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className={`vv-app-switcher__app-icon vv-app-switcher__app-icon--${app.id.toLowerCase()}`} aria-hidden="true">{app.icon}</span>
                <span>
                  <strong>{app.id === "Home" ? strings.home : app.label}</strong>
                  <small>{strings.apps[app.id] ?? app.label}</small>
                </span>
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}