"use client";

// CodeBlock – port edu/js/components/code-block.js. Statický blok kódu s
// kopírovacím tlačítkem (místo legacy `onclick=vevit.copyCode(this)` používáme
// React stav + navigator.clipboard). Třídy jsou identické, aby edu/css/styles.css
// i Tailwind fungovaly jako v legacy.

import { useState } from "react";
import { Icon } from "./icon";

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lang = language || "text";
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard nedostupný (např. http) — ignorujeme
    }
  }

  return (
    <div className="code-block relative group my-6 rounded-lg overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-katex-bg)]">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-input-bg)] border-b border-[var(--color-border-subtle)]">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-mono">
          {lang}
        </span>
        <button
          type="button"
          onClick={copy}
          className="h-6 w-6 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-glass-highlight)] rounded-md transition-colors"
          aria-label="Kopírovat kód"
        >
          <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed font-mono text-[var(--color-foreground)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}