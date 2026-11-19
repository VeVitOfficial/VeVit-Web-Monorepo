// LessonContent – port LessonContent.tsx (render bloků lekce do containeru)

import { icon, escapeHtml, renderIcons } from "../lib/dom.js";
import { codeBlockHTML } from "./code-block.js";

const headingClasses = {
  1: "text-3xl md:text-4xl font-bold mb-6 mt-2 tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent",
  2: "text-xl md:text-2xl font-semibold mb-4 mt-10 tracking-tight text-[var(--color-text-primary)]",
  3: "text-lg font-semibold mb-3 mt-6 text-[var(--color-text-primary)]",
};

const calloutIcons = { info: "info", warning: "alert-triangle", tip: "lightbulb", xp: "zap" };
const calloutStyles = {
  info: { border: "border-sky-500/50", bg: "bg-sky-500/[0.03]", text: "text-sky-500" },
  warning: { border: "border-amber-500/50", bg: "bg-amber-500/[0.03]", text: "text-amber-500" },
  tip: { border: "border-emerald-500/50", bg: "bg-emerald-500/[0.03]", text: "text-emerald-500" },
  xp: { border: "border-emerald-500/50", bg: "bg-emerald-500/[0.05]", text: "text-emerald-500" },
};

function isTimelineList(items) {
  if (items.length < 2) return false;
  const yearPattern = /^\d{3,4}\s*[–—\-\s]/;
  return items.every((item) => yearPattern.test(item.trim()));
}

function parseTimelineItem(item) {
  const match = item.trim().match(/^(\d{3,4})\s*[–—\-\s]\s*(.*)$/);
  if (match) return { year: match[1], text: match[2] };
  return { year: "", text: item.trim() };
}

function renderMath(latex, display) {
  try {
    const html = window.katex.renderToString(latex, { throwOnError: false, displayMode: !!display });
    return `<span class="${display ? "katex-display block" : "inline"}">${html}</span>`;
  } catch {
    return `<span class="text-error">${escapeHtml(latex)}</span>`;
  }
}

function renderBlock(block) {
  switch (block.type) {
    case "heading":
      return `<h${block.level} class="${headingClasses[block.level] || headingClasses[3]}">${escapeHtml(block.text)}</h${block.level}>`;

    case "paragraph":
      return `<p class="text-base leading-7 text-[var(--color-text-secondary)] mb-4 text-balance">${escapeHtml(block.text)}</p>`;

    case "list": {
      if (isTimelineList(block.items)) {
        const items = block.items
          .map((item) => {
            const { year, text } = parseTimelineItem(item);
            return `<div class="relative"><div class="absolute -left-6 top-1 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] ring-2 ring-[var(--color-background)]"></div><div class="flex items-start gap-3">${year ? `<span class="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-semibold flex-shrink-0 mt-0.5">${escapeHtml(year)}</span>` : ""}<span class="text-sm leading-6 text-[var(--color-text-secondary)]">${escapeHtml(text)}</span></div></div>`;
          })
          .join("");
        return `<div class="my-8"><div class="relative pl-6"><div class="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border-subtle)]"></div><div class="space-y-6">${items}</div></div></div>`;
      }
      const tag = block.ordered ? "ol" : "ul";
      const style = block.ordered ? "list-decimal" : "list-disc";
      const items = block.items.map((it) => `<li class="mb-2 leading-7 pl-1">${escapeHtml(it)}</li>`).join("");
      return `<${tag} class="mb-6 pl-5 text-[var(--color-text-secondary)] ${style}">${items}</${tag}>`;
    }

    case "code":
      return codeBlockHTML(block.code, block.language);

    case "math":
      return renderMath(block.latex, block.display);

    case "callout": {
      const ic = calloutIcons[block.variant] || calloutIcons.info;
      const st = calloutStyles[block.variant] || calloutStyles.info;
      return `<div class="my-6 rounded-lg border-l-4 ${st.border} ${st.bg} p-4 flex gap-3">${icon(ic, `h-5 w-5 flex-shrink-0 mt-0.5 ${st.text}`)}<p class="text-sm leading-6 text-[var(--color-text-secondary)]">${escapeHtml(block.text)}</p></div>`;
    }

    default:
      return "";
  }
}

// Render bloků lekce do daného containeru
export function renderLessonContent(container, blocks) {
  container.innerHTML = blocks.map(renderBlock).join("");
  renderIcons(container);
}
