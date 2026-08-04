// Vlastní bloky – port BlockRenderer + Quiz/Multiple/Match/Order/Timeline + Attribution

import { icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { codeBlockHTML } from "./code-block.js";
import { mountOpenCard } from "./exercise.js";

const headingClasses = {
  1: "text-3xl md:text-4xl font-bold mb-6 mt-2 tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent",
  2: "text-xl md:text-2xl font-semibold mb-4 mt-10 tracking-tight text-[var(--color-text-primary)]",
  3: "text-lg font-semibold mb-3 mt-6 text-[var(--color-text-primary)]",
};
const calloutIcons = { info: "info", warning: "alert-triangle", tip: "lightbulb" };

function staticBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h${block.level} class="${headingClasses[block.level] || headingClasses[3]}">${escapeHtml(block.text)}</h${block.level}>`;
    case "paragraph":
      return `<p class="text-base leading-7 text-[var(--color-text-secondary)] mb-4 text-balance">${escapeHtml(block.text)}</p>`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const style = block.ordered ? "list-decimal" : "list-disc";
      return `<${tag} class="mb-6 pl-5 text-[var(--color-text-secondary)] ${style}">${block.items.map((it) => `<li class="mb-2 leading-7 pl-1">${escapeHtml(it)}</li>`).join("")}</${tag}>`;
    }
    case "code":
      return codeBlockHTML(block.code, block.language);
    case "callout": {
      const ic = calloutIcons[block.variant] || calloutIcons.tip;
      return `<div class="my-6 rounded-lg border-l-4 border-emerald-500/50 bg-emerald-500/[0.03] p-4 flex gap-3">${icon(ic, "h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-500")}<p class="text-sm leading-6 text-[var(--color-text-secondary)]">${escapeHtml(block.text)}</p></div>`;
    }
    case "timeline":
      return `<div class="my-6 relative pl-6 border-l-2 border-[var(--color-border-subtle)]">${block.items.map((item) => `<div class="relative mb-6 last:mb-0"><span class="absolute -left-[31px] top-0 h-5 w-5 rounded-full bg-emerald-500 border-4 border-[var(--color-background)]"></span><div class="text-sm font-semibold text-emerald-500 mb-1">${escapeHtml(item.year)}</div><p class="text-sm leading-6 text-[var(--color-text-secondary)]">${escapeHtml(item.description)}</p></div>`).join("")}</div>`;
    default:
      return "";
  }
}

function optionBtn(i, { classes, badge, label, disabled }) {
  return `<button data-i="${i}" ${disabled ? "disabled" : ""} class="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${classes}"><span class="h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badge}">${label}</span><span class="text-sm leading-5">${""}</span></button>`;
}

// ─── Quiz (single choice) ───
function mountQuizBlock(container, block) {
  const LETTERS = ["A", "B", "C", "D", "E", "F"];
  let selected = null, answered = false;
  function render() {
    const opts = block.options.map((opt, i) => {
      const isCorrect = answered && i === block.correctIndex;
      const isWrong = answered && selected === i && i !== block.correctIndex;
      let cls, badge, badgeInner;
      if (isCorrect) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; badgeInner = icon("check", "h-3.5 w-3.5"); }
      else if (isWrong) { cls = "border-red-500/50 bg-red-500/10 text-red-500"; badge = "bg-red-500/20 border-red-500/30 text-red-500"; badgeInner = icon("x", "h-3.5 w-3.5"); }
      else if (selected === i) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; badgeInner = LETTERS[i] || i + 1; }
      else { cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; badgeInner = LETTERS[i] || i + 1; }
      const dim = answered && selected !== i && i !== block.correctIndex ? "opacity-50" : "";
      return `<button data-i="${i}" ${answered ? "disabled" : ""} class="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${cls} ${dim}"><span class="h-7 w-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 border ${badge}">${badgeInner}</span><span class="text-sm leading-5">${escapeHtml(opt)}</span></button>`;
    }).join("");
    const explained = answered ? `<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mt-4"><p class="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(block.explanation)}</p></div><div class="mt-4"><button data-act="reset" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}Zkusit znovu</button></div>` : "";
    container.innerHTML = `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6"><div class="flex items-center gap-2 mb-4">${icon("check-square", "h-4 w-4 text-emerald-500")}<span class="text-sm font-medium text-[var(--color-text-primary)]">Kvíz</span></div><h3 class="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">${escapeHtml(block.question)}</h3><div class="space-y-2">${opts}</div>${explained}</div>`;
    container.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => { if (answered) return; selected = Number(b.dataset.i); answered = true; render(); }));
    const r = container.querySelector('[data-act="reset"]'); if (r) r.addEventListener("click", () => { selected = null; answered = false; render(); });
    renderIcons(container);
  }
  render();
}

