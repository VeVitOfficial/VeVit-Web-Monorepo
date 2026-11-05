"use client";

// Porovnání dvou PDF — z obou souborů se vytáhne textová vrstva (pdf.js
// getTextContent, řádky seskupené podle souřadnice Y) a porovná se po
// řádcích přes jsdiff (diff.min.js). Vykreslení jako u code-diff:
// vlevo odebrané (červeně), vpravo přidané (zeleně). Porovnává se textová
// vrstva, ne vzhled. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface DiffPart { value: string; added?: boolean; removed?: boolean; }
interface DiffLib { diffLines(a: string, b: string): DiffPart[]; }

interface PdfjsTextItem { str: string; transform: number[]; width?: number; }
interface PdfjsTextContent { items: PdfjsTextItem[]; }
interface PdfjsPage { getTextContent(): Promise<PdfjsTextContent>; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function diffLib(): DiffLib | undefined { return (window as unknown as { Diff?: DiffLib }).Diff; }

const ACCEPT = ".pdf,application/pdf";

/** jednoduché řádky z textových itemů — seskupení podle baseline Y s tolerancí */
interface LineItem { str: string; x: number; y: number; w: number; }

function itemsToLines(items: PdfjsTextItem[]): string[] {
  const parsed: LineItem[] = [];
  for (const it of items) {
    if (typeof it.str !== "string" || !it.str.trim()) continue;
    parsed.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width ?? 0 });
  }
  // podle Y sestupně (shora dolů), v řádku podle X vzestupně
  parsed.sort((a, b) => (Math.abs(a.y - b.y) > 2.5 ? b.y - a.y : a.x - b.x));
  const lines: string[] = [];
  let current: LineItem[] = [];
  const flush = () => {
    if (!current.length) return;
    current.sort((a, b) => a.x - b.x);
    let text = "";
    let prevEnd: number | null = null;
    for (const it of current) {
      if (prevEnd !== null && it.x - prevEnd > 1) text += " "; // mezera jen při reálné mezeře
      text += it.str;
      prevEnd = it.x + it.w;
    }
    lines.push(text);
    current = [];
  };
  for (const it of parsed) {
    if (current.length && Math.abs(current[current.length - 1].y - it.y) > 2.5) flush();
    current.push(it);
  }
  flush();
  return lines;
}

/** celý text PDF po stranách, se značkami "--- Strana N ---" */
async function extractPdfText(file: File, onProgress: (label: string) => void): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    onProgress(`Extrahuji stranu ${i}/${doc.numPages} (${file.name})`);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(`--- Strana ${i} ---\n${itemsToLines(content.items).join("\n")}`);
  }
  return pageTexts.join("\n\n");
}

