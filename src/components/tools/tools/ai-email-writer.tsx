"use client";

// AI psaní e-mailu — jeden dotaz na /tools/api/ai/ollama (NDJSON stream).
// Port legacy ai-email-writer.js. Markdown se renderuje přes UMD safe-markdown (DOMPurify).
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

const TONES = ["formální", "přátelský", "prodejní", "omluvný", "stručný"] as const;
const LANGS = ["čeština", "angličtina", "slovenština", "němčina"] as const;

export default function AiEmailWriter({ locale }: ToolComponentProps) {
  void locale;
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<string>("formální");
  const [lang, setLang] = useState<string>("čeština");
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

  // Při unmount abortni běžící požadavek.
  useEffect(() => () => { if (handleRef.current) handleRef.current.abort(); }, []);

  const fail = useCallback((m: string) => { setError(m); setHasOut(false); }, []);

  const go = useCallback(() => {
    if (handleRef.current) { handleRef.current.abort(); handleRef.current = null; Promise.resolve().then(() => setRunning(false)); return; }
    const ai = (window as WindowWithAi).AITool;
    if (!ai) { if (depsFailed) toastError("Potřebnou část nástroje se nepodařilo načíst."); return; }
    const text = input.trim();
    if (!text) return fail("Popište, o jaký e-mail jde.");
    setError("");
    setHasOut(true);
    if (mdRef.current) mdRef.current.textContent = "Píšu e-mail…";
    setRunning(true);
    const prompt = "Napiš e-mail v jazyce: " + lang + ". Tón: " + tone + ". Zadání:\n\n" + text;
    handleRef.current = ai.run({
      tool: "ai-email-writer",
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
  }, [input, lang, tone, depsFailed, fail]);

  const onCopy = useCallback(() => {
    const el = mdRef.current;
    if (el) void copyText(el.innerText || el.textContent, locale);
  }, [locale]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>Model: llama3.2</span></div>
      <textarea className="textarea" id="ew-input" rows={6} placeholder="Popište, o jaký e-mail jde (komu, o čem, co chcete sdělit)…" value={input} onChange={(e) => setInput(e.target.value)} />
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="ew-tone">Tón</label>
          <select className="select" id="ew-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select></div>
        <div className="stack-sm"><label className="field-label" htmlFor="ew-lang">Jazyk</label>
          <select className="select" id="ew-lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select></div>
      </div>
      <button className="btn btn-primary btn-touch" id="ew-run" type="button" disabled={!depsReady && !depsFailed} onClick={go}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
        <span className="ew-label" style={{ display: running ? "none" : undefined }}>Napsat e-mail</span>
        <span className="ew-stop" style={{ display: running ? undefined : "none" }}>Zastavit</span>
      </button>
      {depsFailed ? <p className="error-text" role="alert">Potřebnou část nástroje se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.</p> : null}
      <div className="ai-error hidden" id="ew-error" style={{ display: error ? undefined : "none" }}>
        <span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span>
        <span id="ew-error-text">{error}</span>
      </div>
      {hasOut ? (
        <div className="result-card" id="ew-out">
          <div className="markdown-body" id="ew-md" ref={mdRef} />
          <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
            <button className="btn btn-secondary btn-sm" id="ew-copy" type="button" onClick={onCopy}><Icon name="Copy" size={14} /> Kopírovat</button>
          </div>
        </div>
      ) : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>E-mail se vygeneruje lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
    </div>
  );
}