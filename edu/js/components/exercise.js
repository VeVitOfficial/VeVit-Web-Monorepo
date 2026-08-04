// Cvičení – port ExerciseList/ExerciseCard/CodeExerciseCard

import { icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { t } from "../store/lang.js";
import { XPBadge } from "./ui.js";

const LANG_LABELS = {
  javascript: "JavaScript", python: "Python", java: "Java", cpp: "C++", csharp: "C#",
  go: "Go", rust: "Rust", kotlin: "Kotlin", swift: "Swift", ruby: "Ruby", php: "PHP",
  typescript: "TypeScript", html: "HTML/CSS", sql: "SQL", bash: "Bash",
  dockerfile: "Dockerfile", git: "Git", "html-css": "HTML/CSS", "terminal-bash": "Bash",
};
function langLabel(l) { return LANG_LABELS[(l || "").toLowerCase()] || l || ""; }

function starterCode(ex) {
  if (ex.modelSolution) return `// ${ex.title}\n// Napiš své řešení níže...\n\n`;
  return `// ${ex.title}\n// Zde napiš svůj kód...\n`;
}

// Spuštění JS kódu v iframe sandboxu – port runJSInSandbox
function runJSInSandbox(code) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.setAttribute("sandbox", "allow-scripts");
    document.body.appendChild(iframe);
    const start = performance.now();
    const output = [];
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; cleanup(); resolve({ output, error: "Timeout: Kód běžel déle než 3 sekundy.", duration: 3000 }); }
    }, 3000);
    function cleanup() { clearTimeout(timeout); if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }
    const sandboxHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><script>
      const logs=[];const origLog=console.log;console.log=function(){logs.push([].slice.call(arguments).map(function(a){return typeof a==='object'?JSON.stringify(a):String(a)}).join(' '));origLog.apply(console,arguments);};
      console.error=function(){logs.push('[ERROR] '+[].slice.call(arguments).map(String).join(' '));};console.warn=function(){logs.push('[WARN] '+[].slice.call(arguments).map(String).join(' '));};
      window.addEventListener('error',function(e){logs.push('[ERROR] '+e.message);});
      window.addEventListener('load',function(){try{${code.replace(/\/\/.*$/gm, "")}}catch(err){logs.push('[ERROR] '+err.message);}window.parent.postMessage({type:'sandbox-result',logs:logs},'*');});
    <\/script></head><body></body></html>`;
    const blob = new Blob([sandboxHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    const handler = (event) => {
      if (event.data && event.data.type === "sandbox-result") {
        if (!resolved) { resolved = true; cleanup(); URL.revokeObjectURL(url); resolve({ output: event.data.logs || [], duration: Math.round(performance.now() - start) }); }
      }
    };
    window.addEventListener("message", handler);
  });
}

// ─── Otevřené cvičení (textová odpověď) ───
export function mountOpenCard(container, { exercise, index, completed, onComplete }) {
  let answer = "", checked = completed, showHint = false, showSolution = false;

  function render() {
    const keywords = exercise.keywords || [];
    const matched = keywords.filter((kw) => answer.toLowerCase().includes(kw.toLowerCase()));
    const hasKeywords = keywords.length > 0;
    const isGoodMatch = hasKeywords && matched.length >= Math.ceil(keywords.length / 2);
    const done = completed || checked;

    let body;
    if (!checked) {
      body = `<div class="space-y-3"><textarea data-field="answer" rows="4" class="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-y" placeholder="${escapeHtml(t("exercise.typeAnswer"))}">${escapeHtml(answer)}</textarea><div class="flex items-center gap-2"><button data-act="check" ${answer.trim().length === 0 ? "disabled" : ""} class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors">${icon("check-circle-2", "h-4 w-4")}${escapeHtml(t("exercise.check"))}</button>${exercise.hint ? `<button data-act="hint" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("lightbulb", "h-4 w-4")}${escapeHtml(showHint ? t("exercise.hideHint") : t("exercise.hint"))}</button>` : ""}</div>${showHint && exercise.hint ? `<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600 leading-6">${icon("lightbulb", "inline h-4 w-4 mr-1 mb-0.5")}${escapeHtml(exercise.hint)}</div>` : ""}</div>`;
    } else {
      const ok = isGoodMatch || !hasKeywords;
      let msg;
      if (isGoodMatch) msg = `${icon("check-circle-2", "inline h-4 w-4 mr-1 mb-0.5")}${escapeHtml(t("exercise.completed"))}. ${matched.length}/${keywords.length} ${escapeHtml(t("exercise.keywordsFound"))}.`;
      else if (!hasKeywords) msg = `${icon("check-circle-2", "inline h-4 w-4 mr-1 mb-0.5")}${escapeHtml(t("exercise.completed"))}. ${escapeHtml(t("exercise.showSolution"))}.`;
      else msg = `${escapeHtml(t("exercise.notCompleted"))}. ${matched.length}/${keywords.length} ${escapeHtml(t("exercise.keywordsFound"))}.`;
      const solution = exercise.modelSolution ? `<div class="space-y-2"><button data-act="solution" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("eye", "h-4 w-4")}${escapeHtml(showSolution ? t("exercise.hideSolution") : t("exercise.showSolution"))}</button>${showSolution ? `<div class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-4 text-sm text-[var(--color-text-secondary)] leading-6 whitespace-pre-wrap">${escapeHtml(exercise.modelSolution)}</div>` : ""}</div>` : "";
      body = `<div class="space-y-4"><div class="rounded-lg border p-3 text-sm leading-6 ${ok ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600" : "border-amber-500/20 bg-amber-500/5 text-amber-600"}">${msg}</div>${solution}<div class="flex items-center gap-2 pt-2"><button data-act="reset" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">${icon("rotate-ccw", "h-4 w-4")}${escapeHtml(t("quiz.retry"))}</button></div></div>`;
    }

    container.innerHTML = `<div class="glass glow-border overflow-hidden rounded-xl border border-[var(--color-glass-border)]"><div class="p-6 pb-3"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">${index}</span><h4 class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(exercise.title)}</h4></div>${done ? icon("check-circle-2", "h-4 w-4 text-emerald-500") : ""}</div></div><div class="px-6 pb-6 space-y-4"><div class="space-y-2"><p class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(exercise.task)}</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(exercise.description)}</p></div>${body}</div></div>`;

    const ta = container.querySelector('[data-field="answer"]');
    if (ta) ta.addEventListener("input", (e) => { answer = e.target.value; const cb = container.querySelector('[data-act="check"]'); if (cb) cb.disabled = answer.trim().length === 0; });
    bind("check", () => { if (!checked) { checked = true; onComplete && onComplete(); } render(); });
    bind("hint", () => { showHint = !showHint; render(); });
    bind("solution", () => { showSolution = !showSolution; render(); });
    bind("reset", () => { checked = false; showSolution = false; answer = ""; render(); });
    renderIcons(container);

    function bind(act, fn) { const b = container.querySelector(`[data-act="${act}"]`); if (b) b.addEventListener("click", fn); }
  }
  render();
}

