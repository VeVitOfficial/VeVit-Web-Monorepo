// Port edu/js/lib/dom.js — pouze části, které dávají v Reactu smysl.
//
// React nahrazuje tyto legacy pomocníky:
//   $ / $$          → useRef + querySelector v efektech, nebo referencované komponenty
//   fromHTML        → JSX
//   h               → JSX
//   icon(name, cls) → <LucideIcon> komponenta z lucide-react (stage 2)
//   renderIcons     → lucide-react mountne ikony automaticky
//   toast           → src/components/edu/ui.tsx (Toast komponenta)
//   globals (window.vevit.copyCode/escapeHtml) → React handlery + tento escapeHtml
//
// Zachováváme: escapeHtml (pro vkládání uživatelského textu do
// dangerouslySetInnerHTML, např. Wikipedia obsah) a toKebab (převod
// PascalCase názvů ikon na kebab-case, pokud stage 2 potřebuje data-lucide).

/** Escaping pro vkládání uživatelského textu do HTML (dangerouslySetInnerHTML). */
export function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** PascalCase (lucide-react) → kebab-case (lucide data-lucide). */
export function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();
}