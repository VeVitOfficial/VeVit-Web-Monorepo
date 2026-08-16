// Kurz – port CoursePageClient.tsx

import { $, icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { getCourseBySlug } from "../lib/api.js";
import { getProgress } from "../store/progress.js";
import { t, lessonsUnit } from "../store/lang.js";
import { CircularProgress, XPBadge } from "../components/ui.js";
import { navigate } from "../router.js";

function diffColor(d) { return d === "beginner" ? "#00d084" : d === "advanced" ? "#f0ad4e" : "#d73a49"; }
function diffLabel(d) { return d === "beginner" ? t("programming.difficulty.beginner") : d === "advanced" ? t("programming.difficulty.advanced") : t("programming.difficulty.expert"); }
function chapterLabel(n) { return n === 1 ? t("course.chapter") : t("course.chapters"); }

function getTotalMinutes(course) { return course.chapters.reduce((s, ch) => s + ch.lessons.reduce((a, l) => a + (l.estimatedMinutes || 15), 0), 0); }
function getTotalXP(course) { return course.totalXP ?? course.chapters.reduce((s, ch) => s + ch.lessons.reduce((a, l) => a + (l.xp || 0), 0), 0); }
function getTotalLessons(course) { return course.totalLessons ?? course.chapters.reduce((s, ch) => s + ch.lessons.length, 0); }

export async function renderCourse(slug) {
  const data = await getCourseBySlug(slug);
  if (!data) { notFound(slug); return null; }
  const { course } = data;
  const lang = (await import("../store/lang.js")).currentLang();
  const completed = getProgress().completedLessons;
  const isProgramming = course.category === "programovani";

  setBreadcrumbs([
    { label: "Dashboard", href: "/dashboard/" },
    ...(isProgramming ? [{ label: t("nav.programming"), href: "/programovani/" }] : []),
    { label: course.title },
  ]);

  const totalLessons = getTotalLessons(course);
  const totalMinutes = getTotalMinutes(course);
  const totalHours = Math.ceil(totalMinutes / 60);
  const totalXP = getTotalXP(course);
  const completedCount = course.chapters.reduce((acc, ch) => acc + ch.lessons.filter((l) => completed.includes(l.slug)).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  let continueLesson = null;
  outer: for (const ch of course.chapters) { for (const l of ch.lessons) { if (!completed.includes(l.slug)) { continueLesson = l; break outer; } } }
  const allCompleted = completedCount === totalLessons && totalLessons > 0;
  const color = course.color || "#00d084";
  const dc = course.difficulty ? diffColor(course.difficulty) : null;

  const app = $("#app");
  app.innerHTML = `<div class="min-h-screen bg-[var(--color-background)]">
    <main class="max-w-4xl mx-auto px-6 py-10 md:py-14">
      <div class="mb-10 md:mb-14">
        <div class="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          <div class="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background-color:${color}20;color:${color}">${icon("graduation-cap", "h-7 w-7")}</div>
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent">${escapeHtml(course.title)}</h1>
            <p class="mt-3 text-[var(--color-text-secondary)] text-lg max-w-2xl leading-relaxed">${escapeHtml(course.description)}</p>
            <div class="mt-4 flex items-center gap-2 flex-wrap">
              ${course.difficulty && dc ? `<span class="text-[10px] px-2.5 py-1 rounded-full font-semibold border" style="color:${dc};background-color:${dc}14;border-color:${dc}22">${escapeHtml(diffLabel(course.difficulty))}</span>` : ""}
              ${course.language ? `<span class="text-[10px] px-2.5 py-1 rounded-full bg-[#00d084]/10 text-[#00d084] font-semibold border border-[#00d084]/20">${escapeHtml(course.language)}</span>` : ""}
              ${totalXP > 0 ? `<span class="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20 inline-flex items-center gap-1">${icon("zap", "h-3 w-3")}${totalXP} XP</span>` : ""}
              <span class="text-[10px] px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20 inline-flex items-center gap-1">${icon("clock", "h-3 w-3")}${totalHours}h</span>
            </div>
            <div class="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">${icon("book-open", "h-4 w-4")}<span>${course.chapters.length} ${escapeHtml(chapterLabel(course.chapters.length))} · ${totalLessons} ${escapeHtml(lessonsUnit(totalLessons))}</span></div>
          </div>
          <div class="flex flex-col items-center gap-3 flex-shrink-0">
            ${totalLessons > 0 ? CircularProgress({ percent: progressPercent, size: 90, stroke: 7, color: "#00d084" }) : ""}
            ${allCompleted ? `<div class="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">${icon("star", "h-4 w-4")}${escapeHtml(t("programming.completed"))}</div>` : continueLesson ? `<a href="/lekce/${continueLesson.slug}/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">${icon("play", "h-4 w-4")}${escapeHtml(completedCount > 0 ? t("programming.continue") : t("programming.start"))}</a>` : ""}
          </div>
        </div>
        ${totalLessons > 0 ? `<div class="mt-6 max-w-md"><div class="flex items-center justify-between text-xs mb-1.5"><span class="text-[var(--color-text-secondary)]">${escapeHtml(t("exercise.progress"))}</span><span class="text-emerald-500 font-medium">${completedCount}/${totalLessons} (${progressPercent}%)</span></div><div class="h-2 rounded-full bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${progressPercent}%"></div></div></div>` : ""}
      </div>
      <div class="space-y-8">${course.chapters.map((chapter, chIndex) => chapterSection(chapter, chIndex, course, completed, color)).join("")}</div>
      ${gamificationSection(course, completedCount)}
      ${whySection(course)}
    </main>
  </div>`;

  renderIcons(app);
  return null;
}

function chapterSection(chapter, chIndex, course, completed, color) {
  const chCompleted = chapter.lessons.filter((l) => completed.includes(l.slug)).length;
  const chProgress = chapter.lessons.length > 0 ? Math.round((chCompleted / chapter.lessons.length) * 100) : 0;
  const lessons = chapter.lessons.map((lesson, lIndex) => {
    const isCompleted = completed.includes(lesson.slug);
    const isCurrent = !isCompleted && (lIndex === 0 || completed.includes(chapter.lessons[lIndex - 1].slug));
    let rowCls, nodeCls;
    if (isCompleted) { rowCls = "bg-emerald-500/[0.04] border-emerald-500/15 hover:border-emerald-500/30"; nodeCls = "bg-emerald-500 border-emerald-500"; }
    else if (isCurrent) { rowCls = "bg-[var(--color-input-bg)] border-emerald-500/30 ring-1 ring-emerald-500/20 hover:border-emerald-500/50"; nodeCls = "bg-[var(--color-background)] border-emerald-500"; }
    else { rowCls = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)] hover:border-[var(--color-glass-highlight)]"; nodeCls = "bg-[var(--color-background)] border-[var(--color-border-subtle)]"; }
    const nodeInner = isCompleted ? icon("check-circle-2", "h-2.5 w-2.5 text-white absolute -top-0.5 -left-0.5") : (isCurrent ? `<div class="h-1.5 w-1.5 rounded-full bg-emerald-500 absolute top-[3px] left-[3px]"></div>` : "");
    const titleCls = isCompleted ? "text-emerald-500" : "text-[var(--color-foreground)] group-hover:text-emerald-500";
    return `<a href="/lekce/${lesson.slug}/" class="group relative block pl-10 pr-4 py-3.5 rounded-lg border transition-all ${rowCls}"><div class="absolute left-2.5 top-4 h-3.5 w-3.5 rounded-full border-2 transition-colors z-10 ${nodeCls}">${nodeInner}</div><div class="flex items-start justify-between gap-3"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="text-xs text-[var(--color-text-muted)] font-mono tabular-nums">${chIndex + 1}.${lIndex + 1}</span><span class="font-medium transition-colors ${titleCls}">${escapeHtml(lesson.title)}</span>${isCompleted ? icon("check-circle-2", "h-3.5 w-3.5 text-emerald-500") : ""}${isCurrent && !isCompleted ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">${escapeHtml(t("programming.current"))}</span>` : ""}${!isCompleted && !isCurrent ? icon("lock", "h-3 w-3 text-[var(--color-text-muted)] opacity-40") : ""}</div><p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">${escapeHtml(lesson.description || lesson.abstract || "")}</p><div class="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">${lesson.xp && lesson.xp > 0 ? XPBadge({ xp: lesson.xp, size: "sm" }) : ""}${lesson.estimatedMinutes ? `<span class="inline-flex items-center gap-1">${icon("clock", "h-3 w-3")}${lesson.estimatedMinutes} min</span>` : ""}</div></div>${icon("chevron-right", `h-4 w-4 mt-1 flex-shrink-0 transition-colors ${isCompleted ? "text-emerald-500" : "text-[var(--color-text-muted)] group-hover:text-emerald-500"}`)}</div></a>`;
  }).join("");
  return `<section class="glass rounded-xl p-5 md:p-6 border border-[var(--color-border-subtle)]"><div class="flex items-center gap-3 mb-5"><span class="flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold" style="background-color:${color}15;color:${color}">${chIndex + 1}</span><div class="flex-1 min-w-0"><h2 class="text-lg md:text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">${escapeHtml(chapter.title)}</h2><div class="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]"><span>${chapter.lessons.length} ${escapeHtml(lessonsUnit(chapter.lessons.length))}</span><span>·</span><span>${chCompleted}/${chapter.lessons.length}</span>${chProgress > 0 ? `<span class="text-emerald-500 font-medium">(${chProgress}%)</span>` : ""}</div></div></div>${chapter.lessons.length > 1 ? `<div class="mb-4 h-1.5 rounded-full bg-[var(--color-input-bg)] overflow-hidden"><div class="h-full rounded-full bg-emerald-500/60 transition-all" style="width:${chProgress}%"></div></div>` : ""}<div class="space-y-2.5 relative"><div class="absolute left-[19px] top-3 bottom-3 w-px bg-[var(--color-border-subtle)]" aria-hidden="true"></div>${lessons}</div></section>`;
}

