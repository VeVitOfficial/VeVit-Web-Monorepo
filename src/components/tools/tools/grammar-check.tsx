"use client";

// AI kontrola pravopisu/gramatiky — jeden dotaz na /tools/api/ai/ollama (NDJSON stream).
// Port legacy grammar-check.js. Markdown se renderuje přes UMD safe-markdown (DOMPurify).
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript, copyText, Icon, toastError } from "@/components/tools/tool-runtime";

const DEPS = [
  "/tools/assets/js/lib/marked.min.js",
  "/tools/assets/js/lib/purify.min.js",
  "/tools/assets/js/lib/safe-markdown.js",
  "/tools/assets/js/lib/ai-tool.js",
];

interface AiHandle { abort: () => void; }
interface AIToolApi {
  run: (opts: {
    tool: string;
    prompt: string;
    stream?: boolean;
    onToken?: (piece: string, full: string) => void;
    onDone?: (full: string) => void;
    onError?: (msg: string) => void;
  }) => AiHandle;
  renderMarkdown: (el: HTMLElement, text: string) => boolean;
}
type WindowWithAi = Window & { AITool?: AIToolApi };

export default function GrammarCheck({ locale }: ToolComponentProps) {
  void locale;
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [hasOut, setHasOut] = useState(false);
  const [depsReady, setDepsReady] = useState(false);
  const [depsFailed, setDepsFailed] = useState(false);

  const mdRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<AiHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(DEPS.map(loadScript))
      .then(() => { if (!cancelled) Promise.resolve().then(() => setDepsReady(true)); })
      .catch(() => { if (!cancelled) Promise.resolve().then(() => setDepsFailed(true)); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { if (handleRef.current) handleRef.current.abort(); }, []);

  const fail = useCallback((m: string) => { setError(m); setHasOut(false); }, []);

  const go = useCallback(() => {
    if (handleRef.current) { handleRef.current.abort(); handleRef.current = null; Promise.resolve().then(() => setRunning(false)); return; }
    const ai = (window as WindowWithAi).AITool;
    if (!ai) { if (depsFailed) toastError("Potřebnou část nástroje se nepodařilo načíst."); return; }
    const text = input.trim();
    if (!text) return fail("Vložte text k opravě.");
    setError("");
    setHasOut(true);
    if (mdRef.current) mdRef.current.textContent = "Opravuji…";
    setRunning(true);
    handleRef.current = ai.run({
      tool: "grammar-check",
      prompt: text,
      onToken: (_piece, full) => { const el = mdRef.current; if (el) ai.renderMarkdown(el, full); },
      onDone: (full) => {
        handleRef.current = null;
        Promise.resolve().then(() => setRunning(false));
        if (!full && mdRef.current) mdRef.current.textContent = "";
      },
      onError: (m) => {
        handleRef.current = null;
        Promise.resolve().then(() => setRunning(false));
        Promise.resolve().then(() => setHasOut(false));
        fail(m);
      },
    });
  }, [input, depsFailed, fail]);

  const onCopy = useCallback(() => {
    const el = mdRef.current;
    if (el) void copyText(el.innerText || el.textContent, locale);
  }, [locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>Model: llama3.2</span></div>
      <textarea className="textarea" id="gc-input" rows={10} placeholder="Vložte český text k opravě pravopisu a gramatiky…" value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="btn btn-primary btn-touch" id="gc-run" type="button" disabled={!depsReady && !depsFailed} onClick={go}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 16 6-12 6 12" /><path d="M8 12h8" /><path d="m16 20 2 2 4-4" /></svg>
        <span className="gc-label" style={{ display: running ? "none" : undefined }}>Opravit</span>
        <span className="gc-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
      </button>
      {depsFailed ? <p className="error-text" role="alert">Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.</p> : null}
      <div className="ai-error hidden" id="gc-error" style={{ display: error ? undefined : "none" }}>
        <span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span>
        <span id="gc-error-text">{error}</span>
      </div>
      {hasOut ? (
        <div className="result-card" id="gc-out">
          <div className="markdown-body" id="gc-md" ref={mdRef} />
          <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-secondary btn-sm" id="gc-copy" type="button" onClick={onCopy}><Icon name="Copy" size={14} /> Kopírovat</button>
          </div>
        </div>
      ) : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Kontrola pravopisu/gramatiky přes Ollamu, lokálně. Vraťte opravený text — vstup max 20 000 znaků.</p>
    </div>
  );
}