export default function PdfCompare({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState<"a" | "b" | null>(null);
  const [parts, setParts] = useState<DiffPart[] | null>(null);
  const [stat, setStat] = useState("");
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [running, setRunning] = useState(false);
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const pickFile = (which: "a" | "b", arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setError(""); setParts(null); setStat("");
    if (which === "a") setFileA(f); else setFileB(f);
    setState("ready");
  };
  const onDrop = (which: "a" | "b") => (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragDepth.current = 0; setDragOver(null);
    pickFile(which, Array.from(e.dataTransfer.files ?? []));
  };
  const clearAll = () => { setFileA(null); setFileB(null); setError(""); setParts(null); setStat(""); setProgress(null); setState("idle"); };

  const run = async () => {
    if (!fileA || !fileB || running) return;
    setError(""); setParts(null); setStat(""); setRunning(true);
    setState("processing");
    try {
      setProgress({ pct: 5, label: "Načítám pdf.js…" });
      await ensurePdfjs();
      setProgress({ pct: 10, label: "Extrahuji text PDF A…" });
      const textA = await extractPdfText(fileA, (label) => setProgress({ pct: 10, label }));
      setProgress({ pct: 55, label: "Extrahuji text PDF B…" });
      const textB = await extractPdfText(fileB, (label) => setProgress({ pct: 55, label }));
      setProgress({ pct: 90, label: "Porovnávám…" });
      await loadScript("/tools/assets/js/lib/diff.min.js");
      const Diff = diffLib();
      if (!Diff) throw new Error("Knihovnu diff se nepodařilo načíst.");
      const res = Diff.diffLines(textA, textB);
      let added = 0, removed = 0;
      for (const p of res) {
        if (p.added) added += p.value.split("\n").filter(Boolean).length;
        else if (p.removed) removed += p.value.split("\n").filter(Boolean).length;
      }
      setParts(res);
      setStat(`+${added} -${removed} řádků`);
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setRunning(false);
      setState("success");
      toastSuccess("PDF byla porovnána");
    } catch (e) {
      setProgress(null); setRunning(false);
      const m = (e as Error).message || "Porovnání selhalo.";
      setError(m); setState("error", m);
    }
  };

  const dropzone = (which: "a" | "b") => {
    const file = which === "a" ? fileA : fileB;
    const inputRef = which === "a" ? inputARef : inputBRef;
    const title = `Přetáhněte sem PDF ${which === "a" ? "A (původní)" : "B (upravený)"}`;
    return (
      <div className={`dropzone${dragOver === which ? " dragover" : ""}`} id={`pc-drop-${which}`} role="button" tabIndex={0} aria-label={title}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(which); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(null); }}
        onDrop={onDrop(which)}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">{file ? `PDF ${which === "a" ? "A" : "B"}: ${file.name}` : title}</span>
        <span className="dz-hint">{file ? fmtSize(file.size) : "nebo klikněte pro výběr"}</span>
        <span className="dz-accept">Pouze .pdf · {which === "a" ? "PDF A" : "PDF B"}</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={(e) => { pickFile(which, Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
    );
  };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="two-col">
        {dropzone("a")}
        {dropzone("b")}
      </div>

      {(fileA || fileB) && (
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="pc-run" type="button" disabled={!fileA || !fileB || running} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v6H2" /><path d="M16 21v-6h6" /><path d="M22 6a10 10 0 0 0-18.36-2.6L2 9" /><path d="M2 18a10 10 0 0 0 18.36 2.6L22 15" /></svg> Porovnat PDF
          </button>
          <button className="btn btn-ghost" type="button" onClick={clearAll} disabled={running}>
            <Icon name="X" size={16} /> Vyčistit
          </button>
        </div>
      )}

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {parts && (
        <>
          <div className="row" aria-hidden="true" style={{ gap: "0.75rem", fontSize: "0.8rem" }}>
            <span style={{ color: "#fca5a5" }}>◀ jen v PDF A (odebráno)</span>
            <span style={{ color: "var(--vv-green)" }}>jen v PDF B (přidáno) ▶</span>
          </div>
          <div id="pc-out">
            {parts.map((p, pi) => {
              let text = p.value;
              if (text.charAt(text.length - 1) === "\n") text = text.slice(0, -1);
              const lines = text.split("\n");
              return lines.map((line, li) => {
                const kind = p.added ? "add" : p.removed ? "rem" : "same";
                return (
                  <div key={`${pi}-${li}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    {kind === "rem" ? <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#fca5a5", background: "rgba(239,68,68,0.15)" }}>{line}</div> : <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--muted,#9ca3af)", background: "transparent" }}>{kind === "same" ? line : ""}</div>}
                    {kind === "add" ? <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--vv-green)", background: "rgba(34,197,94,0.15)" }}>{line}</div> : <div style={{ padding: "0.1rem 0.75rem", fontFamily: "ui-monospace,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--muted,#9ca3af)", background: "transparent" }}>{kind === "same" ? line : ""}</div>}
                  </div>
                );
              });
            })}
          </div>
          <p id="pc-stat" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{stat}</p>
        </>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Porovnání běží lokálně přes pdf.js a jsdiff. Porovnává textovou vrstvu, ne vzhled — čistě grafické změny (obrázky, rozložení) se nezobrazí.</div>
    </div>
  );
}