function gamificationSection(course, completedCount) {
  return `<section class="mt-16 glass rounded-xl p-6 md:p-8 border border-[var(--color-border-subtle)]"><div class="flex items-center gap-2 mb-4">${icon("trophy", "h-5 w-5 text-amber-500")}<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">${escapeHtml(t("programming.gamification.title"))}</h2></div><p class="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mb-6">${escapeHtml(t("programming.gamification.description"))}</p><div class="grid grid-cols-1 md:grid-cols-3 gap-4"><div class="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">${icon("bar-chart-3", "h-5 w-5 text-emerald-500 mb-2")}<h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-1">${escapeHtml(t("programming.gamification.progress"))}</h3><p class="text-xs text-[var(--color-text-secondary)]">Sleduj svůj postup v každé kapitole a lekci.</p></div><div class="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">${icon("star", "h-5 w-5 text-amber-500 mb-2")}<h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-1">${escapeHtml(t("programming.gamification.achievements"))}</h3><p class="text-xs text-[var(--color-text-secondary)]">Získávej odměny za dokončení kurzů a cvičení.</p></div><div class="rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4">${icon("sparkles", "h-5 w-5 text-sky-500 mb-2")}<h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Level systém</h3><p class="text-xs text-[var(--color-text-secondary)]">Čím více se učíš, tím vyšší level dosáhneš.</p></div></div><div class="mt-6 flex items-center gap-4 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] p-4"><div class="h-14 w-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"><span class="text-lg font-bold text-emerald-500">${Math.floor(completedCount / 5) + 1}</span></div><div><p class="text-sm font-semibold text-[var(--color-text-primary)]">${escapeHtml(completedCount < 5 ? t("programming.gamification.level.beginner") : completedCount < 15 ? "Pokročilý" : "Expert")}</p><p class="text-xs text-[var(--color-text-secondary)] mt-0.5">${completedCount % 5} / 5 XP do dalšího levelu</p></div></div></section>`;
}

