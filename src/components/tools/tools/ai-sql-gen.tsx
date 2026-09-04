"use client";

// AI generátor SQL — React port legacy tools/assets/js/tools/ai-sql-gen.js.
// Jeden dotaz na /tools/api/ai/ollama.php (NDJSON stream), výstup přes
// VeVitMarkdown. Markup i logika 1:1 s legacy. Komponenta renderuje POUZE
// vnitřní tělo (.stack) — shell dodává src/app/tools/[tool]/page.tsx.
//
// Odchylka: route odmítá `model` v těle (server vybírá model) — port ho
// neodesílá. URL končí na `.php` (Next route), legacy volalo bez přípony.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, loadScript } from "@/components/tools/tool-runtime";

// ── Sdílené AI helpery (port lib/ai-tool.js + lib/safe-markdown.js) ──────
type VvMd = { renderInto(el: HTMLElement, md: string): boolean };
function vvMd(): VvMd | undefined {
  return (window as unknown as { VeVitMarkdown?: VvMd }).VeVitMarkdown;
}
let mdLibP: Promise<void> | null = null;
async function ensureMarkdown(): Promise<void> {
  if (mdLibP) return mdLibP;
  mdLibP = (async () => {
    await loadScript("/tools/assets/js/lib/marked.min.js");
    await loadScript("/tools/assets/js/lib/purify.min.js");
    await loadScript("/tools/assets/js/lib/safe-markdown.js");
  })();
  return mdLibP;
}
interface AiOpts { prompt: string; onToken: (full: string) => void; onDone: (full: string) => void; onError: (msg: string) => void; }
function runAi(opts: AiOpts): { abort: () => void } {
  const controller = new AbortController();
  let full = "";
  let done = false;
  fetch("/tools/api/ai/ollama.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: opts.prompt, tool: "ai-sql-gen", stream: true }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        let d: { message?: string; error?: string } = {};
        try { d = (await res.json()) as { message?: string; error?: string }; } catch { /* ignore */ }
        throw new Error(d.message || d.error || `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const ch = await reader.read();
        if (ch.done) { if (!done) { done = true; opts.onDone(full); } return; }
        buf += dec.decode(ch.value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const p = JSON.parse(line) as { response?: string; text?: string; done?: boolean };
            if (p.response || p.text) { full += p.response || p.text; opts.onToken(full); }
            if (p.done) { done = true; opts.onDone(full); return; }
          } catch { /* ignoruj */ }
        }
      }
    })
    .catch((e: unknown) => {
      if ((e instanceof DOMException || e instanceof Error) && e.name === "AbortError") { if (!done) opts.onDone(full); return; }
      opts.onError(e instanceof Error ? e.message || "Nastala neznámá chyba. Zkuste to znovu." : "Nastala neznámá chyba. Zkuste to znovu.");
    });
  return { abort: () => controller.abort() };
}

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "MSSQL (T-SQL)"];
const TXT = {
  model: "Model: llama3.2",
  dialect: "Dialekt",
  run: "Vygenerovat SQL",
  stop: "Zastavit",
  copy: "Kopírovat",
  errEmpty: "Popište, co má dotaz dělat.",
  working: "Generuji…",
  note: "Vygeneruje SQL pro zadaný dialekt. Vždy si výstup zkontrolujte před spuštěním na produkční databázi. Běží lokálně přes Ollamu. Vstup max 20 000 znaků.",
  placeholder: "Popište, co má dotaz dělat (např. „top 10 zákazníků podle počtu objednávek za letošek“)…",
};

export default function AiSqlGen({ locale }: ToolComponentProps) {
  const [dialect, setDialect] = useState(DIALECTS[0]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [hasOut, setHasOut] = useState(false);
  const handleRef = useRef<{ abort: () => void } | null>(null);
  const mdRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.getElementById("tool-root");
    if (el) el.setAttribute("data-tool-state", running ? "processing" : hasOut ? "success" : "idle");
  }, [running, hasOut]);

  const renderMd = useCallback((text: string) => {
    if (!mdRef.current) return;
    ensureMarkdown().then(() => {
      if (!mdRef.current) return;
      const api = vvMd();
      if (!api || !api.renderInto(mdRef.current, text)) mdRef.current.textContent = text;
    });
  }, []);

  const go = useCallback(() => {
    if (handleRef.current) { handleRef.current.abort(); handleRef.current = null; setRunning(false); return; }
    const text = input.trim();
    if (!text) { setError(TXT.errEmpty); return; }
    setError("");
    setHasOut(true);
    if (mdRef.current) mdRef.current.textContent = TXT.working;
    setRunning(true);
    const prompt = `Dialekt SQL: ${dialect}.\n\n${text}`;
    handleRef.current = runAi({
      prompt,
      onToken: (full) => renderMd(full),
      onDone: (full) => { setRunning(false); handleRef.current = null; if (!full && mdRef.current) mdRef.current.textContent = ""; },
      onError: (m) => { setRunning(false); handleRef.current = null; setHasOut(false); setError(m); },
    });
  }, [input, dialect, renderMd]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>{TXT.model}</span></div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="sql-dialect">{TXT.dialect}</label>
        <select className="select" id="sql-dialect" value={dialect} onChange={(e) => setDialect(e.target.value)}>
          {DIALECTS.map((d) => <option key={d} value={d}>{d === "MSSQL (T-SQL)" ? "MSSQL (T-SQL)" : d}</option>)}
        </select>
      </div>
      <textarea className="textarea" id="sql-input" rows={8} placeholder={TXT.placeholder} value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="btn btn-primary btn-touch" id="sql-run" type="button" onClick={go}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>{" "}
        <span className="sql-label" style={{ display: running ? "none" : undefined }}>{TXT.run}</span>
        <span className="sql-stop" style={{ display: running ? undefined : "none" }}>{TXT.stop}</span>
      </button>
      <div className={`ai-error${error ? "" : " hidden"}`} id="sql-error">
        <span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span>
        <span id="sql-error-text">{error}</span>
      </div>
      <div className={`result-card${hasOut ? "" : " hidden"}`} id="sql-out">
        <div className="markdown-body" id="sql-md" ref={mdRef} />
        <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
          <button className="btn btn-secondary btn-sm" id="sql-copy" type="button" onClick={() => { const el = mdRef.current; void copyText(el?.innerText || el?.textContent || "", locale); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> {TXT.copy}
          </button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{TXT.note}</p>
    </div>
  );
}