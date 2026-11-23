// CodeBlock – port CodeBlock.tsx (statické HTML + inline kopírování přes window.vevit.copyCode)

import { icon } from "../lib/dom.js";
import { escapeHtml } from "../lib/dom.js";

export function codeBlockHTML(code, language) {
  const lang = language || "text";
  return `<div class="code-block relative group my-6 rounded-lg overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-katex-bg)]"><div class="flex items-center justify-between px-3 py-2 bg-[var(--color-input-bg)] border-b border-[var(--color-border-subtle)]"><span class="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">${escapeHtml(lang)}</span><button onclick="vevit.copyCode(this)" class="h-6 w-6 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-glass-highlight)] rounded-md transition-colors">${icon("copy", "h-3.5 w-3.5")}</button></div><pre class="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-[var(--color-foreground)]"><code>${escapeHtml(code)}</code></pre></div>`;
}
