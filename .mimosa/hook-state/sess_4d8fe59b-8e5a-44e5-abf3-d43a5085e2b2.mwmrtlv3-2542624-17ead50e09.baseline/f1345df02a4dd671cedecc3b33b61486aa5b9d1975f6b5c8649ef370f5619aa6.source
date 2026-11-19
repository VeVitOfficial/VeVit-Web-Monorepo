import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

// EveryTool.cz — písma z redesignu (index.html / legal.html):
// Bricolage Grotesque pro nadpisy, Plus Jakarta Sans pro text.
// Proměnné --font-et-display/--font-et-text platí jen uvnitř .tools-app
// (className níže na wrapperu v tools layoutu), takže nijak neovlivňují
// ostatní aplikace monorepa ani obsah jednotlivých nástrojů.
// Pozn.: next/font vyžaduje volání loaderu přiřazené do const v module scope.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-et-display",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-et-text",
  display: "swap",
});

export const etFontsClass = `${bricolage.variable} ${jakarta.variable}`;
