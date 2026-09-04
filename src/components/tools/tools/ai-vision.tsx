"use client";

// AI analýza obrázku (llava) — React port legacy tools/assets/js/tools/ai-vision.js.
// Obrázek jako base64 + otázka na /tools/api/ai/ollama.php (NDJSON stream),
// výstup přes VeVitMarkdown. Markup i logika 1:1 s legacy. Komponenta renderuje
// POUZE vnitřní tělo (.stack) — shell dodává src/app/tools/[tool]/page.tsx.
//
// Odchylka: route odmítá `model` v těle (server vybírá model) — legacy posílalo
// model:'llava'; port ho neodesílá. URL končí na `.php` (Next route), legacy
// volalo bez přípony. Legacy renderFileList nezobrazuje náhled obrázku (jen
// ikona + název + velikost + odebrat) — port je 1:1 (žádný object URL preview).
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, fmtSize, loadScript, useToolUi } from "@/components/tools/tool-runtime";

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
interface AiOpts { prompt: string; images: string[]; onToken: (full: string) => void; onDone: (full: string) => void; onError: (msg: string) => void; }
function runAi(opts: AiOpts): { abort: () => void } {
  const controller = new AbortController();
  let full = "";
  let done = false;
  fetch("/tools/api/ai/ollama.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: opts.prompt, tool: "ai-vision", stream: true, images: opts.images }),
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

// File → base64 bez data URL prefixu (port AITool.fileToBase64).
function fileToBase64(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => resolve(null);
    r.readAsDataURL(file);
  });
}

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
const MAX = 8 * 1024 * 1024;
const TXT = {
  model: "Model: llava (vyžaduje `ollama pull llava`)",
  dzTitle: "Přetáhněte obrázek",
  dzHint: "PNG / JPG / WEBP — analýza přes vision model",
  run: "Analyzovat",
  stop: "Zastavit",
  copy: "Kopírovat",
  errBig: "Obrázek je příliš velký (max 8 MB).",
  errFile: "Přidejte obrázek.",
  errRead: "Obrázek se nepodařilo načíst.",
  working: "Analyzuji obrázek…",
  qPh: "Na co se zeptat? (prázdné = popiš obrázek)",
  note: "Obrázek se odešle na lokální Ollamu (model llava). Maximálně 4 obrázky, 8 MB/obrázek. Text otázky max 20 000 znaků. Pokud model llava není nainstalovaný, proxy vrátí srozumitelnou chybu.",
};

export default function AiVision({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [hasOut, setHasOut] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const handleRef = useRef<{ abort: () => void } | null>(null);
  const mdRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    const el = document.getElementById("tool-root");
    if (el) el.setAttribute("data-tool-state", running ? "processing" : hasOut ? "success" : file ? "ready" : "idle");
  }, [running, hasOut, file]);

  const renderMd = useCallback((text: string) => {
    if (!mdRef.current) return;
    ensureMarkdown().then(() => {
      if (!mdRef.current) return;
      const api = vvMd();
      if (!api || !api.renderInto(mdRef.current, text)) mdRef.current.textContent = text;
    });
  }, []);

  const matchesAccept = (f: File) => ACCEPT.includes(f.type);

  const addFiles = useCallback((arr: File[]) => {
    const f = arr.find(matchesAccept);
    if (!f) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(TXT.errBig); return; }
    setError("");
    setFile(f);
  }, [t]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0;
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = useCallback(() => {
    setFile(null);
    setHasOut(false);
    setError("");
  }, []);

  const go = useCallback(() => {
    if (handleRef.current) { handleRef.current.abort(); handleRef.current = null; setRunning(false); return; }
    if (!file) { setError(TXT.errFile); return; }
    setError("");
    setHasOut(true);
    if (mdRef.current) mdRef.current.textContent = TXT.working;
    setRunning(true);
    fileToBase64(file).then((b64) => {
      if (!b64) { setRunning(false); setHasOut(false); setError(TXT.errRead); return; }
      const q = question.trim() || "Popiš tento obrázek.";
      handleRef.current = runAi({
        prompt: q,
        images: [b64],
        onToken: (full) => renderMd(full),
        onDone: (full) => { setRunning(false); handleRef.current = null; if (!full && mdRef.current) mdRef.current.textContent = ""; },
        onError: (m) => { setRunning(false); handleRef.current = null; setHasOut(false); setError(m); },
      });
    });
  }, [file, question, renderMd]);

  const dzTitle = TXT.dzTitle;
  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="ai-head"><span className="badge badge-ai">AI</span><span className="muted" style={{ fontSize: "0.875rem" }}>{TXT.model}</span></div>

      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        id="vis-drop"
        role="button"
        tabIndex={0}
        aria-label={dzTitle}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}
      >
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg></span>
        <span className="dz-title">{dzTitle}</span>
        <span className="dz-hint">{TXT.dzHint}</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file ? (
        <div className="file-list" aria-label="Vybraný soubor">
          <div className="file-item">
            <span className="fi-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></span>
            <span className="fi-meta">
              <span className="fi-name">{file.name}</span>
              <span className="fi-size">{fmtSize(file.size)}</span>
            </span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={removeFile}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>
      ) : null}

      {file ? (
        <div id="vis-work">
          <textarea className="textarea" id="vis-q" rows={3} placeholder={TXT.qPh} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button className="btn btn-primary btn-touch" id="vis-run" type="button" onClick={go}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>{" "}
            <span className="vis-label" style={{ display: running ? "none" : undefined }}>{TXT.run}</span>
            <span className="vis-stop" style={{ display: running ? undefined : "none" }}>{TXT.stop}</span>
          </button>
        </div>
      ) : null}

      <div className={`ai-error${error ? "" : " hidden"}`} id="vis-error">
        <span className="ai-error-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg></span>
        <span id="vis-error-text">{error}</span>
      </div>

      <div className={`result-card${hasOut ? "" : " hidden"}`} id="vis-out">
        <div className="markdown-body" id="vis-md" ref={mdRef} />
        <div className="row" style={{ gap: "0.5rem", marginTop: "0.75rem" }}>
          <button className="btn btn-secondary btn-sm" id="vis-copy" type="button" onClick={() => { const el = mdRef.current; void copyText(el?.innerText || el?.textContent || "", locale); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> {TXT.copy}
          </button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{TXT.note}</p>
    </div>
  );
}