// Vytvořit lekci – blokový editor (náhrada Tiptap editoru), port vytvorit/page.tsx

import { $, icon, escapeHtml, renderIcons, toast } from "../lib/dom.js";
import { setBreadcrumbs } from "../components/navbar.js";
import { addCustomLesson, generateSlug, saveDraft } from "../store/custom-lessons.js";
import { navigate } from "../router.js?v=20260824a";

const BLOCK_TYPES = [
  { type: "heading", label: "Nadpis", icon: "heading" },
  { type: "paragraph", label: "Odstavec", icon: "pilcrow" },
  { type: "list", label: "Seznam", icon: "list" },
  { type: "code", label: "Kód", icon: "code-2" },
  { type: "callout", label: "Callout", icon: "info" },
  { type: "quiz", label: "Kvíz (1 odpověď)", icon: "check-square" },
  { type: "multiple", label: "Více odpovědí", icon: "list-checks" },
  { type: "match", label: "Spojovačka", icon: "link" },
  { type: "order", label: "Seřazovačka", icon: "arrow-up-down" },
  { type: "open", label: "Otevřené cvičení", icon: "pencil" },
  { type: "timeline", label: "Časová osa", icon: "clock" },
];

const TYPE_LABELS = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.label]));

function defaultBlock(type) {
  switch (type) {
    case "heading": return { type, level: 2, text: "" };
    case "paragraph": return { type, text: "" };
    case "list": return { type, itemsText: "", ordered: false };
    case "code": return { type, language: "python", code: "" };
    case "callout": return { type, variant: "info", text: "" };
    case "quiz": return { type, question: "", optionsText: "", correctIndex: 0, explanation: "" };
    case "multiple": return { type, question: "", optionsText: "", correctIndicesText: "", explanation: "" };
    case "match": return { type, question: "", pairsText: "" };
    case "order": return { type, question: "", itemsText: "", correctOrderText: "", explanation: "" };
    case "open": return { type, title: "", task: "", description: "", hint: "", keywordsText: "", modelSolution: "" };
    case "timeline": return { type, itemsText: "" };
    default: return { type, text: "" };
  }
}

let state = { title: "", description: "", author: "", sourcesRaw: "", blocks: [] };
let autoSaveTimer = null;
let lastSaved = null;

const inputCls = "w-full rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors";

function field(tag, name, value, opts = {}) {
  const cls = opts.cls || inputCls;
  const placeholder = opts.placeholder ? `placeholder="${escapeHtml(opts.placeholder)}"` : "";
  const rows = opts.rows ? `rows="${opts.rows}"` : "";
  if (tag === "textarea") return `<textarea data-field="${name}" ${rows} class="${cls} resize-y" ${placeholder}>${escapeHtml(value)}</textarea>`;
  if (tag === "select") return `<select data-field="${name}" class="${cls}">${opts.options.map((o) => `<option value="${escapeHtml(o.value)}" ${String(value) === String(o.value) ? "selected" : ""}>${escapeHtml(o.label)}</option>`).join("")}</select>`;
  const type = opts.type || "text";
  return `<input data-field="${name}" type="${type}" value="${escapeHtml(value)}" class="${cls}" ${placeholder}/>`;
}

