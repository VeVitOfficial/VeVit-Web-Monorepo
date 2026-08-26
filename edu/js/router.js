// History API router – trailing slash cesty shodné s Next.js originálem
// EDU běží pod /edu/ v monorepu, s per-locale prefixem: /<lang>/edu/…
// Prohlížeč vidí /de/edu/dashboard/; Apache prefix stripne interně, ale
// location.pathname zůstává s prefixem, takže router rozpozná jazyk z URL.

import { $, escapeHtml, renderIcons } from "./lib/dom.js";
import { renderNavbar } from "./components/navbar.js?v=20260809e";
import { renderHome } from "./pages/home.js?v=20260809e";
import { renderProgramovani } from "./pages/programovani.js";
import { renderCourse } from "./pages/course.js";
import { renderLesson } from "./pages/lesson.js";
import { renderCreate } from "./pages/create.js";
import { renderMyLesson } from "./pages/my-lesson.js";
import { renderSearch } from "./pages/search.js";
import { applyUrlLocale } from "./store/lang.js?v=20260824a";

const SUPPORTED_LOCALES = ["cs", "en", "de", "es", "uk", "fr", "sk"];
const LOCALE_RE = /^\/(cs|en|de|es|uk|fr|sk)(?=\/|$)/;
const SECTION = "/edu";
const LOCALE_SCROLL_KEY = "vevit:locale-scroll";

// Aktuální locale z URL. Dynamický BASE_PATH = "/<lang>/edu".
let currentLocale = "cs";
function basePath() { return "/" + currentLocale + SECTION; }
function detectLocale(pathname) {
  const m = pathname.match(LOCALE_RE);
  return m ? m[1] : null;
}

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

// Odstraní /<lang>/edu prefix z pathname a nastaví currentLocale z URL.
// Vrací relativní cestu pro porovnání s route patterny (např. /dashboard/).
function stripBase(pathname) {
  let rest = pathname;
  const loc = detectLocale(rest);
  if (loc) { currentLocale = loc; rest = rest.slice(("/" + loc).length); }
  if (rest.startsWith(SECTION)) rest = rest.slice(SECTION.length);
  return rest || "/";
}

let currentCleanup = null;
let renderGeneration = 0;

function normalizedEduPath(path) {
  const withoutLocale = path.replace(LOCALE_RE, "") || SECTION;
  if (withoutLocale === SECTION || withoutLocale === `${SECTION}/`) return `${SECTION}/dashboard/`;
  return withoutLocale.endsWith("/") ? withoutLocale : `${withoutLocale}/`;
}

function takeLocaleScrollPosition() {
  try {
    const raw = sessionStorage.getItem(LOCALE_SCROLL_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const fresh = Date.now() - Number(saved.createdAt) < 15_000;
    const sameLocale = saved.locale === currentLocale;
    const samePage = normalizedEduPath(saved.path) === normalizedEduPath(location.pathname);
    if (!fresh || !sameLocale || !samePage) return null;
    sessionStorage.removeItem(LOCALE_SCROLL_KEY);
    return { x: Number(saved.x) || 0, y: Number(saved.y) || 0 };
  } catch {
    return null;
  }
}

function restoreScrollPosition(position) {
  const deadline = performance.now() + 2500;
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  const apply = () => {
    window.scrollTo(position.x, position.y);
    if (Math.abs(window.scrollY - position.y) > 1 && performance.now() < deadline) {
      window.setTimeout(apply, 60);
    } else {
      root.style.scrollBehavior = previousScrollBehavior;
    }
  };
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

function isExternalVevitPath(href) {
  let h = href;
  const loc = detectLocale(h);
  if (loc) h = h.slice(("/" + loc).length);
  return ["/home", "/account", "/tools", "/store"].some(
    (prefix) => h === prefix || h.startsWith(prefix + "/")
  );
}

// Převod jakéhokoliv interního href na kanonický SPA path /<lang>/edu/<rest>.
// Akceptuje /de/edu/x, /edu/x i /x — vše normalizuje s aktuálním locale.
function toSpaPath(href) {
  let h = href;
  const loc = detectLocale(h);
  if (loc) h = h.slice(("/" + loc).length);
  if (h.startsWith(SECTION)) h = h.slice(SECTION.length) || "/";
  return basePath() + h;
}

export async function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  await renderRoute();
}

async function renderRoute({ preserveScroll = false } = {}) {
  const generation = ++renderGeneration;
  const previousScroll = { x: window.scrollX, y: window.scrollY };
  const { pathname, search } = location;
  const relative = stripBase(pathname);
  // Synchronizace edu jazykového store s locale z URL (bez re-render eventu).
  if (SUPPORTED_LOCALES.includes(currentLocale)) applyUrlLocale(currentLocale);
  // /<lang>/edu nebo /<lang>/edu/ → redirect na /<lang>/edu/dashboard/
  if (relative === "/" || relative === "") {
    history.replaceState({}, "", basePath() + "/dashboard/");
    return renderRoute({ preserveScroll });
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
  if (generation !== renderGeneration) return;
  const localeScroll = takeLocaleScrollPosition();
  restoreScrollPosition(localeScroll || (preserveScroll ? previousScroll : { x: 0, y: 0 }));
  renderIcons();
}

function notFound() {
  document.title = "404 – VeVit Edu";
  $("#app").innerHTML = `
    <div class="max-w-xl mx-auto p-16 text-center">
      <div class="text-6xl font-bold gradient-text mb-4">404</div>
      <p class="text-muted mb-6">Stránka nebyla nalezena.</p>
      <a href="${basePath()}/dashboard/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a>
    </div>`;
}

// Intercept kliků na interní odkazy (a[href^="/"]) pro client-side navigaci.
// Normalizuje href na /<lang>/edu/<rest> (přidá prefix i BASE_PATH).
function onClick(e) {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download") || a.dataset.fullReload === "true") return;
  if (href.startsWith("/") && !href.startsWith("//") && !isExternalVevitPath(href)) {
    e.preventDefault();
    navigate(toSpaPath(href));
  }
}

export function initRouter() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("popstate", renderRoute);
  document.addEventListener("click", onClick);
  renderRoute();
}

export function rerender() {
  return renderRoute({ preserveScroll: true });
}
