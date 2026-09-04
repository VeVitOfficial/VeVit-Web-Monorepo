"use client";

// Sdílený helper pro AI nástroje (Dávka dev) — port legacy ai-tool.js.
// Zapouzdřuje volání /tools/api/ai/ollama s NDJSON streamem a bezpečné
// vykreslení markdownu přes VeVitMarkdown (marked + DOMPurify).
//
// Bezpečnost: system prompt nikdy neposílá klient (posílá jen `tool`
// identifikátor, proxy si prompt dohledá). Uživatelský text jde jako `prompt`.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/components/tools/registry/data";
import { loadScript, useToolUi } from "@/components/tools/tool-runtime";

// Načte marked + purify + safe-mark.js (definuje window.VeVitMarkdown).
let mdPromise: Promise<void> | null = null;
function ensureMarkdown(): Promise<void> {
  if (mdPromise) return mdPromise;
  mdPromise = (async () => {
    await loadScript("/tools/assets/js/lib/marked.min.js");
    await loadScript("/tools/assets/js/lib/purify.min.js");
    await loadScript("/tools/assets/js/lib/safe-markdown.js");
  })();
  return mdPromise;
}

type Opts = {
  tool: string;
  prompt: string;
  onToken: (piece: string, full: string) => void;
  onDone: (full: string) => void;
  onError: (msg: string) => void;
};

/** Spustí AI dotaz se streamem. Vrací abort řadič. */
export function aiRun(opts: Opts): AbortController {
  const controller = new AbortController();
  let full = "";
  let done = false;

  fetch("/tools/api/ai/ollama", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: opts.prompt, tool: opts.tool, stream: true }),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) {
        return res.json().catch(() => ({})).then((d: Record<string, string>) => {
          throw new Error(d.message || d.error || `HTTP ${res.status}`);
        });
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      function pump(): Promise<void> {
        return reader.read().then((ch) => {
          if (ch.done) {
            if (!done) { done = true; opts.onDone(full); }
            return;
          }
          buf += dec.decode(ch.value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const p = JSON.parse(line);
              if (p.response || p.text) {
                const piece = p.response || p.text;
                full += piece;
                opts.onToken(piece, full);
              }
              if (p.done) { done = true; opts.onDone(full); return; }
            } catch { /* ignoruj nevalidní řádek */ }
          }
          return pump();
        });
      }
      return pump();
    })
    .catch((e: Error) => {
      if (e?.name === "AbortError") { if (!done) opts.onDone(full); return; }
      opts.onError(e?.message || "Nastala neznámá chyba. Zkuste to znovu.");
    });
  return controller;
}

/** Bezpečně vyrenderuje markdown do elementu (DOMPurify sanitize). */
async function renderMarkdown(el: HTMLElement, text: string): Promise<boolean> {
  try {
    await ensureMarkdown();
    const vm = (window as unknown as { VeVitMarkdown?: { renderInto: (el: HTMLElement, md: string) => boolean } }).VeVitMarkdown;
    if (!vm) { el.replaceChildren(document.createTextNode("Náhled nelze bezpečně vykreslit.")); return false; }
    return vm.renderInto(el, text);
  } catch {
    el.replaceChildren(document.createTextNode("Náhled nelze bezpečně vykreslit."));
    return false;
  }
}

/** Hook se sdíleným stavem pro AI jedno-dotazové nástroje (vysvětlení, commit, regex). */
export function useAiSingle(tool: string, locale: Locale, idleMsg: string, emptyErr: string) {
  const { t } = useToolUi(locale);
  const [running, setRunning] = useState(false);
  const [showOut, setShowOut] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const mdRef = useRef<HTMLDivElement | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const fullRef = useRef("");

  const go = useCallback((text: string) => {
    if (ctrlRef.current) { ctrlRef.current.abort(); ctrlRef.current = null; Promise.resolve().then(() => setRunning(false)); return; }
    const trimmed = text.trim();
    if (!trimmed) { Promise.resolve().then(() => setErrMsg(emptyErr)); return; }
    Promise.resolve().then(() => { setErrMsg(null); setShowOut(true); setHasResult(false); setRunning(true); });
    if (mdRef.current) mdRef.current.textContent = idleMsg;
    fullRef.current = "";
    ctrlRef.current = aiRun({
      tool,
      prompt: trimmed,
      onToken: (_piece, full) => { fullRef.current = full; if (mdRef.current) void renderMarkdown(mdRef.current, full); },
      onDone: (full) => {
        ctrlRef.current = null;
        Promise.resolve().then(() => { setRunning(false); setHasResult(full.length > 0); });
        if (!full && mdRef.current) mdRef.current.textContent = "";
      },
      onError: (msg) => {
        ctrlRef.current = null;
        Promise.resolve().then(() => { setRunning(false); setErrMsg(msg); setShowOut(false); });
      },
    });
  }, [tool, idleMsg, emptyErr]);

  const copyResult = useCallback(async () => {
    const txt = mdRef.current?.innerText || mdRef.current?.textContent || "";
    if (txt) {
      try { await navigator.clipboard.writeText(txt); }
      catch { /* useCopy flash nepotřebujeme zde — legacy volá ToolUI.copyText */ }
    }
  }, []);

  useEffect(() => () => { if (ctrlRef.current) ctrlRef.current.abort(); }, []);
  void t;
  return { running, showOut, errMsg, hasResult, mdRef, go, copyResult };
}