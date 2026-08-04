// Lekce – port LessonContentClient.tsx (+ layout bez AI tutora)

import { $, icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { getLessonBySlug } from "../lib/api.js";
import { getProgress, completeLesson, completeExercise, isLessonCompleted } from "../store/progress.js";
import { setLastVisited } from "../store/progress.js";
import { t, lessonsUnit } from "../store/lang.js";
import { XPBadge } from "../components/ui.js";
import { renderLessonContent } from "../components/lesson-content.js";
import { mountExerciseList } from "../components/exercise.js";
import { mountQuiz } from "../components/quiz.js";

function diffStyle(d) {
  const map = { beginner: ["#00d084", "rgba(0,208,132,0.12)", "rgba(0,208,132,0.15)"], advanced: ["#f0ad4e", "rgba(240,173,78,0.12)", "rgba(240,173,78,0.15)"], expert: ["#d73a49", "rgba(215,58,73,0.12)", "rgba(215,58,73,0.15)"] };
  const m = map[d] || map.beginner;
  return `color:${m[0]};background-color:${m[1]};border-color:${m[2]}`;
}
function diffLabel(d) { return d === "beginner" ? t("programming.difficulty.beginner") : d === "advanced" ? t("programming.difficulty.advanced") : t("programming.difficulty.expert"); }

export async function renderLesson(slug) {
  const result = await getLessonBySlug(slug);
  if (!result) { notFound(slug); return null; }
  const { lesson, course, chapter, lessonNumber, chapterIndex, prev, next } = result;
  setLastVisited(slug);

  const isProgramming = course.category === "programovani";
  setBreadcrumbs([
    { label: "Dashboard", href: "/dashboard/" },
    ...(isProgramming ? [{ label: t("nav.programming"), href: "/programovani/" }] : []),
    { label: course.title, href: `/kurzy/${course.slug}/` },
    { label: chapter.title },
  ]);

  const app = $("#app");
  app.innerHTML = `<div class="flex flex-col lg:flex-row min-h-full"></div>`;
  const root = app.firstElementChild;
  await paint(root, { slug, lesson, course, chapter, lessonNumber, chapterIndex, prev, next });
  renderIcons(app);
  return null;
}

async function paint(root, ctx) {
  const { slug, lesson, course, chapter, lessonNumber, chapterIndex, prev, next } = ctx;
  const progress = getProgress();
  const completed = progress.completedLessons;
  const isCompleted = completed.includes(slug);
  const exercises = lesson.exercises || [];
  const completedExercises = exercises.filter((e) => progress.completedExercises[e.id]).map((e) => e.id);
  const outline = (lesson.content || []).filter((b) => b.type === "heading" && b.level === 2).map((b) => b.text);
  const totalLessons = course.chapters.reduce((s, ch) => s + ch.lessons.length, 0);
  const courseCompleted = course.chapters.reduce((s, ch) => s + ch.lessons.filter((l) => completed.includes(l.slug)).length, 0);
  const coursePercent = totalLessons > 0 ? Math.round((courseCompleted / totalLessons) * 100) : 0;
  const currentChapter = course.chapters[chapterIndex];
  const xp = lesson.xp || 0;
  const est = lesson.estimatedMinutes || 15;

  root.innerHTML = `
    <div class="flex-1 min-w-0">
      <div class="sticky top-14 z-20 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border-subtle)]">
        <div class="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] overflow-hidden"><a href="/kurzy/${course.slug}/" class="hover:text-emerald-500 transition-colors shrink-0">${escapeHtml(course.title)}</a>${icon("chevron-right", "h-3 w-3 shrink-0")}<span class="truncate">${escapeHtml(chapter.title)}</span></div>
          <div class="flex items-center gap-3 shrink-0"><span class="text-xs text-[var(--color-text-muted)]">${escapeHtml(t("lesson.of"))} ${lessonNumber} / ${totalLessons}</span><a href="/kurzy/${course.slug}/" class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="${escapeHtml(t("lesson.close"))}">${icon("x", "h-4 w-4")}</a></div>
        </div>
      </div>
      <div class="max-w-3xl mx-auto px-6 pt-8 pb-4">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-emerald-500 bg-clip-text text-transparent mb-3">${escapeHtml(lesson.title)}</h1>
        <div class="flex items-center gap-3 flex-wrap text-[13px] text-[var(--color-text-muted)]">
          <span class="inline-flex items-center gap-1">${icon("clock", "h-3.5 w-3.5")}${est} ${escapeHtml(t("lesson.estimatedTime"))}</span>
          ${xp > 0 ? XPBadge({ xp, size: "sm" }) : ""}
          ${course.difficulty ? `<span class="text-[10px] px-2 py-0.5 rounded-full font-medium border" style="${diffStyle(course.difficulty)}">${escapeHtml(diffLabel(course.difficulty))}</span>` : ""}
          ${isCompleted ? `<span class="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">${icon("check-circle-2", "h-3.5 w-3.5")}${escapeHtml(t("lesson.completed"))}</span>` : ""}
        </div>
      </div>
      <div class="max-w-3xl mx-auto px-6"><div class="h-px bg-[var(--color-border-subtle)] mb-8"></div></div>
      <div id="lesson-content" class="max-w-3xl mx-auto px-6 py-8 md:py-12"></div>
      <div id="lesson-exercises"></div>
      ${!isCompleted ? `<div class="max-w-3xl mx-auto px-6 mt-10"><button id="complete-btn" class="w-full py-3 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">${icon("list-checks", "h-4 w-4")}${escapeHtml(t("lesson.complete"))}${xp > 0 ? `<span class="text-emerald-100 text-sm">(+${xp} XP)</span>` : ""}</button></div>` : ""}
      <div id="lesson-quiz"></div>
      <div class="max-w-3xl mx-auto px-6 mt-12 mb-8"><div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${prev ? prevNextCard(prev, true) : "<div></div>"}${next ? prevNextCard(next, false) : "<div></div>"}</div></div>
    </div>
    <div class="hidden lg:block w-[340px] flex-shrink-0 border-l border-[var(--color-border-subtle)] bg-[var(--color-background)]"><div class="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto"><div class="p-5 space-y-6">
      <div class="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4"><h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">${escapeHtml(course.title)}</h3><div class="mb-2"><div class="h-2 rounded-full bg-[var(--color-input-bg)] overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${coursePercent}%"></div></div></div><p class="text-xs text-[var(--color-text-muted)]">${courseCompleted}/${totalLessons} ${escapeHtml(lessonsUnit(totalLessons))} ${escapeHtml(t("exercise.completed")).toLowerCase()}</p></div>
      ${currentChapter ? chapterListCard(currentChapter, chapterIndex, slug, completed) : ""}
      ${outline.length > 0 ? `<div class="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4"><h4 class="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Obsah lekce</h4><div class="space-y-1">${outline.map((h) => `<div class="text-xs text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors cursor-default truncate">${escapeHtml(h)}</div>`).join("")}</div></div>` : ""}
    </div></div></div>
  `;

  // Obsah
  renderLessonContent(root.querySelector("#lesson-content"), lesson.content || []);

  // Cvičení
  if (exercises.length > 0) {
    const exWrap = root.querySelector("#lesson-exercises");
    if (exercises.length > 0) {
      exWrap.innerHTML = `<div class="max-w-3xl mx-auto px-6 mt-8"><div class="h-px bg-[var(--color-border-subtle)] mb-8"></div><div id="lesson-exercises-inner"></div></div>`;
      mountExerciseList(exWrap.querySelector("#lesson-exercises-inner"), {
        exercises, completedIds: completedExercises, courseLanguage: course.language,
        onComplete: (id) => handleExerciseComplete(id, slug, exercises, root, ctx),
      });
    }
  }

  // Kvíz
  const quizQuestions = lesson.quiz || [];
  if (quizQuestions.length > 0) {
    const quizWrap = root.querySelector("#lesson-quiz");
    quizWrap.innerHTML = `<div class="max-w-3xl mx-auto px-6 mt-10"><div class="h-px bg-[var(--color-border-subtle)] mb-8"></div><div id="lesson-quiz-inner"></div></div>`;
    mountQuiz(quizWrap.querySelector("#lesson-quiz-inner"), quizQuestions);
  }

  const cb = root.querySelector("#complete-btn");
  if (cb) cb.addEventListener("click", () => { if (!isLessonCompleted(slug)) completeLesson(slug); paint(root, ctx); renderIcons(root); });

  renderIcons(root);
}

function prevNextCard(l, isPrev) {
  return `<a href="/lekce/${l.slug}/" class="group flex items-center ${isPrev ? "" : "justify-end"} gap-3 p-4 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] hover:border-emerald-500/30 transition-colors ${isPrev ? "" : "text-right"}">${isPrev ? icon("chevron-left", "h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0") : ""}<div class="min-w-0"><p class="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">${escapeHtml(isPrev ? t("lesson.prev") : t("lesson.next"))}</p><p class="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-emerald-500 transition-colors">${escapeHtml(l.title)}</p></div>${!isPrev ? icon("chevron-right", "h-4 w-4 text-[var(--color-text-muted)] group-hover:text-emerald-500 transition-colors shrink-0") : ""}</a>`;
}

function chapterListCard(currentChapter, chapterIndex, slug, completed) {
  const items = currentChapter.lessons.map((l, idx) => {
    const lCompleted = completed.includes(l.slug);
    const lCurrent = l.slug === slug;
    let cls, nodeIcon;
    if (lCurrent) { cls = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"; nodeIcon = icon("circle", "h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20"); }
    else if (lCompleted) { cls = "text-[var(--color-text-secondary)] hover:bg-[var(--color-input-bg)]"; nodeIcon = icon("check-circle-2", "h-3.5 w-3.5 text-emerald-500"); }
    else { cls = "text-[var(--color-text-muted)] hover:bg-[var(--color-input-bg)]"; nodeIcon = icon("circle", "h-3.5 w-3.5 text-[var(--color-border-subtle)]"); }
    return `<a href="/lekce/${l.slug}/" class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${cls}"><span class="flex-shrink-0">${nodeIcon}</span><span class="truncate text-xs">${idx + 1}. ${escapeHtml(l.title)}</span></a>`;
  }).join("");
  return `<div class="rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-4"><div class="flex items-center gap-2 mb-3">${icon("book-open", "h-4 w-4 text-[var(--color-text-muted)]")}<h4 class="text-sm font-semibold text-[var(--color-text-primary)]">${chapterIndex + 1}. ${escapeHtml(currentChapter.title)}</h4></div><div class="space-y-1">${items}</div></div>`;
}

function handleExerciseComplete(id, slug, exercises, root, ctx) {
  if (!getProgress().completedExercises[id]) completeExercise(id);
  const progress = getProgress();
  const allDone = exercises.every((e) => progress.completedExercises[e.id]);
  if (allDone && !isLessonCompleted(slug)) {
    completeLesson(slug);
    paint(root, ctx);
    renderIcons(root);
  }
}

function notFound(slug) {
  setBreadcrumbs([{ label: "Dashboard", href: "/dashboard/" }, { label: "Lekce" }]);
  $("#app").innerHTML = `<div class="max-w-xl mx-auto p-16 text-center"><div class="text-6xl font-bold gradient-text mb-4">404</div><p class="text-muted mb-6">Lekce „${escapeHtml(slug)}" nebyla nalezena.</p><a href="/dashboard/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a></div>`;
}
