// Moje lekce – port LessonDetailClient.tsx

import { $, icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { getCustomLesson, deleteCustomLesson } from "../store/custom-lessons.js";
import { renderCustomBlocks, attributionHTML } from "../components/custom-blocks.js";
import { navigate } from "../router.js?v=20260824a";
import { toast } from "../lib/dom.js";

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" }); } catch { return iso; }
}

export async function renderMyLesson(query) {
  const slug = query && query.slug;
  setBreadcrumbs([{ label: "Domů", href: "/dashboard/" }, { label: "Lekce", href: "/dashboard/" }, { label: "Moje lekce" }]);
  const app = $("#app");

  if (!slug) { app.innerHTML = notFoundHTML(); renderIcons(app); return null; }
  const lesson = getCustomLesson(slug);
  if (!lesson) { app.innerHTML = notFoundHTML(); renderIcons(app); return null; }

  setBreadcrumbs([{ label: "Domů", href: "/dashboard/" }, { label: "Lekce", href: "/dashboard/" }, { label: lesson.title }]);

  app.innerHTML = `<div class="min-h-screen bg-[var(--color-background)]">
    <main class="max-w-3xl mx-auto px-6 py-10">
      <div class="mb-8">
        <a href="/dashboard/" class="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors mb-4">${icon("arrow-left", "h-4 w-4")}Zpět na přehled</a>
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2"><span class="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">${escapeHtml(lesson.category || "Ostatní")}</span><span class="text-[var(--color-text-muted)]">•</span><span class="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">${icon("calendar", "h-3 w-3")}${escapeHtml(formatDate(lesson.createdAt))}</span></div>
            <h1 class="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">${escapeHtml(lesson.title)}</h1>
            ${lesson.description ? `<p class="text-sm text-[var(--color-text-muted)] mt-2">${escapeHtml(lesson.description)}</p>` : ""}
          </div>
          <button id="ml-delete" class="text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 h-8 w-8 rounded-md flex items-center justify-center shrink-0" title="Smazat lekci">${icon("trash-2", "h-4 w-4")}</button>
        </div>
      </div>
      <article id="ml-article" class="flex flex-col gap-2"></article>
      <div id="ml-attribution"></div>
    </main>
  </div>`;

  renderCustomBlocks(app.querySelector("#ml-article"), lesson);
  app.querySelector("#ml-attribution").innerHTML = attributionHTML(lesson);

  app.querySelector("#ml-delete").addEventListener("click", () => {
    if (!confirm("Opravdu smazat tuto lekci?")) return;
    deleteCustomLesson(lesson.slug);
    toast("Lekce smazána.", "success");
    navigate("/dashboard/", { replace: true });
  });

  renderIcons(app);
  return null;
}

function notFoundHTML() {
  return `<div class="max-w-xl mx-auto p-16 text-center"><div class="text-6xl font-bold gradient-text mb-4">404</div><p class="text-muted mb-6">Lekce nebyla nalezena.</p><a href="/dashboard/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">Zpět domů</a></div>`;
}
