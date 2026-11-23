"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";

/**
 * Port of the `data-vevit-app-switcher` widget from
 * public/assets/shared/app-switcher.js (labels + app list copied 1:1,
 * markup mirrors renderSwitcher so public/assets/shared/app-switcher.css applies).
 */

const STRINGS: Record<string, { menuTitle: string; more: string; current: string; home: string; apps: Record<string, string> }> = {
  cs: { menuTitle: "Aplikace VeVit", more: "Další projekty", current: "Právě tady", home: "Domů", apps: { Home: "Hlavní stránka", Account: "Účet a přihlášení", Tools: "Online nástroje", Edu: "Výuka a kurzy", Store: "Obchod VeVit", Services: "Poptávky a služby", Art: "Platforma pro umělce", Studios: "Software na míru" } },
  en: { menuTitle: "VeVit apps", more: "More from VeVit", current: "You are here", home: "Home", apps: { Home: "Main page", Account: "Account & sign-in", Tools: "Online tools", Edu: "Lessons & courses", Store: "VeVit store", Services: "Requests & services", Art: "Platform for artists", Studios: "Custom software" } },
  de: { menuTitle: "VeVit-Apps", more: "Weitere Projekte", current: "Du bist hier", home: "Startseite", apps: { Home: "Hauptseite", Account: "Konto & Anmeldung", Tools: "Online-Werkzeuge", Edu: "Lernen & Kurse", Store: "VeVit-Shop", Services: "Anfragen & Dienste", Art: "Plattform für Künstler", Studios: "Maßgeschneiderte Software" } },
  es: { menuTitle: "Apps de VeVit", more: "Más proyectos", current: "Estás aquí", home: "Inicio", apps: { Home: "Página principal", Account: "Cuenta e inicio de sesión", Tools: "Herramientas online", Edu: "Lecciones y cursos", Store: "Tienda VeVit", Services: "Solicitudes y servicios", Art: "Plataforma para artistas", Studios: "Software a medida" } },
  uk: { menuTitle: "Застосунки VeVit", more: "Інші проєкти", current: "Ви тут", home: "Головна", apps: { Home: "Головна сторінка", Account: "Облік і вхід", Tools: "Онлайн-інструменти", Edu: "Навчання й курси", Store: "Магазин VeVit", Services: "Запити та послуги", Art: "Платформа для митців", Studios: "Програмне рішення на замовлення" } },
  fr: { menuTitle: "Applications VeVit", more: "Autres projets", current: "Vous êtes ici", home: "Accueil", apps: { Home: "Page principale", Account: "Compte et connexion", Tools: "Outils en ligne", Edu: "Leçons et cours", Store: "Boutique VeVit", Services: "Demandes et services", Art: "Plateforme pour artistes", Studios: "Logiciel sur mesure" } },
  sk: { menuTitle: "Aplikácie VeVit", more: "Ďalšie projekty", current: "Práve tu", home: "Domov", apps: { Home: "Hlavná stránka", Account: "Účet a prihlásenie", Tools: "Online nástroje", Edu: "Výuka a kurzy", Store: "Obchod VeVit", Services: "Dopyty a služby", Art: "Platforma pre umelcov", Studios: "Software na mieru" } },
};

// Ikony (lucide) — stejné jako v public/assets/shared/app-switcher.js.
const ICONS: Record<string, React.ReactNode> = {
  Home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  Account: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  Tools: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  Edu: <><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></>,
  Services: <><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2" /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" /><path d="M3 4h8" /></>,
  Store: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  Art: <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></>,
  Studios: <><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></>,
  external: <><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>,
};

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {ICONS[name]}
    </svg>
  );
}

const APPS = [
  { id: "Home", label: "Home", href: "/home" },
  { id: "Account", label: "Account", href: "/account" },
  { id: "Tools", label: "Tools", href: "/tools" },
  { id: "Edu", label: "Edu", href: "/edu" },
  { id: "Store", label: "Store", href: "/store" },
  { id: "Services", label: "Services", href: "/services" },
] as const;

const PROJECTS = [
  { id: "Art", label: "VeVit Art", href: "https://vevit.art" },
  { id: "Studios", label: "Software Studios", href: "https://www.vevit.space" },
] as const;

export function AppSwitcher({ locale, currentApp }: { locale: string; currentApp: string }) {
  const [open, setOpen] = useState(false);
  const [menuTop, setMenuTop] = useState<number | null>(null);
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
  const renderLink = (app: { id: string; label: string; href: string }, external: boolean) => {
    const current = app.id === currentApp;
    return (
      <a
        key={app.id}
        className="vv-app-switcher__link"
        href={app.href}
        aria-current={current ? "page" : undefined}
        rel={external ? "noopener" : undefined}
        onClick={() => setOpen(false)}
      >
        <span className={`vv-app-switcher__app-icon vv-app-switcher__app-icon--${app.id.toLowerCase()}`} aria-hidden="true">
          <Icon name={app.id} />
        </span>
        <span className="vv-app-switcher__copy">
          <strong>{app.id === "Home" ? strings.home : app.label}</strong>
          <small>{strings.apps[app.id] ?? app.label}</small>
        </span>
        {current ? <span className="vv-app-switcher__badge">{strings.current}</span> : null}
        {external ? <Icon name="external" className="vv-app-switcher__ext" /> : null}
      </a>
    );
  };
  return (
    <div className="vv-app-switcher" ref={hostRef}>
      <button
        type="button"
        className="vv-app-switcher__trigger"
        aria-label={strings.menuTitle}
        aria-expanded={open}
        onClick={(event) => {
          // Na telefonu je menu fixed přes šířku obrazovky těsně pod tlačítkem.
          setMenuTop(Math.round(event.currentTarget.getBoundingClientRect().bottom + 8));
          setOpen((current) => !current);
        }}
      >
        <span className="vv-app-switcher__grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
        </span>
      </button>
      {open && (
        <nav
          className="vv-app-switcher__menu"
          aria-label={strings.menuTitle}
          style={menuTop === null ? undefined : ({ "--vv-menu-top": `${menuTop}px` } as React.CSSProperties)}
        >
          <p className="vv-app-switcher__title">{strings.menuTitle}</p>
          <div className="vv-app-switcher__list">
            {APPS.map((app) => renderLink(app, false))}
          </div>
          <p className="vv-app-switcher__subtitle">{strings.more}</p>
          <div className="vv-app-switcher__list">
            {PROJECTS.map((app) => renderLink(app, true))}
          </div>
        </nav>
      )}
    </div>
  );
}