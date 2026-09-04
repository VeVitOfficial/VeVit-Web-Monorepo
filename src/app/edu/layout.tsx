// Server layout pro /edu/* React routy – načítá legacy design systém (fonty,
// Tailwind build, edu styles, sdílené session/app-switcher styly, KaTeX).
// Pořadí odpovídá edu/index.html <head>. EduRoot (client shell) se renderuje
// v každé page.tsx, protože potřebuje locale z hlavičky x-vv-locale.

import type { ReactNode } from "react";

// Fonty (Vercel Geist) + fallback.
import "../../../public/assets/fonts/vevit-fonts.css";
// Tailwind Play CDN build + design tokeny (reprodukce globals.css).
import "../../../public/assets/css/vevit-tailwind.css";
// KaTeX pro matematické vzorce.
import "../../../public/assets/vendor/katex/katex.min.css";
// Edu vlastní styly (jediný zdroj pravdy – edu/css/styles.css).
import "../../../edu/css/styles.css";
// Sdílené styly session pill a app switcheru.
import "../../../public/assets/shared/session.css";
import "../../../public/assets/shared/app-switcher.css";

export default function EduLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}