// ─── Multiple choice ───
function mountMultipleBlock(container, block) {
  let selected = new Set(), answered = false;
  const correctSet = new Set(block.correctIndices);
  function render() {
    const opts = block.options.map((opt, i) => {
      const chosen = selected.has(i); const shouldBe = correctSet.has(i);
      const showCorrect = answered && shouldBe; const showWrong = answered && chosen && !shouldBe;
      let cls, badge;
      if (showCorrect) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; }
      else if (showWrong) { cls = "border-red-500/50 bg-red-500/10 text-red-500"; badge = "bg-red-500/20 border-red-500/30 text-red-500"; }
      else if (chosen) { cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"; badge = "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"; }
      else { cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"; badge = "bg-[var(--color-input-bg)] border-[var(--color-border-subtle)]"; }
      const dim = answered && !chosen && !shouldBe ? "opacity-50" : "";
      const inner = (chosen || showCorrect) ? icon("check-square", "h-3.5 w-3.5") : "";
      return `<button data-i="${i}" ${answered ? "disabled" : ""} class="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${cls} ${dim}"><span class="h-7 w-7 rounded-md flex items-center justify-center text-xs font-shrink-0 border ${badge}">${inner}</span><span class="text-sm leading-5">${escapeHtml(opt)}</span></button>`;
    }).join("");
    const allCorrect = answered && selected.size === correctSet.size && [...selected].every((s) => correctSet.has(s));
    const after = answered ? `<div class="mt-4 rounded-lg border p-3 text-sm leading-6 ${allCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}">${allCorrect ? `${icon("check", "inline h-4 w-4 mr-1 mb-0.5")}Správně! Všechny odpovědi jsou v pořádku.` : `${icon("x", "inline h-4 w-4 mr-1 mb-0.5")}Některé odpovědi nejsou správné. Správné jsou: ${block.correctIndices.map((i) => block.options[i]).join(", ")}.`}</div>${block.explanation ? `<div class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"><p class="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(block.explanation)}</p></div>` : ""}<div class="mt-4"><button data-act="reset" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}Zkusit znovu</button></div>` : `<div class="mt-4 flex justify-end"><button data-act="confirm" ${selected.size === 0 ? "disabled" : ""} class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors">${icon("check-circle-2", "h-4 w-4")}Potvrdit</button></div>`;
    container.innerHTML = `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6"><div class="flex items-center gap-2 mb-4">${icon("check-square", "h-4 w-4 text-emerald-500")}<span class="text-sm font-medium text-[var(--color-text-primary)]">Více správných odpovědí</span></div><h3 class="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">${escapeHtml(block.question)}</h3><div class="space-y-2">${opts}</div>${after}</div>`;
    container.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => { if (answered) return; const i = Number(b.dataset.i); const n = new Set(selected); n.has(i) ? n.delete(i) : n.add(i); selected = n; render(); }));
    const c = container.querySelector('[data-act="confirm"]'); if (c) c.addEventListener("click", () => { if (selected.size === 0) return; answered = true; render(); });
    const r = container.querySelector('[data-act="reset"]'); if (r) r.addEventListener("click", () => { selected = new Set(); answered = false; render(); });
    renderIcons(container);
  }
  render();
}

