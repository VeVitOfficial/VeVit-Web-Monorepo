// TopBar – port src/components/layout/TopBar.tsx (bez AI tutor tlačítka)

import { icon, renderIcons, escapeHtml } from "../lib/dom.js";
import { toggleTheme, getTheme } from "../store/theme.js";
import { languages, changeLang, currentLang, t } from "../store/lang.js";

let langOpen = false;
let lastPath = "";

export function renderNavbar(pathname = location.pathname) {
  lastPath = pathname;
  const lang = currentLang();
  const theme = getTheme();
  const crumb = (label, href) =>
    href
      ? `<a href="${href}" class="hover:text-[var(--color-foreground)] transition-colors">${escapeHtml(label)}</a>`
      : `<span class="text-[var(--color-text-secondary)]">${escapeHtml(label)}</span>`;

  // Breadcrumbs dodá každá stránka voláním setBreadcrumbs()
  const bc = currentBreadcrumbs;
  const breadcrumbsHtml = bc && bc.length
    ? `<nav class="hidden md:flex items-center gap-2 text-xs text-[var(--color-muted)] ml-4">${bc
        .map((c, i) => `<div class="flex items-center gap-2">${i > 0 ? `<span class="text-[var(--color-text-muted)]">/</span>` : ""}${crumb(c.label, c.href)}</div>`)
        .join("")}</nav>`
    : "";

  const navLink = (href, key, active) =>
    `<a href="${href}" class="transition-colors ${active ? "text-emerald-500 font-medium" : "hover:text-[var(--color-nav-hover)]"}">${escapeHtml(t(key))}</a>`;

  const langItems = languages
    .map(
      (l) =>
        `<button data-lang="${l.code}" class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-glass-highlight)] transition-colors text-left ${l.code === lang ? "text-emerald-400" : "text-[var(--color-foreground)]"}"><span>${l.flag}</span><span class="flex-1">${l.label}</span>${l.code === lang ? icon("check", "h-3.5 w-3.5") : ""}</button>`
    )
    .join("");

  const el = document.getElementById("navbar");
  el.innerHTML = `
    <header class="glass-strong sticky top-0 z-50 h-14 px-4 flex items-center border-b border-[var(--color-glass-border)]">
      <div class="flex items-center gap-3 flex-1">
        <a href="/dashboard/" class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">${icon("flask-conical", "h-4 w-4 text-emerald-400")}</div>
          <span class="font-semibold text-[var(--color-foreground)] text-sm tracking-tight">VeVit Edu</span>
        </a>
        ${breadcrumbsHtml}
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm text-[var(--color-muted)]">
        ${navLink("/dashboard/", "nav.home", pathname === "/dashboard/" || pathname === "/")}
        ${navLink("/dashboard/", "nav.courses", pathname.startsWith("/kurzy/"))}
        <a href="/programovani/" class="transition-colors ${pathname.startsWith("/programovani/") ? "text-emerald-500 font-medium" : "hover:text-emerald-400"}">${escapeHtml(t("nav.programming"))}</a>
        ${navLink("/dashboard/", "nav.lessons", pathname.startsWith("/lekce/"))}
        ${navLink("/dashboard/", "nav.articles", false)}
      </nav>
      <div class="flex items-center gap-2 flex-1 justify-end">
        <span class="hidden sm:inline-flex glass text-xs text-[var(--color-muted)] border-[var(--color-border-subtle)] rounded-md px-2 py-1 flex items-center gap-1">${icon("book-open", "h-3 w-3")}${escapeHtml(t("nav.beta"))}</span>
        <div class="relative" id="lang-wrap">
          <button id="lang-btn" class="text-[var(--color-nav-text)] hover:text-[var(--color-nav-hover)] hover:bg-[var(--color-glass-highlight)] gap-1 rounded-md px-2 py-1.5 flex items-center">${icon("globe", "h-4 w-4")}<span class="text-xs font-medium uppercase">${lang}</span></button>
          ${langOpen ? `<div class="absolute right-0 top-full mt-1 w-40 rounded-lg glass-strong border border-[var(--color-glass-border)] overflow-hidden z-50">${langItems}</div>` : ""}
        </div>
        <button id="theme-btn" class="text-[var(--color-nav-text)] hover:text-[var(--color-nav-hover)] hover:bg-[var(--color-glass-highlight)] h-8 w-8 rounded-md flex items-center justify-center">${theme === "dark" ? icon("sun", "h-4 w-4") : icon("moon", "h-4 w-4")}</button>
        <button class="bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-all text-sm px-4 py-1.5">${escapeHtml(t("nav.login"))}</button>
      </div>
    </header>`;

  // Události
  el.querySelector("#theme-btn").addEventListener("click", () => {
    toggleTheme();
    renderNavbar(lastPath);
  });
  el.querySelector("#lang-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    langOpen = !langOpen;
    renderNavbar(lastPath);
  });
  el.querySelectorAll("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => {
      changeLang(b.dataset.lang);
      langOpen = false;
      // langchange event spustí re-render celé app + navbaru
    })
  );
  renderIcons(el);
}

let currentBreadcrumbs = null;
export function setBreadcrumbs(crumbs) {
  currentBreadcrumbs = crumbs;
  renderNavbar(location.pathname);
}

// Zavření dropdownu klikem mimo
document.addEventListener("click", (e) => {
  if (langOpen && !e.target.closest("#lang-wrap")) {
    langOpen = false;
    renderNavbar(lastPath);
  }
});