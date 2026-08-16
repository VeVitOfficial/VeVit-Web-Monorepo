// History API router – trailing slash cesty shodné s Next.js originálem
// BASE_PATH: EDU běží pod /edu/ v monorepu

const BASE_PATH = "/edu";

import { $, escapeHtml, renderIcons } from "./lib/dom.js";
import { renderNavbar } from "./components/navbar.js?v=20260809e";
import { renderHome } from "./pages/home.js?v=20260809e";
import { renderProgramovani } from "./pages/programovani.js";
import { renderCourse } from "./pages/course.js";
import { renderLesson } from "./pages/lesson.js";
import { renderCreate } from "./pages/create.js";
import { renderMyLesson } from "./pages/my-lesson.js";
import { renderSearch } from "./pages/search.js";

// Route → handler. Handler dostane (params, query) a vrací Promise<void> (render do #app).
const routes = [
  { pattern: /^\/?$/, handler: () => renderHome(), title: "Domů" },
  { pattern: /^\/dashboard\/?$/, handler: () => renderHome(), title: "Domů" },
  { pattern: /^\/programovani\/?$/, handler: () => renderProgramovani(), title: "Programování" },
  { pattern: /^\/kurzy\/([^/]+)\/?$/, handler: (m) => renderCourse(decodeURIComponent(m[1])), title: "Kurz" },
  { pattern: /^\/hledat\/?$/, handler: (_m, q) => renderSearch(q), title: "Hledat" },
  { pattern: /^\/lekce\/vytvorit\/?$/, handler: () => renderCreate(), title: "Vytvořit lekci" },
  { pattern: /^\/lekce\/moje\/detail\/?$/, handler: (_m, q) => renderMyLesson(q), title: "Moje lekce" },
  { pattern: /^\/lekce\/([^/]+)\/?$/, handler: (m) => renderLesson(decodeURIComponent(m[1])), title: "Lekce" },
];

function parseQuery(search) {
  const q = {};
  new URLSearchParams(search).forEach((v, k) => (q[k] = v));
  return q;
}

// Odstraní BASE_PATH prefix z pathname pro porovnání s route patterny.
function stripBase(pathname) {
  if (pathname.startsWith(BASE_PATH)) return pathname.slice(BASE_PATH.length) || "/";
  return pathname;
}

let currentCleanup = null;

function isExternalVevitPath(href) {
  return ['/home', '/account', '/tools', '/store'].some(
    (prefix) => href === prefix || href.startsWith(prefix + '/')
  );
}

export async function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  await renderRoute();
}

async function renderRoute() {
  const { pathname, search } = location;
  const relative = stripBase(pathname);
  // /edu nebo /edu/ → redirect na /edu/dashboard/
  if (relative === "/" || relative === "") {
    history.replaceState({}, "", BASE_PATH + "/dashboard/");
    return renderRoute();
  }
  // Cleanup předchozí stránky (např. intervaly)
  if (currentCleanup) {
    try { currentCleanup(); } catch {}
    currentCleanup = null;
  }
  const query = parseQuery(search);
  let matched = false;
  for (const r of routes) {
    const m = relative.match(r.pattern);
    if (m) {
      matched = true;
      document.title = `${r.title} – VeVit Edu`;
      renderNavbar(relative);
      try {
        const ret = await r.handler(m, query);
        if (typeof ret === "function") currentCleanup = ret;
      } catch (e) {
        console.error(e);
        $("#app").innerHTML = `<div class="max-w-3xl mx-auto p-8 text-center text-muted">Chyba: ${escapeHtml(e.message)}</div>`;
      }
      break;
    }
  }
  if (!matched) {
    renderNavbar(relative);
    notFound();
  }
  // Scroll nahoru + ikony
  window.scrollTo(0, 0);
  renderIcons();
}

function notFound() {
  document.title = "404 – VeVit Edu";
  $("#app").innerHTML = `
    <div class="max-w-xl mx-auto p-16 text-center">
      <div class="text-6xl font-bold gradient-text mb-4">404</div>
      <p class="text-muted mb-6">Stránka nebyla nalezena.</p>
      <a href="${BASE_PATH}/dashboard/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a>
    </div>`;
}

// Intercept kliků na interní odkazy (a[href^="/"]) pro client-side navigaci.
// Přidá BASE_PATH k relativním edu cestám (/dashboard → /edu/dashboard).
function onClick(e) {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download") || a.dataset.fullReload === "true") return;
  if (href.startsWith("/") && !href.startsWith("//") && !isExternalVevitPath(href)) {
    e.preventDefault();
    // Cesty bez BASE_PATH prefixu automaticky doplníme (interní SPA linky)
    const target = href.startsWith(BASE_PATH) ? href : BASE_PATH + href;
    navigate(target);
  }
}

export function initRouter() {
  window.addEventListener("popstate", renderRoute);
  document.addEventListener("click", onClick);
  renderRoute();
}

export function rerender() {
  return renderRoute();
}