// ─── Match (spojovačka) ───
function mountMatchBlock(container, block) {
  let matches = new Map(); let answered = false; let selectedLeft = null;
  const shuffledRight = block.pairs.map((_, i) => i).sort(() => Math.random() - 0.5);
  function render() {
    const left = block.pairs.map((pair, i) => {
      const matchedEntry = [...matches.entries()].find(([, r]) => shuffledRight[r] === i);
      const matched = matchedEntry ? matchedEntry[0] : null;
      let cls;
      if (selectedLeft === i && matched === null) cls = "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
      else if (matched !== null) cls = "border-emerald-500/30 bg-emerald-500/5 text-emerald-600";
      else cls = "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]";
      return `<button data-left="${i}" ${answered ? "disabled" : ""} class="text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${cls}"><span class="font-medium">${escapeHtml(pair.left)}</span>${matched !== null ? `<span class="ml-2 text-xs text-emerald-500">↔ ${escapeHtml(block.pairs[matched].right)}</span>` : ""}</button>`;
    }).join("");
    const right = shuffledRight.map((origIdx, displayIdx) => {
      const used = [...matches.values()].includes(displayIdx);
      return `<button data-right="${displayIdx}" ${answered || used ? "disabled" : ""} class="text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${used ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 opacity-60" : "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-highlight)]"}">${escapeHtml(block.pairs[origIdx].right)}</button>`;
    }).join("");
    const after = answered ? `<div class="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-600">${icon("check", "inline h-4 w-4 mr-1 mb-0.5")}Hotovo! Spojovačka je vyřešena.</div><div class="mt-2"><button data-act="reset" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}Zkusit znovu</button></div>` : "";
    container.innerHTML = `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6"><div class="flex items-center gap-2 mb-4">${icon("link", "h-4 w-4 text-emerald-500")}<span class="text-sm font-medium text-[var(--color-text-primary)]">Spojovačka</span></div><h3 class="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">${escapeHtml(block.question)}</h3><div class="grid grid-cols-2 gap-4"><div class="flex flex-col gap-2">${left}</div><div class="flex flex-col gap-2">${right}</div></div>${after}</div>`;
    container.querySelectorAll("[data-left]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.left);
      const matchedEntry = [...matches.entries()].find(([, r]) => shuffledRight[r] === i);
      if (matchedEntry) { const n = new Map(matches); n.delete(matchedEntry[0]); matches = n; render(); return; }
      selectedLeft = i; render();
    }));
    container.querySelectorAll("[data-right]").forEach((b) => b.addEventListener("click", () => {
      if (selectedLeft === null) return; const displayIdx = Number(b.dataset.right);
      if (answered) return;
      const n = new Map(matches); n.set(selectedLeft, displayIdx); matches = n; selectedLeft = null;
      if (n.size === block.pairs.length) answered = true;
      render();
    }));
    const r = container.querySelector('[data-act="reset"]'); if (r) r.addEventListener("click", () => { matches = new Map(); answered = false; selectedLeft = null; render(); });
    renderIcons(container);
  }
  render();
}

