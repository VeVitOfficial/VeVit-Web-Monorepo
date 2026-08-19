// Dashboard – port dashboard/page.tsx

import { $, icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { getIndex } from "../lib/api.js";
import { getProgress } from "../store/progress.js";
import { t, lessonsUnit } from "../store/lang.js";
import { PROGRAMMING_TOTAL_LESSONS, PROGRAMMING_COURSES_COUNT } from "../config.js";
import { loadCustomLessons, deleteCustomLesson } from "../store/custom-lessons.js";
import { navigate } from "../router.js";

const categoryIconMap = {
  Matematika: "calculator", Fyzika: "atom", Historie: "scroll-text", Chemie: "flask-conical", "AI gramotnost": "brain",
};
const dashboardIconMap = { Terminal: "terminal", Brain: "brain", Calculator: "calculator", Atom: "atom", History: "scroll-text", FlaskConical: "flask-conical", Code2: "code-2" };

const recentlyAdded = [
  { id: "r1", category: "Matematika", title: "Derivace a jejich geometrický význam", date: "1. dubna 2026", duration: "10 min" },
  { id: "r2", category: "Fyzika", title: "Elektrostatika a elektrické pole", date: "28. března 2026", duration: "15 min" },
  { id: "r3", category: "Historie", title: "České země za vlády Lucenburgurků", date: "15. března 2026", duration: "20 min" },
  { id: "r4", category: "Chemie", title: "Úvod do organické chemie a uhlovodíky", date: "10. března 2026", duration: "12 min" },
];

function getFirstTextPreview(blocks) {
  for (const b of blocks) {
    if (b.type === "paragraph" && b.text) return b.text.slice(0, 80).replace(/\n/g, " ") + "…";
    if (b.type === "heading" && b.text) return b.text.slice(0, 80) + "…";
  }
  return "Vlastní lekce";
}

export async function renderHome() {
  setBreadcrumbs([]);
  const index = await getIndex();
  const progress = getProgress();
  const completed = progress.completedLessons;

  const programming = index.filter((c) => c.category === "programovani");
  const nonProgramming = index.filter((c) => c.category !== "programovani");

  // Continue Learning
  const continueItems = [];
  const progCompleted = programming.reduce((acc, c) => acc + (c.lessons || []).filter((l) => completed.includes(l.slug)).length, 0);
  if (progCompleted > 0 && progCompleted < PROGRAMMING_TOTAL_LESSONS) {
    continueItems.push({ title: t("home.categories.programming"), description: t("home.categories.programmingDesc"), color: "#00d084", icon: "Terminal", completed: progCompleted, total: PROGRAMMING_TOTAL_LESSONS, percent: Math.round((progCompleted / PROGRAMMING_TOTAL_LESSONS) * 100), href: "/programovani/" });
  }
  for (const course of nonProgramming) {
    const slugs = (course.lessons || []).map((l) => l.slug);
    const total = slugs.length;
    if (total === 0) continue;
    const done = slugs.filter((s) => completed.includes(s)).length;
    if (done > 0 && done < total) continueItems.push({ title: course.title, description: course.description, color: course.color || "#00d084", icon: course.icon || "BookOpen", completed: done, total, percent: Math.round((done / total) * 100), href: `/kurzy/${course.slug}/` });
  }
  const cont = continueItems.slice(0, 3);

  const cats = [
    { id: "programming", titleKey: "home.categories.programming", descKey: "home.categories.programmingDesc", icon: "Terminal", href: "/programovani/", color: "#00d084", count: PROGRAMMING_COURSES_COUNT, countLabel: t("home.courses"), disabled: false },
    { id: "ai", titleKey: "home.categories.aiLiteracy", descKey: "home.categories.aiLiteracyDesc", icon: "Brain", href: "ai-gramotnost/", color: "#8b5cf6", count: 36, countLabel: lessonsUnit(36), disabled: false },
    { id: "matematika", titleKey: "home.categories.math", descKey: "home.categories.mathDesc", icon: "Calculator", href: "#", color: "#facc15", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
    { id: "fyzika", titleKey: "home.categories.physics", descKey: "home.categories.physicsDesc", icon: "Atom", href: "#", color: "#f97316", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
    { id: "historie", titleKey: "home.categories.history", descKey: "home.categories.historyDesc", icon: "History", href: "#", color: "#a78bfa", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
    { id: "chemie", titleKey: "home.categories.chemistry", descKey: "home.categories.chemistryDesc", icon: "FlaskConical", href: "#", color: "#0ea5e9", count: 0, countLabel: t("landing.comingSoon"), disabled: true },
  ];

  const titleParts = t("landing.title").split(". ");

  const filteredRecently = recentlyAdded.filter((item) => !["Python", "JavaScript", "HTML", "SQL"].some((p) => item.title.toLowerCase().includes(p.toLowerCase()) || item.category.toLowerCase().includes(p.toLowerCase())));

  const customLessons = loadCustomLessons();

  const app = $("#app");
  app.innerHTML = `<div class="min-h-screen bg-[var(--color-background)]">
    <main class="max-w-6xl mx-auto px-6 py-10">
      <section class="text-center pt-8 pb-16 md:pt-12 md:pb-20">
        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] mb-2">${escapeHtml(titleParts[0] || "")}. ${escapeHtml(titleParts[1] || "")}. <span class="text-emerald-500">${escapeHtml(titleParts[2] || "")}.</span></h1>
        <div class="mt-8 max-w-2xl mx-auto relative"><div class="relative">${icon("search", "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)] pointer-events-none")}<label class="sr-only" for="hero-search">Vyhledat kurz, téma nebo článek</label><input id="hero-search" type="search" role="combobox" aria-expanded="false" aria-controls="hero-search-listbox" aria-autocomplete="list" aria-activedescendant="" aria-describedby="hero-search-help" autocomplete="off" placeholder="${escapeHtml(t("landing.searchPlaceholder"))}" class="w-full h-14 pl-12 pr-4 rounded-xl bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-md transition-all"/>
          </div>
          <p id="hero-search-help" class="mt-3 text-xs text-[var(--color-text-muted)]">Hledej kurzy, témata i články z Wikipedie. Dotaz ukončený <span class="text-emerald-500 font-medium">?</span> zapne odpověď AI nad článkem. Potvrď Enterem.</p></div>
      </section>
      ${cont.length > 0 ? `<section class="mb-16"><h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">${icon("play", "h-5 w-5 text-emerald-500")}${escapeHtml(t("home.continueLearning"))}</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${cont.map(continueCard).join("")}</div></section>` : ""}
      <section class="mb-20"><h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-6">${escapeHtml(t("home.categories.title"))}</h2><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cats.map(categoryCard).join("")}</div></section>
      <section class="mb-20"><h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-6">${escapeHtml(t("landing.recentlyAdded"))}</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${filteredRecently.map(recentCard).join("")}</div></section>
      <section class="mb-20"><div class="flex items-center justify-between gap-4 mb-2"><div class="flex items-center gap-3"><h2 class="text-xl font-semibold text-[var(--color-text-primary)]">${escapeHtml(t("landing.lessons"))}</h2>${icon("book-open", "h-5 w-5 text-[var(--color-text-muted)]")}</div><a href="/lekce/vytvorit/" class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:border-emerald-500/30 hover:text-emerald-500 transition-colors">${icon("plus", "h-4 w-4")}Vytvořit vlastní</a></div><p class="text-sm text-[var(--color-text-muted)] mb-6">${escapeHtml(t("landing.userLessons"))}</p><div id="custom-lessons"></div></section>
    </main>
  </div>`;

  renderCustomLessons(customLessons);
  renderIcons(app);

  const hs = app.querySelector("#hero-search");
  if (hs) attachAutocomplete(hs, buildSuggestions(index, recentlyAdded, customLessons));
  return null;

  function continueCard(item) {
    return `<a href="${item.href}" class="group block rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-5 transition-all duration-300 hover:border-emerald-500/30 shadow-sm"><div class="flex items-start gap-4"><div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style="background-color:${item.color}15;color:${item.color}">${icon(dashboardIconMap[item.icon] || item.icon || "book-open", "h-5 w-5")}</div><div class="flex-1 min-w-0"><h3 class="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">${escapeHtml(item.title)}</h3><p class="text-xs text-[var(--color-text-secondary)] mt-1">${item.completed}/${item.total} (${item.percent}%)</p><div class="mt-2 h-1.5 rounded-full bg-[var(--color-input-bg)] overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${item.percent}%"></div></div></div>${icon("arrow-right", "h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors mt-2 shrink-0")}</div></a>`;
  }

  function categoryCard(cat) {
    const hoverHandlers = cat.disabled ? "" : `onmouseenter="this.style.borderColor='${cat.color}4d'" onmouseleave="this.style.borderColor='var(--color-border-subtle)'"`;
    const wrapper = cat.disabled
      ? `<div class="group cursor-not-allowed">`
      : `<a href="${cat.href}" class="group">`;
    const closeW = cat.disabled ? `</div>` : `</a>`;
    const innerCls = cat.disabled
      ? "bg-[var(--color-card-bg)] opacity-50 border-[var(--color-border-subtle)]"
      : "bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] border-[var(--color-border-subtle)] transition-all duration-300 hover:-translate-y-1";
    const borderStyle = cat.disabled ? "" : `border-color:${cat.color}30;`;
    const iconWrap = cat.disabled
      ? `<div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style="background-color:var(--color-input-bg);color:var(--color-text-muted)">${icon(cat.icon, "h-5 w-5")}</div>`
      : `<div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style="background-color:${cat.color}15;color:${cat.color}">${icon(cat.icon, "h-5 w-5")}</div>`;
    const badge = cat.disabled
      ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap" style="color:var(--color-text-muted);background-color:var(--color-input-bg);border-color:var(--color-border-subtle)">${escapeHtml(cat.countLabel)}</span>`
      : `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap" style="color:${cat.color};background-color:${cat.color}12;border-color:${cat.color}22">${cat.count} ${escapeHtml(cat.countLabel)}</span>`;
    return `${wrapper}<div class="relative h-full rounded-xl backdrop-blur-md border p-5 shadow-sm ${innerCls}" style="${borderStyle}" ${hoverHandlers}><div class="flex items-start gap-4">${iconWrap}<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2 mb-1"><h3 class="text-base font-semibold ${cat.disabled ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors"}">${escapeHtml(t(cat.titleKey))}</h3>${badge}</div><p class="text-xs line-clamp-2 ${cat.disabled ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-secondary)]"}">${escapeHtml(t(cat.descKey))}</p></div></div></div>${closeW}`;
  }

  function recentCard(item) {
    return `<div class="flex items-center gap-4 rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-4 transition-all duration-300 hover:border-[var(--color-glass-border)] cursor-pointer group shadow-sm"><div class="h-12 w-12 rounded-xl bg-[var(--color-input-bg)] flex items-center justify-center text-emerald-500 shrink-0">${icon(categoryIconMap[item.category] || "book-open", "h-5 w-5")}</div><div class="flex-1 min-w-0"><p class="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold mb-0.5">${escapeHtml(item.category)}</p><h3 class="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">${escapeHtml(item.title)}</h3><div class="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)]"><span class="flex items-center gap-1">${icon("calendar", "h-3 w-3")}${escapeHtml(item.date)}</span><span class="text-[var(--color-text-muted)]">•</span><span class="flex items-center gap-1">${icon("clock", "h-3 w-3")}${escapeHtml(item.duration)}</span></div></div>${icon("arrow-right", "h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0")}</div>`;
  }

  function renderCustomLessons(list) {
    const wrap = $("#custom-lessons");
    if (!wrap) return;
    if (list.length === 0) {
      wrap.innerHTML = `<div class="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-8 text-center"><p class="text-sm text-[var(--color-text-muted)]">Zatím tu nejsou žádné vlastní lekce.</p></div>`;
      return;
    }
    wrap.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${list.map((lesson) => `<div class="group relative rounded-xl bg-[var(--color-card-bg)] hover:bg-[var(--color-glass-highlight)] backdrop-blur-md border border-[var(--color-border-subtle)] p-5 transition-all duration-300 hover:border-emerald-500/20 shadow-sm"><a href="/lekce/moje/detail?slug=${encodeURIComponent(lesson.slug)}" class="block"><div class="flex items-start gap-4"><div class="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">${icon(categoryIconMap[lesson.category] || "book-open", "h-5 w-5")}</div><div class="flex-1 min-w-0"><h3 class="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-emerald-500 transition-colors truncate">${escapeHtml(lesson.title)}</h3><p class="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">${escapeHtml(lesson.description || getFirstTextPreview(lesson.blocks))}</p><p class="text-[10px] text-[var(--color-text-muted)] mt-2">${escapeHtml(lesson.category || "Ostatní")}</p></div></div></a><button data-del="${escapeHtml(lesson.id)}" class="absolute top-3 right-3 p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" title="Smazat lekci">${icon("trash-2", "h-4 w-4")}</button></div>`).join("")}</div>`;
    wrap.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { deleteCustomLesson(list.find((l) => l.id === b.dataset.del)?.slug); const next = list.filter((l) => l.id !== b.dataset.del); renderCustomLessons(next); renderIcons(wrap); }));
    renderIcons(wrap);
  }
}

// ─── Hero search autocomplete (našeptávač) ─────────────────────────────
// Zdroje: index (kurzy + lekce), recentlyAdded (bez přímé routy → fallback na /hledat),
// customLessons (uživatelský vstup — proto se escapuje každá část labelu).

function buildSuggestions(index, recentlyAdded, customLessons) {
  const out = [];
  for (const c of index || []) {
    out.push({ type: "course", label: c.title, sub: c.category, href: `/kurzy/${encodeURIComponent(c.slug)}/` });
    for (const l of (c.lessons || [])) {
      out.push({ type: "lesson", label: l.title, sub: c.title, href: `/lekce/${encodeURIComponent(l.slug)}/` });
    }
  }
  for (const r of recentlyAdded || []) {
    out.push({ type: "recent", label: r.title, sub: r.category, href: `/hledat?q=${encodeURIComponent(r.title)}` });
  }
  for (const cl of customLessons || []) {
    out.push({ type: "custom", label: cl.title, sub: cl.category || "Vlastní lekce", href: `/lekce/moje/detail?slug=${encodeURIComponent(cl.slug)}` });
  }
  return out;
}

// Zvýraznění shody: slice na 3 části, escapeHtml na KAŽDÉ zvlášť, <mark> vložen jako literál.
// Query se do HTML nikdy neinterpoluje — jen určuje, který řez labelu se obalí.
function highlightMatch(label, query) {
  const q = String(query || "");
  if (!q) return escapeHtml(label);
  const text = String(label ?? "");
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return escapeHtml(before) + '<mark class="search-match">' + escapeHtml(match) + "</mark>" + escapeHtml(after);
}

function attachAutocomplete(input, suggestions) {
  const wrap = input.parentElement; // vnitřní .relative kontejner
  const listbox = document.createElement("ul");
  listbox.id = "hero-search-listbox";
  listbox.className = "hero-search-listbox";
  listbox.setAttribute("role", "listbox");
  listbox.setAttribute("hidden", "");
  wrap.appendChild(listbox);

  let matches = [];
  let activeIndex = -1;
  let debounceId = null;

  const isOpen = () => !listbox.hasAttribute("hidden");
  const close = () => {
    listbox.setAttribute("hidden", "");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  };

  const setActive = (idx) => {
    const items = listbox.querySelectorAll('li[role="option"]');
    items.forEach((li, i) => li.setAttribute("aria-selected", i === idx ? "true" : "false"));
    activeIndex = idx;
    if (idx >= 0 && items[idx]) {
      input.setAttribute("aria-activedescendant", items[idx].id);
      items[idx].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };

  const selectItem = (item) => {
    if (!item) return;
    input.value = item.label;
    close();
    navigate(item.href);
  };

  const render = (q) => {
    const ql = q.toLowerCase();
    const scored = suggestions
      .map((s, i) => {
        const hay = (s.label + " " + (s.sub || "")).toLowerCase();
        const idx = hay.indexOf(ql);
        if (idx === -1) return null;
        // prefixová shoda (label začíná query) má přednost před containsovou; původní pořadí je tiebreaker
        const prefix = s.label.toLowerCase().indexOf(ql) === 0 ? 0 : 1;
        return { s, prefix, order: i };
      })
      .filter(Boolean)
      .sort((a, b) => a.prefix - b.prefix || a.order - b.order)
      .slice(0, 8)
      .map((x) => x.s);

    matches = scored;
    activeIndex = -1;

    if (!q) { close(); return; }

    if (matches.length === 0) {
      listbox.innerHTML = '<li class="hsl-empty" role="presentation">Nic nenalezeno</li>';
      listbox.removeAttribute("hidden");
      input.setAttribute("aria-expanded", "true");
      input.removeAttribute("aria-activedescendant");
      return;
    }

    listbox.innerHTML = matches.map((m, i) => {
      const labelHtml = highlightMatch(m.label, q);
      const subHtml = m.sub ? `<span class="hsl-sub">${escapeHtml(m.sub)}</span>` : "";
      return `<li role="option" id="hero-search-opt-${i}" aria-selected="false" data-index="${i}"><span class="hsl-label">${labelHtml}</span>${subHtml}</li>`;
    }).join("");
    listbox.removeAttribute("hidden");
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("input", () => {
    clearTimeout(debounceId);
    const v = input.value.trim();
    if (!v) { close(); return; }
    debounceId = setTimeout(() => render(v), 150);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      if (!isOpen()) { const v = input.value.trim(); if (v) render(v); return; }
      if (matches.length === 0) return;
      e.preventDefault();
      setActive((activeIndex + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      if (!isOpen() || matches.length === 0) return;
      e.preventDefault();
      setActive((activeIndex - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      // Vybraná položka → potvrď výběr; jinak původní chování (Wikipedia/AI hledání).
      if (isOpen() && activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        selectItem(matches[activeIndex]);
      } else {
        const v = input.value.trim();
        if (v) navigate("/hledat?q=" + encodeURIComponent(v));
      }
    } else if (e.key === "Escape") {
      if (isOpen()) { e.preventDefault(); close(); }
    }
  });

  // mouseover synchronizuje aktivní index, takže šipky pokračují od najeté položky
  listbox.addEventListener("mouseover", (e) => {
    const li = e.target.closest('li[role="option"]');
    if (!li) return;
    const idx = Number(li.dataset.index);
    if (Number.isNaN(idx)) return;
    setActive(idx);
  });

  listbox.addEventListener("click", (e) => {
    const li = e.target.closest('li[role="option"]');
    if (!li) return;
    const item = matches[Number(li.dataset.index)];
    if (item) selectItem(item);
  });

  // klik mimo dropdown zavře
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });
}
