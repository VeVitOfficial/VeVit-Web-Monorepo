// Kurzy programování – "Nauč se programovat"
// Paleta sjednocená s hlavní stránkou (globální --color-* tokeny + emerald-500 akcent).
// Místo 3 statistických boxů je panel „Pokračovat v poslední rozdělané lekci".

import { $, icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { getIndex, findResumeLesson } from "../lib/api.js";
import { getProgress } from "../store/progress.js";
import { t, lessonsLabel } from "../store/lang.js";

// Štítky obtížnosti (emerald/amber/red – stejné jako success/warning/error na hlavní stránce)
const DIFF = {
  beginner: { color: "#10b981", labelKey: "programming.difficulty.beginner" },
  advanced: { color: "#f59e0b", labelKey: "programming.difficulty.advanced" },
  expert:   { color: "#ef4444", labelKey: "programming.difficulty.expert" },
};
// Kategorie kurzů (podle slugu)
const CAT = {
  python: "programovani", javascript: "programovani", typescript: "programovani", php: "programovani",
  java: "programovani", csharp: "programovani", cpp: "programovani", rust: "programovani", go: "programovani",
  kotlin: "programovani", swift: "programovani", ruby: "programovani",
  "html-css": "web-db", sql: "web-db",
  "terminal-bash": "nastroje", "git-github": "nastroje", docker: "nastroje",
  "zaklady-programovani": "zaklady",
};
// Pill filtry (kategorie + obtížnost), počty se dopočítají z dat
const PILLS = [
  { key: "all", labelKey: "programming.cat.all", type: "all" },
  { key: "programovani", labelKey: "programming.cat.programming", type: "category" },
  { key: "web-db", labelKey: "programming.cat.webdb", type: "category" },
  { key: "nastroje", labelKey: "programming.cat.tools", type: "category" },
  { key: "zaklady", labelKey: "programming.cat.basics", type: "category" },
  { key: "beginner", labelKey: "programming.cat.beginners", type: "difficulty" },
  { key: "advanced", labelKey: "programming.cat.advanced", type: "difficulty" },
];

const codeSnippets = [
  'print("Hello, World!")', 'const sum = (a, b) => a + b;', 'fn main() { println!("Rust!"); }',
  'SELECT * FROM users WHERE active = 1;', 'docker run -p 3000:3000 myapp', '<div class="hero">VeVit Edu</div>',
  'go func() { fmt.Println("Go!") }()', 'class Hero extends React.Component { }',
];

let state = { active: "all", query: "", courses: [] };

export async function renderProgramovani() {
  setBreadcrumbs([]);
  const index = await getIndex();
  state.courses = index.filter((c) => c.category === "programovani");
  const progress = getProgress();

  const app = $("#app");
  const bgSpans = Array.from({ length: 60 }).map((_, i) => `<span class="whitespace-nowrap">${escapeHtml(codeSnippets[i % codeSnippets.length])}</span>`).join("");

  app.innerHTML = `<div class="min-h-screen bg-[var(--color-background)]">
    <section class="relative overflow-hidden border-b border-[var(--color-border-subtle)]">
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none select-none"><div class="absolute inset-0 flex flex-wrap content-start gap-x-8 gap-y-2 p-8 text-[10px] font-mono text-emerald-500">${bgSpans}</div></div>
      <div class="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-[var(--color-text-primary)]">${escapeHtml(t("programming.heroTitle"))} <span class="text-emerald-500">${escapeHtml(t("programming.heroAccent"))}</span></h1>
          <p class="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-[var(--color-text-secondary)]">${escapeHtml(t("programming.heroSubtitle"))}</p>
          ${resumePanelHTML(index, progress)}
        </div>
      </div>
    </section>
    <main class="max-w-6xl mx-auto px-6 py-10">
      ${filtersHTML()}
      <div id="prog-grid"></div>
      ${gamificationHTML()}
      ${whyHTML()}
    </main>
    <div class="h-20"></div>
  </div>`;

  $("#prog-search").addEventListener("input", (e) => { state.query = e.target.value; renderGrid(); });
  bindPills();
  renderGrid();
  renderIcons(app);
  return null;
}

// ─── Panel „Pokračovat v poslední rozdělané lekci" ───
function resumePanelHTML(index, progress) {
  const r = findResumeLesson(index, progress, true);
  if (!r) {
    return `<div class="max-w-lg mx-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 flex items-center gap-4">
      <div class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-500">${icon("trophy", "h-6 w-6")}</div>
      <div class="flex-1 text-left"><p class="text-base font-semibold text-[var(--color-text-primary)]">Všechny lekce dokončeny!</p><p class="text-xs text-[var(--color-text-muted)]">Skvělá práce. Vrať se kdykoliv k repete.</p></div>
    </div>`;
  }
  const labels = { resume: ["Pokračovat v poslední lekci", "Pokračovat"], continue: ["Pokračovat v učení", "Pokračovat"], start: ["Začít se učit programovat", "Začít"] };
  const [label, btn] = labels[r.mode];
  return `<a href="/lekce/${encodeURIComponent(r.slug)}/" class="max-w-lg mx-auto group block rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] hover:border-emerald-500/30 p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5">
    <div class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-500">${icon("play", "h-6 w-6")}</div>
    <div class="flex-1 min-w-0 text-left">
      <p class="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">${escapeHtml(label)}</p>
      <h3 class="text-base font-semibold truncate text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors">${escapeHtml(r.lesson.title)}</h3>
      <p class="text-xs truncate text-[var(--color-text-muted)]">${escapeHtml(r.course.title)}</p>
    </div>
    <span class="shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-lg font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors">${escapeHtml(btn)} ${icon("arrow-right", "h-4 w-4")}</span>
  </a>`;
}

// ─── Filtry + vyhledávání ───
function pillCount(key) {
  if (key === "all") return state.courses.length;
  if (key === "beginner") return state.courses.filter((c) => c.difficulty === "beginner").length;
  if (key === "advanced") return state.courses.filter((c) => c.difficulty === "advanced" || c.difficulty === "expert").length;
  return state.courses.filter((c) => CAT[c.slug] === key).length;
}
function pillsHTML() {
  return PILLS.map((p) => {
    const on = state.active === p.key;
    const cls = on
      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
      : "bg-[var(--color-card-bg)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-glass-highlight)]";
    return `<button data-pill="${p.key}" class="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border whitespace-nowrap ${cls}">${escapeHtml(t(p.labelKey))} (${pillCount(p.key)})</button>`;
  }).join("");
}
function filtersHTML() {
  return `<div class="flex flex-col md:flex-row md:items-center gap-4 mb-10">
    <div id="prog-pills" class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-1 px-1 md:flex-wrap md:overflow-visible">${pillsHTML()}</div>
    <div class="relative md:ml-auto md:w-72">${icon("search", "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none text-[var(--color-text-muted)]")}<input id="prog-search" type="text" value="${escapeHtml(state.query)}" placeholder="${escapeHtml(t("programming.searchPlaceholder"))}" class="w-full h-11 pl-12 pr-4 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"/></div>
  </div>`;
}
function bindPills() {
  $("#prog-pills").querySelectorAll("[data-pill]").forEach((b) =>
    b.addEventListener("click", () => {
      state.active = b.dataset.pill;
      $("#prog-pills").innerHTML = pillsHTML();
      bindPills();
      renderGrid();
    })
  );
}

function renderGrid() {
  const grid = $("#prog-grid");
  if (!grid) return;
  let r = state.courses;
  if (state.active === "beginner") r = r.filter((c) => c.difficulty === "beginner");
  else if (state.active === "advanced") r = r.filter((c) => c.difficulty === "advanced" || c.difficulty === "expert");
  else if (state.active !== "all") r = r.filter((c) => CAT[c.slug] === state.active);
  if (state.query.trim()) {
    const q = state.query.toLowerCase();
    r = r.filter((c) => (c.title || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q) || (c.language || "").toLowerCase().includes(q));
  }
  if (r.length === 0) {
    grid.innerHTML = `<div class="text-center py-20 text-[var(--color-text-secondary)]">${icon("search", "h-12 w-12 mx-auto mb-4 text-[var(--color-text-muted)]")}<p>${escapeHtml(t("programming.emptySearch"))}</p></div>`;
    renderIcons(grid);
    return;
  }
  grid.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${r.map(courseCard).join("")}</div>`;
  renderIcons(grid);
}

function courseCard(course) {
  const count = (course.lessons || []).length || course.totalLessons || 0;
  const xp = course.totalXP || 0;
  const diff = DIFF[course.difficulty] || DIFF.beginner;
  const dc = diff.color;
  const color = course.color || "#10b981";
  return `<a href="/kurzy/${course.slug}/" class="group block">
    <div class="relative h-full rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] border border-[var(--color-border-subtle)] hover:border-emerald-500/30 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.3)]">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style="background-color:${color}18;color:${color}">${icon(course.icon || "code-2", "h-5 w-5")}</div>
        <span class="text-[10px] px-2.5 py-1 rounded-full font-medium border whitespace-nowrap" style="color:${dc};background-color:${dc}1F;border-color:${dc}40">${escapeHtml(t(diff.labelKey))}</span>
      </div>
      <h3 class="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors mb-2">${escapeHtml(course.title)}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-4">${escapeHtml(course.description)}</p>
      <div class="flex items-center justify-between text-[11px] pt-3 border-t border-[var(--color-border-subtle)]">
        <span class="flex items-center gap-1 text-[var(--color-text-muted)]">📖 ${escapeHtml(lessonsLabel(count))}</span>
        <span class="flex items-center gap-1 font-semibold text-emerald-500">⭐ ${xp.toLocaleString("cs-CZ")} XP</span>
      </div>
    </div>
  </a>`;
}

function gamificationHTML() {
  return `<section class="mt-20 rounded-2xl p-8 md:p-10 border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]">
    <div class="flex flex-col md:flex-row items-center gap-8">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-3">${icon("trophy", "h-5 w-5 text-emerald-500")}<h2 class="text-xl font-semibold text-[var(--color-text-primary)]">${escapeHtml(t("programming.gamification.title"))}</h2></div>
        <p class="text-sm leading-relaxed mb-4 text-[var(--color-text-secondary)]">${escapeHtml(t("programming.gamification.description"))}</p>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">${icon("bar-chart-3", "h-4 w-4 text-emerald-500")}<span>${escapeHtml(t("programming.gamification.progress"))}</span></div>
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">${icon("star", "h-4 w-4 text-emerald-500")}<span>${escapeHtml(t("programming.gamification.achievements"))}</span></div>
        </div>
      </div>
      <div class="shrink-0 w-full md:w-auto"><div class="flex items-center gap-4 rounded-xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-background)]">
        <div class="h-14 w-14 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-black">1</div>
        <div><div class="text-sm font-semibold text-[var(--color-text-primary)]">${escapeHtml(t("programming.gamification.level.beginner"))}</div><div class="text-xs text-[var(--color-text-secondary)]">${escapeHtml(t("programming.gamification.level.xpToNext"))}</div></div>
      </div></div>
    </div>
  </section>`;
}

function whyHTML() {
  const cards = [
    { ic: "globe", k: "programming.why.future" },
    { ic: "lock", k: "programming.why.logic" },
    { ic: "star", k: "programming.why.create" },
  ];
  return `<section class="mt-20">
    <h2 class="text-2xl font-bold mb-8 text-center text-[var(--color-text-primary)]">${escapeHtml(t("programming.why.title"))}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">${cards.map((c) => `<div class="rounded-xl p-6 border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)]"><div class="h-12 w-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-500/10 text-emerald-500">${icon(c.ic, "h-6 w-6")}</div><h3 class="text-base font-semibold mb-2 text-[var(--color-text-primary)]">${escapeHtml(t(c.k + ".title"))}</h3><p class="text-sm leading-relaxed text-[var(--color-text-secondary)]">${escapeHtml(t(c.k + ".text"))}</p></div>`).join("")}</div>
  </section>`;
}
