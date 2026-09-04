"use client";

// AI překladač — jeden dotaz na /tools/api/ai/ollama (NDJSON stream).
// Port legacy translate.js. Markdown se renderuje přes UMD safe-markdown (DOMPurify).
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

const LANGS = ["čeština", "angličtina", "slovenština", "němčtina", "francouzština", "španělština", "ruština", "polština", "italština"] as const;

export default function Translate({ locale }: ToolComponentProps) {
  void locale;
  const [input, setInput] = useState("");
  const [src, setSrc] = useState<string>("auto");
  const [tgt, setTgt] = useState<string>("čeština");
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
    if (!text) return fail("Vložte text k překladu.");
    setError("");
    setHasOut(true);
    if (mdRef.current) mdRef.current.textContent = "Překládám…";
    setRunning(true);
    let prompt = "Přelož následující text do jazyka „" + tgt + "„.";
    if (src !== "auto") prompt += " Z jazyka „" + src + "„.";
    prompt += "\n\n" + text;
    handleRef.current = ai.run({
      tool: "translate",
      prompt,
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
  }, [input, src, tgt, depsFailed, fail]);

  const onCopy = useCallback(() => {
    const el = mdRef.current;
    if (el) void copyText(el.innerText || el.textContent, locale);
  }, [locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>Model: llama3.2</span></div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="tt-src">Z jazyka</label>
          <select className="select" id="tt-src" value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="auto">Auto</option>
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select></div>
        <div className="stack-sm"><label className="field-label" htmlFor="tt-tgt">Do jazyka</label>
          <select className="select" id="tt-tgt" value={tgt} onChange={(e) => setTgt(e.target.value)}>
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select></div>
      </div>
      <textarea className="textarea" id="tt-input" rows={8} placeholder="Vložte text k překladu…" value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="btn btn-primary btn-touch" id="tt-run" type="button" disabled={!depsReady && !depsFailed} onClick={go}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
        <span className="tt-label" style={{ display: running ? "none" : undefined }}>Přeložit</span>
        <span className="tt-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
      </button>
      {depsFailed ? <p className="error-text" role="alert">Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.</p> : null}
      <div className="ai-error hidden" id="tt-error" style={{ display: error ? undefined : "none" }}>
        <span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span>
        <span id="tt-error-text">{error}</span>
      </div>
      {hasOut ? (
        <div className="result-card" id="tt-out">
          <div className="markdown-body" id="tt-md" ref={mdRef} />
          <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-secondary btn-sm" id="tt-copy" type="button" onClick={onCopy}><Icon name="Copy" size={14} /> Kopírovat</button>
          </div>
        </div>
      ) : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Překlad běží lokálně přes Ollamu. Text se nikam neodesílá mimo váš počítač/server. Vstup max 20 000 znaků.</p>
    </div>
  );
}