function whySection(course) {
  const isAI = course.category === "ai";
  const title = isAI ? "Proč se učit AI gramotnosti?" : t("programming.why.title");
  const cards = isAI
    ? [{ ic: "zap", c: "text-emerald-500", h: "Efektivita práce", p: "AI nástroje ti pomohou automatizovat rutinní úkoly, zrychlit práci a zlepšit výsledky v jakémkoli oboru." }, { ic: "trending-up", c: "text-sky-500", h: "Budoucnost profesí", p: "AI mění pracovní trh. Kdo rozumí AI, má konkurenční výhodu a lepší vyhlídky na kariérní růst." }, { ic: "brain", c: "text-purple-500", h: "Kritické myšlení", p: "AI gramotnost tě naučí kriticky hodnotit informace, rozpoznávat bias a ověřovat fakta v AI generovaném obsahu." }]
    : [{ ic: "zap", c: "text-emerald-500", h: t("programming.why.future.title"), p: t("programming.why.future.text") }, { ic: "trending-up", c: "text-sky-500", h: t("programming.why.logic.title"), p: t("programming.why.logic.text") }, { ic: "brain", c: "text-purple-500", h: t("programming.why.create.title"), p: t("programming.why.create.text") }];
  return `<section class="mt-16"><h2 class="text-xl font-semibold text-[var(--color-text-primary)] mb-6">${escapeHtml(title)}</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${cards.map((c) => `<div class="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-5 hover:border-emerald-500/20 transition-colors">${icon(c.ic, `h-5 w-5 ${c.c} mb-3`)}<h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-2">${escapeHtml(c.h)}</h3><p class="text-xs text-[var(--color-text-secondary)] leading-relaxed">${escapeHtml(c.p)}</p></div>`).join("")}</div></section>`;
}

function notFound(slug) {
  setBreadcrumbs([{ label: "Dashboard", href: "/dashboard/" }, { label: "Kurz" }]);
  $("#app").innerHTML = `<div class="max-w-xl mx-auto p-16 text-center"><div class="text-6xl font-bold gradient-text mb-4">404</div><p class="text-muted mb-6">Kurz „${escapeHtml(slug)}" nebyl nalezen.</p><a href="/dashboard/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a></div>`;
}