function blockBody(b) {
  switch (b.type) {
    case "heading": return `${field("select", "level", b.level, { options: [{ value: 1, label: "H1" }, { value: 2, label: "H2" }, { value: 3, label: "H3" }] })}${field("input", "text", b.text, { placeholder: "Text nadpisu" })}`;
    case "paragraph": return field("textarea", "text", b.text, { rows: 4, placeholder: "Text odstavce…" });
    case "list": return `${field("textarea", "itemsText", b.itemsText, { rows: 4, placeholder: "Jedna položka na řádek" })}<label class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-2"><input data-field="ordered" type="checkbox" ${b.ordered ? "checked" : ""} class="accent-emerald-500"/>Číslovaný</label>`;
    case "code": return `${field("input", "language", b.language, { placeholder: "jazyk (python, js…)" })}${field("textarea", "code", b.code, { rows: 5, placeholder: "Kód" })}`;
    case "callout": return `${field("select", "variant", b.variant, { options: [{ value: "info", label: "Info" }, { value: "warning", label: "Warning" }, { value: "tip", label: "Tip" }] })}${field("textarea", "text", b.text, { rows: 3, placeholder: "Text calloutu" })}`;
    case "quiz": return `${field("input", "question", b.question, { placeholder: "Otázka" })}${field("textarea", "optionsText", b.optionsText, { rows: 3, placeholder: "Možnosti – jedna na řádek" })}${field("input", "correctIndex", b.correctIndex, { type: "number", placeholder: "Index správné (0 = první)" })}${field("textarea", "explanation", b.explanation, { rows: 2, placeholder: "Vysvětlení" })}`;
    case "multiple": return `${field("input", "question", b.question, { placeholder: "Otázka" })}${field("textarea", "optionsText", b.optionsText, { rows: 3, placeholder: "Možnosti – jedna na řádek" })}${field("input", "correctIndicesText", b.correctIndicesText, { placeholder: "Správné indexy (0,2,3)" })}${field("textarea", "explanation", b.explanation, { rows: 2, placeholder: "Vysvětlení" })}`;
    case "match": return `${field("input", "question", b.question, { placeholder: "Otázka / instrukce" })}${field("textarea", "pairsText", b.pairsText, { rows: 4, placeholder: "pár na řádek: levá | pravá" })}`;
    case "order": return `${field("input", "question", b.question, { placeholder: "Otázka / instrukce" })}${field("textarea", "itemsText", b.itemsText, { rows: 4, placeholder: "Položky v náhodném pořadí – jedna na řádek" })}${field("input", "correctOrderText", b.correctOrderText, { placeholder: "Správné pořadí indexů (0,2,1,3)" })}${field("textarea", "explanation", b.explanation, { rows: 2, placeholder: "Vysvětlení" })}`;
    case "open": return `${field("input", "title", b.title, { placeholder: "Název cvičení" })}${field("textarea", "task", b.task, { rows: 2, placeholder: "Úkol / zadání" })}${field("textarea", "description", b.description, { rows: 2, placeholder: "Popis / kontext" })}${field("input", "keywordsText", b.keywordsText, { placeholder: "Klíčová slova (čárkou)" })}${field("textarea", "hint", b.hint, { rows: 2, placeholder: "Nápověda" })}${field("textarea", "modelSolution", b.modelSolution, { rows: 3, placeholder: "Vzorové řešení" })}`;
    case "timeline": return field("textarea", "itemsText", b.itemsText, { rows: 4, placeholder: "rok | popis – jedna na řádek" });
    default: return "";
  }
}

function blockCard(b, idx) {
  return `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-medium text-[var(--color-text-muted)] inline-flex items-center gap-2">${icon(BLOCK_TYPES.find((t) => t.type === b.type)?.icon || "square", "h-3.5 w-3.5")}${escapeHtml(TYPE_LABELS[b.type] || b.type)}</span>
      <div class="flex items-center gap-1">
        <button data-act="up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30" title="Nahoru">${icon("chevron-up", "h-4 w-4")}</button>
        <button data-act="down" data-idx="${idx}" ${idx === state.blocks.length - 1 ? "disabled" : ""} class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30" title="Dolů">${icon("chevron-down", "h-4 w-4")}</button>
        <button data-act="del" data-idx="${idx}" class="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-500" title="Smazat blok">${icon("trash-2", "h-4 w-4")}</button>
      </div>
    </div>
    <div class="space-y-2" data-blk="${idx}">${blockBody(b)}</div>
  </div>`;
}

