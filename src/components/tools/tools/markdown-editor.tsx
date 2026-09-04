"use client";

// Markdown editor — live náhled přes lokální marked + DOMPurify (UMD z public).
// Port legacy markdown-editor.js. Sanitizace zůstává přes safe-markdown.js (VeVitMarkdown).
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript, toastError } from "@/components/tools/tool-runtime";

const KEY = "vevit:md-editor";
const DEPS = [
  "/tools/assets/js/lib/marked.min.js",
  "/tools/assets/js/lib/purify.min.js",
  "/tools/assets/js/lib/safe-markdown.js",
];

interface VeVitMarkdownApi {
  renderInto: (el: HTMLElement, md: string) => boolean;
  toSafeHtml: (md: string) => string;
}
type WindowWithMd = Window & { VeVitMarkdown?: VeVitMarkdownApi };

export default function MarkdownEditor({ locale }: ToolComponentProps) {
  void locale;
  const [input, setInput] = useState("");
  const [depsReady, setDepsReady] = useState(false);
  const [depsFailed, setDepsFailed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Načti UMD závislosti (marked, purify, safe-markdown) — jednou.
  useEffect(() => {
    let cancelled = false;
    Promise.all(DEPS.map(loadScript))
      .then(() => { if (!cancelled) Promise.resolve().then(() => setDepsReady(true)); })
      .catch(() => { if (!cancelled) Promise.resolve().then(() => setDepsFailed(true)); });
    return () => { cancelled = true; };
  }, []);

  // Obnova z localStorage (jako legacy ToolUI.restore).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) Promise.resolve().then(() => setInput(saved));
    } catch { /* localStorage nedostupné — ignoruj */ }
  }, []);

  // Vykresli náhled přes VeVitMarkdown.renderInto (DOMPurify sanitize).
  const render = useCallback(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const vm = (window as WindowWithMd).VeVitMarkdown;
    if (!vm) {
      preview.replaceChildren(document.createTextNode("Náhled nelze bezpečně vykreslit."));
      preview.dataset.renderState = "error";
      return;
    }
    vm.renderInto(preview, input);
  }, [input]);

  // Debounce render + autosave (150ms) — věrně legacy schedule().
  useEffect(() => {
    if (!depsReady) return;
    if (renderTimer.current) clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(() => {
      render();
      try { localStorage.setItem(KEY, input); } catch { /* ignore */ }
    }, 150);
    return () => { if (renderTimer.current) clearTimeout(renderTimer.current); };
  }, [input, depsReady, render]);

  // ── Toolbar: vlož značku kolem výběru ──────────────────────────────
  const wrap = useCallback((prefix: string, suffix?: string) => {
    const ta = inputRef.current;
    if (!ta) return;
    suffix = suffix ?? prefix;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const val = ta.value;
    const sel = val.slice(s, e);
    const rep = prefix + (sel || "text") + suffix;
    const next = val.slice(0, s) + rep + val.slice(e);
    setInput(next);
    const caret = s + prefix.length;
    // Obnov výběr po React re-renderu.
    Promise.resolve().then(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret + (sel || "text").length);
    });
  }, []);

  const linePrefix = useCallback((pfx: string) => {
    const ta = inputRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const val = ta.value;
    const lineStart = val.lastIndexOf("\n", s - 1) + 1;
    setInput(val.slice(0, lineStart) + pfx + val.slice(lineStart));
    Promise.resolve().then(() => {
      ta.focus();
      ta.setSelectionRange(s + pfx.length, s + pfx.length);
    });
  }, []);

  const ACTIONS: Record<string, () => void> = {
    bold: () => wrap("**"),
    italic: () => wrap("*"),
    h1: () => linePrefix("# "),
    h2: () => linePrefix("## "),
    quote: () => linePrefix("> "),
    code: () => wrap("`"),
    link: () => wrap("[", "](https://)"),
    list: () => linePrefix("- "),
  };

  const onToolbar = (action: string) => {
    const fn = ACTIONS[action];
    if (fn) fn();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") { e.preventDefault(); ACTIONS.bold(); }
      else if (e.key === "i" || e.key === "I") { e.preventDefault(); ACTIONS.italic(); }
    }
  };

  // Exporty .md / .html (jako legacy ToolUI.download).
  const exportMd = useCallback(() => {
    if (!input) return;
    const url = URL.createObjectURL(new Blob([input], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "dokument.md"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [input]);

  const exportHtml = useCallback(() => {
    if (!input) return;
    const body = previewRef.current?.innerHTML ?? "";
    const html = '<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><title>Dokument</title><style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#111}pre{background:#f4f4f5;padding:1rem;border-radius:.5rem;overflow:auto}code{background:#f4f4f5;padding:.125rem .375rem;border-radius:.25rem}</style></head><body>' + body + '</body></html>';
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "dokument.html"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [input]);

  const onClear = useCallback(() => {
    setInput("");
    try { localStorage.setItem(KEY, ""); } catch { /* ignore */ }
    Promise.resolve().then(() => inputRef.current?.focus());
  }, []);

  // Toast o selhání načtení UMD knihoven — jednou (effect, ne během renderu).
  useEffect(() => {
    if (depsFailed) toastError("Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.");
  }, [depsFailed]);

  return (
    <div className="stack" style={{ maxWidth: "60rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <div className="row" style={{ gap: "0.25rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" data-md="bold" type="button" title="Tučné (Ctrl+B)" onClick={() => onToolbar("bold")}><strong>B</strong></button>
          <button className="btn btn-ghost btn-sm" data-md="italic" type="button" title="Kurzíva (Ctrl+I)" onClick={() => onToolbar("italic")}><em>I</em></button>
          <button className="btn btn-ghost btn-sm" data-md="h1" type="button" title="Nadpis 1" onClick={() => onToolbar("h1")}>H1</button>
          <button className="btn btn-ghost btn-sm" data-md="h2" type="button" title="Nadpis 2" onClick={() => onToolbar("h2")}>H2</button>
          <button className="btn btn-ghost btn-sm" data-md="quote" type="button" title="Citace" onClick={() => onToolbar("quote")}>“</button>
          <button className="btn btn-ghost btn-sm" data-md="code" type="button" title="Kód" onClick={() => onToolbar("code")}>{"{ }"}</button>
          <button className="btn btn-ghost btn-sm" data-md="link" type="button" title="Odkaz" onClick={() => onToolbar("link")}>🔗</button>
          <button className="btn btn-ghost btn-sm" data-md="list" type="button" title="Seznam" onClick={() => onToolbar("list")}>•</button>
        </div>
        <div className="grow"></div>
        <div className="row" style={{ gap: "0.25rem" }}>
          <button className="btn btn-ghost btn-sm" id="md-export-md" type="button" onClick={exportMd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> .md
          </button>
          <button className="btn btn-ghost btn-sm" id="md-export-html" type="button" onClick={exportHtml}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> .html
          </button>
          <button className="btn btn-ghost btn-sm" id="md-clear" type="button" onClick={onClear}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </div>

      <div className="split-2">
        <div className="stack-sm">
          <span className="muted" style={{ fontSize: "0.75rem", fontWeight: 500 }}>Markdown</span>
          <textarea
            ref={inputRef}
            className="textarea input-mono"
            id="md-input"
            placeholder={"# Nadpis\n\nNapište **Markdown**…"}
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="stack-sm">
          <span className="muted" style={{ fontSize: "0.75rem", fontWeight: 500 }}>Náhled</span>
          <div className="preview markdown-body" id="md-preview" ref={previewRef} aria-live="polite" />
        </div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>Text se automaticky ukládá do prohlížeče. Zpracování běží lokálně — nic se neodesílá.</p>
    </div>
  );
}