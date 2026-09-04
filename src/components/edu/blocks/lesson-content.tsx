"use client";

// LessonContent – port edu/js/components/lesson-content.js. Renderuje statické
// bloky lekce (heading/paragraph/list/code/math/callout) do JSX. Na rozdíl od
// legacy (string + innerHTML + escapeHtml) používáme JSX — text je tak automaticky
// escapován. Jedině výstup KaTeX (`renderMath`) vkládáme přes dangerouslySetInnerHTML,
// protože KaTeX produkuje MathML/HTML znění — stejně jako legacy (sanitizer
// legacy neaplikoval; KaTeX je bezpečný renderer, takže chování zachováno beze
// změny / oslabení).

import { CodeBlock } from "./code-block";
import { Icon } from "./icon";

export interface LessonBlock {
  type: string;
  level?: number;
  text?: string;
  items?: string[];
  ordered?: boolean;
  language?: string;
  code?: string;
  latex?: string;
  display?: boolean;
  variant?: string;
  [key: string]: unknown;
}

const headingClasses: Record<number, string> = {
  1: "text-3xl md:text-4xl font-bold mb-6 mt-2 tracking-tight bg-gradient-to-r from-[var(--color-hero-gradient-from)] to-[var(--color-hero-gradient-to)] bg-clip-text text-transparent",
  2: "text-xl md:text-2xl font-semibold mb-4 mt-10 tracking-tight text-[var(--color-text-primary)]",
  3: "text-lg font-semibold mb-3 mt-6 text-[var(--color-text-primary)]",
};

const calloutIcons: Record<string, string> = {
  info: "info",
  warning: "alert-triangle",
  tip: "lightbulb",
  xp: "zap",
};
const calloutStyles: Record<string, { border: string; bg: string; text: string }> = {
  info: { border: "border-sky-500/50", bg: "bg-sky-500/[0.03]", text: "text-sky-500" },
  warning: { border: "border-amber-500/50", bg: "bg-amber-500/[0.03]", text: "text-amber-500" },
  tip: { border: "border-emerald-500/50", bg: "bg-emerald-500/[0.03]", text: "text-emerald-500" },
  xp: { border: "border-emerald-500/50", bg: "bg-emerald-500/[0.05]", text: "text-emerald-500" },
};

function isTimelineList(items: string[]): boolean {
  if (items.length < 2) return false;
  const yearPattern = /^\d{3,4}\s*[–—\-\s]/;
  return items.every((item) => yearPattern.test(item.trim()));
}

function parseTimelineItem(item: string): { year: string; text: string } {
  const match = item.trim().match(/^(\d{3,4})\s*[–—\-\s]\s*(.*)$/);
  if (match) return { year: match[1], text: match[2] };
  return { year: "", text: item.trim() };
}

interface KatexGlobal {
  renderToString?: (latex: string, opts?: { throwOnError?: boolean; displayMode?: boolean }) => string;
}

function renderMath(latex: string, display: boolean): { html: string; error: boolean } {
  try {
    const katex = (window as unknown as { katex?: KatexGlobal }).katex;
    if (katex?.renderToString) {
      const html = katex.renderToString(latex, { throwOnError: false, displayMode: !!display });
      return { html: `<span class="${display ? "katex-display block" : "inline"}">${html}</span>`, error: false };
    }
  } catch {
    // padneme do textové reprezentace níže
  }
  return { html: "", error: true };
}

function MathBlock({ latex, display }: { latex: string; display: boolean }) {
  const { html, error } = renderMath(latex, display);
  if (error) {
    return <span className="text-error">{latex}</span>;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function ListBlock({ items, ordered }: { items: string[]; ordered?: boolean }) {
  if (isTimelineList(items)) {
    return (
      <div className="my-8">
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border-subtle)]" />
          <div className="space-y-6">
            {items.map((item, i) => {
              const { year, text } = parseTimelineItem(item);
              return (
                <div key={i} className="relative">
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] ring-2 ring-[var(--color-background)]" />
                  <div className="flex items-start gap-3">
                    {year ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-semibold flex-shrink-0 mt-0.5">
                        {year}
                      </span>
                    ) : null}
                    <span className="text-sm leading-6 text-[var(--color-text-secondary)]">{text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  const Tag = ordered ? "ol" : "ul";
  const style = ordered ? "list-decimal" : "list-disc";
  return (
    <Tag className={`mb-6 pl-5 text-[var(--color-text-secondary)] ${style}`}>
      {items.map((it, i) => (
        <li key={i} className="mb-2 leading-7 pl-1">{it}</li>
      ))}
    </Tag>
  );
}

function CalloutBlock({ variant, text }: { variant: string; text: string }) {
  const ic = calloutIcons[variant] || calloutIcons.info;
  const st = calloutStyles[variant] || calloutStyles.info;
  return (
    <div className={`my-6 rounded-lg border-l-4 ${st.border} ${st.bg} p-4 flex gap-3`}>
      <Icon name={ic} className={`h-5 w-5 flex-shrink-0 mt-0.5 ${st.text}`} />
      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{text}</p>
    </div>
  );
}

export function LessonContent({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const level = block.level ?? 3;
            const cls = headingClasses[level] || headingClasses[3];
            const Tag = (`h${Math.min(Math.max(level, 1), 6)}`) as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
            return <Tag key={i} className={cls}>{block.text || ""}</Tag>;
          }
          case "paragraph":
            return <p key={i} className="text-base leading-7 text-[var(--color-text-secondary)] mb-4 text-balance">{block.text || ""}</p>;
          case "list":
            return <ListBlock key={i} items={block.items || []} ordered={block.ordered} />;
          case "code":
            return <CodeBlock key={i} code={block.code || ""} language={block.language} />;
          case "math":
            return <MathBlock key={i} latex={block.latex || ""} display={!!block.display} />;
          case "callout":
            return <CalloutBlock key={i} variant={block.variant || "info"} text={block.text || ""} />;
          default:
            return null;
        }
      })}
    </>
  );
}