export async function renderCreate() {
  setBreadcrumbs([{ label: "Domů", href: "/dashboard/" }, { label: "Lekce" }, { label: "Vytvořit vlastní" }]);
  const app = $("#app");
  app.innerHTML = `<div class="min-h-screen bg-[var(--color-background)]">
    <div class="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <a href="/dashboard/"><button class="bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] shadow-lg backdrop-blur rounded-md px-3 py-1.5 text-sm">Zrušit</button></a>
      <button id="create-save" class="bg-emerald-500 text-black font-semibold hover:bg-emerald-400 shadow-lg rounded-md px-4 py-1.5 text-sm gap-1.5 inline-flex items-center">${icon("save", "h-4 w-4")}Uložit lekci</button>
    </div>
    <main class="px-6 pt-6 pb-32">
      <div class="max-w-3xl mx-auto">
        <div class="mb-6"><a href="/dashboard/" class="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors mb-6">${icon("arrow-left", "h-4 w-4")}Zpět na přehled</a></div>
        <div id="create-msg"></div>
        <div class="mb-4 text-[11px] text-[var(--color-text-muted)] text-right" id="autosave-info"></div>
        <div class="mb-4"><input data-top="title" value="${escapeHtml(state.title)}" placeholder="Název lekce" class="w-full text-2xl md:text-3xl font-bold tracking-tight bg-transparent border-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"/></div>
        <div class="mb-6"><input data-top="description" value="${escapeHtml(state.description)}" placeholder="Krátký popis (volitelné)" class="w-full text-sm bg-transparent border-none text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"/></div>
        <div id="block-list" class="space-y-3 mb-4"></div>
        <div class="flex flex-wrap gap-2 mb-10">${BLOCK_TYPES.map((b) => `<button data-add="${b.type}" class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:border-emerald-500/30 hover:text-emerald-500 transition-colors">${icon(b.icon, "h-4 w-4")}${escapeHtml(b.label)}</button>`).join("")}</div>
        <div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5">
          <div class="flex items-center gap-2 mb-4"><span class="text-sm font-semibold text-[var(--color-text-primary)]">Doložka</span><span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Povinné</span></div>
          <div class="space-y-4">
            <div><label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Autor / Tvůrce lekce *</label><input data-top="author" value="${escapeHtml(state.author)}" placeholder="Jméno nebo přezdívka tvůrce" class="${inputCls}"/></div>
            <div><label class="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Zdroje a reference</label><textarea data-top="sourcesRaw" rows="3" placeholder="Každý zdroj na nový řádek (např. URL nebo název knihy)" class="${inputCls} resize-y">${escapeHtml(state.sourcesRaw)}</textarea></div>
          </div>
        </div>
      </div>
    </main>
  </div>`;

  renderBlockList();
  bindTopInputs();
  bindBlockList();
  app.querySelector("#create-save").addEventListener("click", handleSave);
  renderIcons(app);
  return null;
}

function renderBlockList() {
  const wrap = $("#block-list");
  if (state.blocks.length === 0) {
    wrap.innerHTML = `<div class="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-8 text-center text-sm text-[var(--color-text-muted)]">Začni přidáváním bloků níže.</div>`;
  } else {
    wrap.innerHTML = state.blocks.map((b, idx) => blockCard(b, idx)).join("");
  }
  renderIcons(wrap);
}

function bindTopInputs() {
  const app = $("#app");
  app.querySelectorAll("[data-top]").forEach((el) => {
    el.addEventListener("input", () => { state[el.dataset.top] = el.value; scheduleAutosave(); });
  });
}

function bindBlockList() {
  const wrap = $("#block-list");
  // Úpravy polí bloků
  wrap.addEventListener("input", onBlockField);
  wrap.addEventListener("change", onBlockField);
  // Strukturální akce
  wrap.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
    const idx = Number(b.dataset.idx);
    if (b.dataset.act === "up" && idx > 0) { [state.blocks[idx - 1], state.blocks[idx]] = [state.blocks[idx], state.blocks[idx - 1]]; }
    else if (b.dataset.act === "down" && idx < state.blocks.length - 1) { [state.blocks[idx + 1], state.blocks[idx]] = [state.blocks[idx], state.blocks[idx + 1]]; }
    else if (b.dataset.act === "del") { state.blocks.splice(idx, 1); }
    renderBlockList(); bindBlockList(); scheduleAutosave();
  }));
  // Přidávání bloků
  $("#app").querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => {
    state.blocks.push(defaultBlock(b.dataset.add));
    renderBlockList(); bindBlockList(); scheduleAutosave();
    $("#block-list").scrollIntoView({ behavior: "smooth", block: "end" });
  }));
}

function onBlockField(e) {
  const host = e.target.closest("[data-blk]");
  if (!host) return;
  const idx = Number(host.dataset.blk);
  const field = e.target.dataset.field;
  if (!field) return;
  const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
  state.blocks[idx][field] = val;
  scheduleAutosave();
}

function scheduleAutosave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveDraft({
      id: `draft-${Date.now()}`, slug: generateSlug(state.title || "Nepojmenovaná lekce"),
      title: state.title || "Nepojmenovaná lekce", description: state.description,
      category: "Ostatní", blocks: toCustomBlocks(), createdAt: new Date().toISOString(),
      author: state.author, sources: state.sourcesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    lastSaved = new Date();
    const info = $("#autosave-info");
    if (info) info.textContent = `Poslední uložení: ${lastSaved.toLocaleTimeString("cs-CZ")}`;
  }, 2000);
}

function toCustomBlocks() {
  return state.blocks.map((b) => {
    const lines = (t) => t.split("\n").map((s) => s.trim()).filter(Boolean);
    switch (b.type) {
      case "heading": return { type: "heading", level: Number(b.level) || 2, text: b.text };
      case "paragraph": return { type: "paragraph", text: b.text };
      case "list": return { type: "list", items: lines(b.itemsText), ordered: !!b.ordered };
      case "code": return { type: "code", language: b.language || "text", code: b.code };
      case "callout": return { type: "callout", variant: b.variant || "info", text: b.text };
      case "quiz": return { type: "quiz", question: b.question, options: lines(b.optionsText), correctIndex: Number(b.correctIndex) || 0, explanation: b.explanation };
      case "multiple": return { type: "multiple", question: b.question, options: lines(b.optionsText), correctIndices: (b.correctIndicesText || "").split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)), explanation: b.explanation };
      case "match": return { type: "match", question: b.question, pairs: lines(b.pairsText).map((l) => { const [left, ...r] = l.split("|"); return { left: (left || "").trim(), right: r.join("|").trim() }; }).filter((p) => p.left && p.right) };
      case "order": return { type: "order", question: b.question, items: lines(b.itemsText), correctOrder: (b.correctOrderText || "").split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)), explanation: b.explanation };
      case "open": return { type: "open", title: b.title, task: b.task, description: b.description, hint: b.hint || undefined, keywords: (b.keywordsText || "").split(",").map((s) => s.trim()).filter(Boolean), modelSolution: b.modelSolution || undefined };
      case "timeline": return { type: "timeline", items: lines(b.itemsText).map((l) => { const [y, ...r] = l.split("|"); return { year: (y || "").trim(), description: r.join("|").trim() }; }).filter((p) => p.year || p.description) };
      default: return null;
    }
  }).filter(Boolean);
}

function handleSave() {
  const msg = $("#create-msg");
  if (state.blocks.length === 0) { showMsg("error", "Přidej alespoň jeden blok obsahu."); return; }
  const blocks = toCustomBlocks().filter((b) => {
    if (b.type === "paragraph" || b.type === "heading") return b.text && b.text.trim();
    if (b.type === "callout") return b.text && b.text.trim();
    if (b.type === "list") return b.items.length > 0;
    if (b.type === "code") return b.code && b.code.trim();
    if (b.type === "quiz" || b.type === "multiple") return b.question && b.options.length > 0;
    if (b.type === "match") return b.pairs.length > 0;
    if (b.type === "order") return b.items.length > 0;
    if (b.type === "open") return b.task && b.task.trim();
    if (b.type === "timeline") return b.items.length > 0;
    return false;
  });
  if (blocks.length === 0) { showMsg("error", "Lekce nemůže být prázdná."); return; }
  if (!state.author.trim()) { showMsg("error", "Vyplň autora / tvůrce lekce (povinná doložka)."); return; }

  const title = state.title.trim() || "Nepojmenovaná lekce";
  const lesson = {
    id: `custom-${Date.now()}`, slug: generateSlug(title), title,
    description: state.description.trim(), category: "Ostatní", blocks,
    createdAt: new Date().toISOString(), author: state.author.trim(),
    sources: state.sourcesRaw.split("\n").map((s) => s.trim()).filter(Boolean),
  };
  addCustomLesson(lesson);
  showMsg("success", "Lekce byla uložena. Přesměrovávám zpět…");
  toast("Lekce byla uložena!", "success");
  setTimeout(() => navigate("/dashboard/", { replace: true }), 1200);
}

function showMsg(type, text) {
  const msg = $("#create-msg");
  if (!msg) return;
  const cls = type === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" : "border-red-500/20 bg-red-500/10 text-red-600";
  msg.innerHTML = `<div class="mb-6 rounded-xl border ${cls} p-4 flex items-center gap-3 text-sm font-medium">${icon(type === "success" ? "check-circle" : "alert-triangle", "h-5 w-5 shrink-0")}${escapeHtml(text)}</div>`;
  renderIcons(msg);
}