// ─── Order (seřazovačka) ───
function mountOrderBlock(container, block) {
  let items = block.items.map((text, i) => ({ text, id: i, original: i })).sort(() => Math.random() - 0.5);
  let answered = false;
  function render() {
    const isCorrect = items.every((it, i) => it.original === block.correctOrder[i]);
    const rows = items.map((item, i) => {
      const correct = answered && item.original === block.correctOrder[i];
      let cls = answered ? (correct ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-red-500/30 bg-red-500/10 text-red-600") : "border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] text-[var(--color-text-secondary)]";
      const controls = !answered ? `<div class="flex items-center gap-1 shrink-0"><button data-up="${i}" ${i === 0 ? "disabled" : ""} class="p-1 rounded text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30">▲</button><button data-down="${i}" ${i === items.length - 1 ? "disabled" : ""} class="p-1 rounded text-[var(--color-text-muted)] hover:text-emerald-500 disabled:opacity-30">▼</button></div>` : "";
      return `<div class="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${cls}"><span class="text-xs font-semibold text-[var(--color-text-muted)] w-5 shrink-0">${i + 1}.</span><span class="flex-1">${escapeHtml(item.text)}</span>${controls}</div>`;
    }).join("");
    const after = answered ? `<div class="mt-4 rounded-lg border p-3 text-sm leading-6 ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}">${isCorrect ? `${icon("check", "inline h-4 w-4 mr-1 mb-0.5")}Správně! Pořadí je v pořádku.` : `${icon("x", "inline h-4 w-4 mr-1 mb-0.5")}Pořadí není správné. Zkus to znovu.`}</div>${block.explanation ? `<div class="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4"><p class="text-sm text-emerald-500 font-medium mb-1">Vysvětlení:</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(block.explanation)}</p></div>` : ""}<div class="mt-2"><button data-act="reset" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}Zkusit znovu</button></div>` : `<div class="mt-4 flex justify-end"><button data-act="check" class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">${icon("check-circle-2", "h-4 w-4")}Ověřit pořadí</button></div>`;
    container.innerHTML = `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5 my-6"><div class="flex items-center gap-2 mb-4">${icon("arrow-up-down", "h-4 w-4 text-emerald-500")}<span class="text-sm font-medium text-[var(--color-text-primary)]">Seřazovačka</span></div><h3 class="text-base font-medium leading-7 text-[var(--color-text-primary)] mb-4">${escapeHtml(block.question)}</h3><div class="flex flex-col gap-2">${rows}</div>${after}</div>`;
    container.querySelectorAll("[data-up]").forEach((b) => b.addEventListener("click", () => { const i = Number(b.dataset.up); if (answered || i === 0) return; swap(i, i - 1); }));
    container.querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => { const i = Number(b.dataset.down); if (answered || i === items.length - 1) return; swap(i, i + 1); }));
    const c = container.querySelector('[data-act="check"]'); if (c) c.addEventListener("click", () => { answered = true; render(); });
    const r = container.querySelector('[data-act="reset"]'); if (r) r.addEventListener("click", () => { items = block.items.map((text, i) => ({ text, id: i, original: i })).sort(() => Math.random() - 0.5); answered = false; render(); });
    renderIcons(container);
  }
  function swap(a, b) { const n = [...items]; [n[a], n[b]] = [n[b], n[a]]; items = n; render(); }
  render();
}

export function renderCustomBlocks(container, lesson) {
  const parts = [];
  const mounts = [];
  lesson.blocks.forEach((block, index) => {
    if (block.type === "quiz" || block.type === "multiple" || block.type === "match" || block.type === "order") {
      const id = `cb-${index}`;
      parts.push(`<div id="${id}"></div>`);
      mounts.push({ id, block });
    } else if (block.type === "open") {
      const id = `cb-${index}`;
      parts.push(`<div id="${id}"></div>`);
      mounts.push({ id, block });
    } else {
      parts.push(staticBlock(block));
    }
  });
  container.innerHTML = parts.join("");
  mounts.forEach(({ id, block }) => {
    const slot = container.querySelector(`#${id}`);
    if (!slot) return;
    if (block.type === "quiz") mountQuizBlock(slot, block);
    else if (block.type === "multiple") mountMultipleBlock(slot, block);
    else if (block.type === "match") mountMatchBlock(slot, block);
    else if (block.type === "order") mountOrderBlock(slot, block);
    else if (block.type === "open") mountOpenCard(slot, {
      exercise: { id: `custom-open-${id}`, title: block.title || "Cvičení", task: block.task, description: block.description, hint: block.hint, keywords: block.keywords, modelSolution: block.modelSolution },
      index: Number(id.replace("cb-", "")) + 1, completed: false, onComplete: null,
    });
  });
  renderIcons(container);
}

export function attributionHTML(lesson) {
  if (!lesson.author && (!lesson.sources || lesson.sources.length === 0)) return "";
  const isUrl = (s) => /^https?:\/\//.test(s);
  const author = lesson.author ? `<div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">${icon("user", "h-4 w-4 text-emerald-500 shrink-0")}<span><span class="text-[var(--color-text-muted)]">Autor: </span>${escapeHtml(lesson.author)}</span></div>` : "";
  const sources = (lesson.sources && lesson.sources.length > 0)
    ? `<div class="space-y-1.5"><div class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Zdroje</div>${lesson.sources.map((src) => `<div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">${icon("external-link", "h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0")}${isUrl(src) ? `<a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:text-emerald-400 hover:underline transition-colors break-all">${escapeHtml(src)}</a>` : `<span>${escapeHtml(src)}</span>`}</div>`).join("")}</div>`
    : "";
  return `<div class="mt-10 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] p-5"><div class="flex items-center gap-2 mb-4"><span class="text-sm font-semibold text-[var(--color-text-primary)]">Doložka</span></div><div class="space-y-3">${author}${sources}</div></div>`;
}
