// TopBar – port src/components/layout/TopBar.tsx (bez AI tutor tlačítka)

import { icon, renderIcons, escapeHtml } from "../lib/dom.js";
import { toggleTheme, getTheme } from "../store/theme.js";
import { languages, changeLang, currentLang, t } from "../store/lang.js";
import { initSession, renderSessionResult } from "/assets/shared/session.js?v=20260809c";
import { initAppSwitchers } from "/assets/shared/app-switcher.js?v=20260809b";

let langOpen = false;
let lastPath = "";
let sessionResult = null;
let sessionLoad = null;
let navbarScrollBound = false;

function renderActiveSession(result) {
  document.querySelectorAll("#navbar [data-vevit-session]").forEach((root) => {
    renderSessionResult(root, result);
  });
}

function updateNavbarSurface() {
  document.querySelector(".edu-navbar")?.classList.toggle("edu-navbar--scrolled", window.scrollY > 6);
}

function bindNavbarScroll() {
  if (navbarScrollBound) return;
  navbarScrollBound = true;
  window.addEventListener("scroll", updateNavbarSurface, { passive: true });
}

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

  const navLink = (href, label, active, options = {}) =>
    `<a href="${href}"${options.fullReload ? ' data-full-reload="true"' : ""} class="edu-navbar__link ${active ? "edu-navbar__link--active" : ""}">${escapeHtml(label)}</a>`;

  const langItems = languages
    .map(
      (l) =>
        `<button data-lang="${l.code}" class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-glass-highlight)] transition-colors text-left ${l.code === lang ? "text-emerald-400" : "text-[var(--color-foreground)]"}"><span>${l.flag}</span><span class="flex-1">${l.label}</span>${l.code === lang ? icon("check", "h-3.5 w-3.5") : ""}</button>`
    )
    .join("");

  const el = document.getElementById("navbar");
  el.innerHTML = `
    <header class="edu-navbar">
      <div class="edu-navbar__inner">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="vv-app-brand" aria-label="VeVit Edu">
          <a href="/home">VeVit</a>
          <a href="/edu">Edu</a>
        </span>
        ${breadcrumbsHtml}
      </div>
      <nav class="edu-navbar__links" aria-label="Navigace VeVit Edu">
        ${navLink("/dashboard/", "Přehled", pathname === "/dashboard/" || pathname === "/")}
        ${navLink("/programovani/", t("nav.programming"), pathname.startsWith("/programovani/"))}
        ${navLink("/edu/ai-gramotnost/", "AI gramotnost", pathname.startsWith("/ai-gramotnost/"), { fullReload: true })}
        ${navLink("/hledat/", "Vyhledat", pathname.startsWith("/hledat/"))}
      </nav>
      <div class="edu-navbar__actions">
        <div class="relative" id="lang-wrap">
          <button id="lang-btn" class="edu-navbar__icon-button" aria-label="Změnit jazyk" aria-expanded="${langOpen}">${icon("globe", "h-4 w-4")}<span class="text-xs font-medium uppercase">${lang}</span></button>
          ${langOpen ? `<div class="edu-lang-menu absolute right-0 top-full mt-2 w-44 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-glass-border)] overflow-hidden z-50">${langItems}</div>` : ""}
        </div>
        <button id="theme-btn" class="edu-navbar__icon-button" aria-label="Změnit motiv">${theme === "dark" ? icon("sun", "h-4 w-4") : icon("moon", "h-4 w-4")}</button>
        <span data-vevit-app-switcher data-vevit-app="Edu"></span>
        <span data-vevit-session><span class="vv-session vv-session--loading">Ověřuji přihlášení…</span></span>
      </div>
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
  bindNavbarScroll();
  updateNavbarSurface();
  initAppSwitchers(el.querySelectorAll('[data-vevit-app-switcher]'));

  const sessionRoots = el.querySelectorAll('[data-vevit-session]');
  if (sessionResult) {
    renderActiveSession(sessionResult);
  } else if (!sessionLoad) {
    sessionLoad = initSession({ roots: sessionRoots }).then((result) => {
      sessionResult = result;
      renderActiveSession(result);
      return result;
    });
  }
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