// ─── Kódové cvičení ───
function mountCodeCard(container, { exercise, index, completed, onComplete, language }) {
  let code = starterCode(exercise);
  let output = [];
  let isRunning = false, showHint = false, hintPenalty = 0, copied = false, expandedTests = false;
  const isJS = ["javascript", "typescript"].includes((language || "").toLowerCase());

  function xpEarned() { return Math.max(0, (exercise.xp || 25) - hintPenalty); }

  function render() {
    const testsHTML = (exercise.testCases && exercise.testCases.length > 0)
      ? `<div class="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden"><button data-act="tests" class="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-input-bg)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"><span class="flex items-center gap-2">${icon("terminal", "h-4 w-4 text-[var(--color-text-muted)]")}Test cases (${exercise.testCases.length})</span>${expandedTests ? icon("chevron-up", "h-4 w-4") : icon("chevron-down", "h-4 w-4")}</button>${expandedTests ? `<div class="overflow-x-auto"><table class="w-full text-xs"><thead><tr class="border-b border-[var(--color-border-subtle)] bg-[var(--color-input-bg)]"><th class="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Vstup</th><th class="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Očekávaný výstup</th><th class="text-left px-4 py-2 text-[var(--color-text-muted)] font-medium">Popis</th></tr></thead><tbody>${exercise.testCases.map((tc) => `<tr class="border-b border-[var(--color-border-subtle)] last:border-0"><td class="px-4 py-2 font-mono text-[var(--color-text-secondary)]"><code class="text-[11px] bg-[var(--color-input-bg)] px-1.5 py-0.5 rounded">${escapeHtml(tc.input)}</code></td><td class="px-4 py-2 font-mono text-emerald-500"><code class="text-[11px] bg-emerald-500/5 px-1.5 py-0.5 rounded">${escapeHtml(tc.expectedOutput)}</code></td><td class="px-4 py-2 text-[var(--color-text-muted)]">${escapeHtml(tc.description)}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`
      : "";

    let editorHTML;
    if (isJS) {
      const consoleHTML = (output.length > 0 || isRunning) ? `<div class="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden"><div class="flex items-center gap-2 px-3 py-2 bg-[var(--color-input-bg)] border-b border-[var(--color-border-subtle)]">${icon("terminal", "h-3.5 w-3.5 text-[var(--color-text-muted)]")}<span class="text-xs text-[var(--color-text-muted)]">Konzole</span></div><div class="bg-[#0d1117] p-3 min-h-[60px] max-h-[200px] overflow-y-auto">${isRunning && output.length === 0 ? `<p class="text-xs text-[#8b949e] font-mono animate-pulse">Spouštění...</p>` : ""}${output.map((line) => `<pre class="text-xs font-mono leading-5 ${line.startsWith("[ERROR]") ? "text-red-400" : line.startsWith("[WARN]") ? "text-amber-400" : "text-[#e6edf3]"}">${escapeHtml(line)}</pre>`).join("")}</div></div>` : "";
      editorHTML = `<div class="rounded-lg overflow-hidden border border-[var(--color-border-subtle)]"><div class="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-b border-[#30363d]"><span class="text-[10px] uppercase tracking-wider text-[#8b949e] font-mono">${escapeHtml(langLabel(language))}</span><button data-act="copy" class="p-1.5 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors" title="${escapeHtml(t("lesson.copyCode"))}">${copied ? icon("check", "h-3.5 w-3.5") : icon("copy", "h-3.5 w-3.5")}</button></div><textarea data-field="code" spellcheck="false" class="w-full bg-[#0d1117] text-[#e6edf3] font-mono text-sm leading-6 p-4 resize-y focus:outline-none min-h-[180px]" style="tab-size:2">${escapeHtml(code)}</textarea></div><div class="flex items-center gap-2"><button data-act="run" ${isRunning || code.trim().length === 0 ? "disabled" : ""} class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors">${icon("play", "h-4 w-4")}${isRunning ? "Běží..." : "Spustit"}</button>${!completed ? `<button data-act="complete" class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors">${icon("check-circle-2", "h-4 w-4")}${escapeHtml(t("lesson.complete"))}</button>` : ""}${exercise.hint ? `<button data-act="hint" class="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-sm text-[var(--color-muted)] hover:text-amber-500 transition-colors">${icon("lightbulb", "h-4 w-4")}${escapeHtml(showHint ? t("exercise.hideHint") : t("exercise.hint"))}${showHint && hintPenalty > 0 ? `<span class="text-amber-500 text-[10px]">(-${hintPenalty} XP)</span>` : ""}</button>` : ""}</div>${consoleHTML}`;
    } else {
      editorHTML = `<div class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-input-bg)] p-5 text-center">${icon("lock", "h-6 w-6 text-[var(--color-text-muted)] mx-auto mb-2")}<p class="text-sm text-[var(--color-text-secondary)] mb-3">Pro tento jazyk si kód zkopíruj do svého IDE.</p><div class="flex items-center justify-center gap-2"><button data-act="copy" class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border border-[var(--color-border-subtle)] hover:bg-[var(--color-glass-highlight)] transition-colors">${copied ? icon("check", "h-4 w-4") : icon("copy", "h-4 w-4")}${escapeHtml(copied ? t("lesson.copied") : t("lesson.copyCode"))}</button>${!completed ? `<button data-act="complete" class="gap-2 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">${icon("check-circle-2", "h-4 w-4")}${escapeHtml(t("lesson.complete"))}</button>` : ""}</div></div>`;
    }

    const hintHTML = showHint && exercise.hint ? `<div class="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4 flex gap-3">${icon("lightbulb", "h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500")}<div><p class="text-sm leading-6 text-[var(--color-text-secondary)]">${escapeHtml(exercise.hint)}</p><p class="text-[11px] text-amber-500 mt-1">Nápověda: -${hintPenalty} XP z celkové odměny</p></div></div>` : "";

    container.innerHTML = `<div class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] overflow-hidden"><div class="px-5 py-4 border-b border-[var(--color-border-subtle)]"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-semibold">${index}</span><h4 class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(exercise.title)}</h4></div><div class="flex items-center gap-2">${exercise.xp && exercise.xp > 0 ? XPBadge({ xp: xpEarned(), size: "sm" }) : ""}${completed ? icon("check-circle-2", "h-4 w-4 text-emerald-500") : ""}</div></div></div><div class="p-5 space-y-5"><div class="space-y-2"><p class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(exercise.task)}</p><p class="text-sm text-[var(--color-text-secondary)] leading-6">${escapeHtml(exercise.description)}</p></div>${testsHTML}${editorHTML}${hintHTML}</div></div>`;

    const codeTa = container.querySelector('[data-field="code"]');
    if (codeTa) codeTa.addEventListener("input", (e) => { code = e.target.value; const rb = container.querySelector('[data-act="run"]'); if (rb) rb.disabled = isRunning || code.trim().length === 0; });
    bind("copy", async () => { await navigator.clipboard?.writeText(code); copied = true; render(); setTimeout(() => { copied = false; render(); }, 2000); });
    bind("run", async () => { if (!isJS) return; isRunning = true; output = []; render(); const r = await runJSInSandbox(code); output = r.error ? [r.error] : r.output; isRunning = false; render(); });
    bind("complete", () => { if (!completed) onComplete && onComplete(); });
    bind("tests", () => { expandedTests = !expandedTests; render(); });
    bind("hint", () => { if (!showHint) hintPenalty += 5; showHint = !showHint; render(); });
    renderIcons(container);

    function bind(act, fn) { const b = container.querySelector(`[data-act="${act}"]`); if (b) b.addEventListener("click", fn); }
  }
  render();
}

export function mountExerciseList(container, { exercises, completedIds = [], courseLanguage = "javascript", onComplete } = {}) {
  if (!exercises || exercises.length === 0) { container.innerHTML = ""; return; }
  const completedSet = new Set(completedIds);
  const list = exercises.map((ex, i) => ({ ex, i })).map(({ ex, i }) =>
    ex.type === "code"
      ? `<div id="ex-${ex.id}"></div>`
      : `<div id="ex-${ex.id}"></div>`
  );
  container.innerHTML = `<div class="mt-8 space-y-6 max-w-3xl mx-auto px-6"><div class="flex items-center gap-2 mb-2">${icon("dumbbell", "h-4 w-4 text-emerald-500")}<h3 class="text-sm font-medium text-[var(--color-text-primary)]">${escapeHtml(t("lesson.exercises"))}</h3><span class="text-xs text-[var(--color-muted)]">${completedIds.length}/${exercises.length} ${escapeHtml(t("exercise.completed")).toLowerCase()}</span></div>${list.join("")}</div>`;

  exercises.forEach((ex, i) => {
    const slot = container.querySelector(`#ex-${ex.id}`);
    if (!slot) return;
    const onCompleteOne = () => onComplete && onComplete(ex.id);
    if (ex.type === "code") mountCodeCard(slot, { exercise: ex, index: i + 1, completed: completedSet.has(ex.id), onComplete: onCompleteOne, language: courseLanguage });
    else mountOpenCard(slot, { exercise: ex, index: i + 1, completed: completedSet.has(ex.id), onComplete: onCompleteOne });
  });
  renderIcons(container);
}
