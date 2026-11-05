"use client";

// PDF do Excelu — pdf.js textová vrstva → sdílený layout engine
// (src/lib/pdf-text-layout.ts) detekuje tabulky (konzistentní mřížka buněk,
// faktury) → každá tabulka = jeden list "Strana N" v XLSX (SheetJS). Když
// tabulky nejsou, fallback: odstavce do jednoho sloupce textu. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";
import {
  buildPageBlocks,
  type PdfTextItem, type PageBlocks,
} from "@/lib/pdf-text-layout";

interface PdfjsTextItem { str: string; transform: number[]; width: number; height: number; fontName?: string; }
interface PdfjsTextContent { items: PdfjsTextItem[]; }
interface PdfjsPage { getTextContent(): Promise<PdfjsTextContent>; getViewport(opts: { scale: number }): { width: number; height: number }; }
interface PdfjsDoc { numPages: number; getPage(n: number): Promise<PdfjsPage>; }
interface PdfjsLib { GlobalWorkerOptions: { workerSrc: string }; getDocument(opts: { data: Uint8Array }): { promise: Promise<PdfjsDoc> }; }
interface XlsxUtils {
  aoa_to_sheet(rows: string[][]): unknown;
  book_new(): unknown;
  book_append_sheet(book: unknown, sheet: unknown, name: string): void;
}
interface XlsxLib { utils: XlsxUtils; write(book: unknown, opts: { type: "array"; bookType: "xlsx" }): ArrayBuffer; }

function pdfjs(): PdfjsLib { return (window as unknown as { pdfjsLib: PdfjsLib }).pdfjsLib; }
function xlsx(): XlsxLib { return (window as unknown as { XLSX: XlsxLib }).XLSX; }

const ACCEPT = ".pdf,application/pdf";
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function PdfToExcel({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const ensurePdfjs = async () => {
    if ((window as unknown as { pdfjsLib?: unknown }).pdfjsLib) return;
    await loadScript("/tools/assets/js/lib/pdf.min.js");
    pdfjs().GlobalWorkerOptions.workerSrc = "/tools/assets/js/lib/pdf.worker.min.js";
  };

  const addFile = (arr: File[]) => {
    const f = arr.find((x) => x.name.toLowerCase().endsWith(".pdf") || x.type === "application/pdf");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("ready");
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setInfo(""); setDone(false); setBlobUrl(""); setState("idle"); };

  const run = async () => {
    if (!file) return;
    setError(""); setInfo(""); setDone(false); setBlobUrl(""); setState("processing"); setProgress({ pct: 5, label: "Načítám knihovny…" });
    try {
      await ensurePdfjs();
      await loadScript("/tools/assets/js/lib/xlsx.full.min.js");
      setProgress({ pct: 15, label: "Načítám PDF…" });
      const buf = await file.arrayBuffer();
      const doc = await pdfjs().getDocument({ data: new Uint8Array(buf) }).promise;
      const total = doc.numPages;
      const tables: { name: string; rows: string[][] }[] = [];
      const paragraphs: string[] = [];
      for (let i = 1; i <= total; i++) {
        setProgress({ pct: 15 + Math.round((60 * i) / total), label: `Analyzuji stranu ${i}/${total}` });
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });
        const items: PdfTextItem[] = content.items
          .filter((it) => typeof it.str === "string" && it.str.trim())
          .map((it) => ({
            str: it.str,
            x: it.transform[4],
            y: it.transform[5],
            width: it.width,
            height: it.height,
            fontName: it.fontName,
          }));
        const blocks: PageBlocks = buildPageBlocks({ items, width: viewport.width, height: viewport.height });
        let tableOnPage = 0;
        for (const b of blocks.blocks) {
          if (b.kind === "table") {
            tableOnPage += 1;
            // název listu: "Strana N", více tabulek na straně → "Strana N-2"
            tables.push({ name: tableOnPage === 1 ? `Strana ${i}` : `Strana ${i}-${tableOnPage}`, rows: b.rows });
          } else if (b.text.trim()) {
            paragraphs.push(b.text.trim());
          }
        }
      }

      const X = xlsx();
      const book = X.utils.book_new();
      if (tables.length) {
        setInfo(`Detekováno ${tables.length} ${tables.length === 1 ? "tabulka" : tables.length < 5 ? "tabulky" : "tabulek"} — každá bude jako samostatný list.`);
        for (const tb of tables) X.utils.book_append_sheet(book, X.utils.aoa_to_sheet(tb.rows), tb.name.slice(0, 31));
      } else if (paragraphs.length) {
        setInfo("Tabulky nenalezeny — exportuji text.");
        X.utils.book_append_sheet(book, X.utils.aoa_to_sheet(paragraphs.map((p) => [p])), "Text");
      } else {
        setProgress(null);
        setInfo("PDF neobsahuje textovou vrstvu (pravděpodobně je to sken).");
        setState("error", "PDF neobsahuje textovou vrstvu.");
        return;
      }

      setProgress({ pct: 85, label: "Zapisuji XLSX…" });
      const out = X.write(book, { type: "array", bookType: "xlsx" });
      const blob = new Blob([out], { type: XLSX_MIME });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("PDF bylo převedeno do Excelu");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod do Excelu selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "tabulky.xlsx"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="px-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem PDF soubor"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem PDF soubor</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">Pouze .pdf · jeden soubor</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT} aria-hidden="true" onChange={onInputChange} />
      </div>

      {file && (
        <div className="file-list" aria-label="Vybraný soubor">
          <div className="file-item">
            <span className="fi-ico"><Icon name="File" size={18} /></span>
            <span className="fi-meta"><span className="fi-name">{file.name}</span><span className="fi-size">{fmtSize(file.size)}</span></span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={clearAll}><Icon name="X" size={16} /></button>
          </div>
        </div>
      )}

      <div className="stack-sm" id="px-work">
        <p className="muted" id="px-info" style={{ fontSize: "0.85rem" }}>{info || "Nástroj najde v PDF tabulky (faktury, výpisy) a převede je do listů XLSX. Bez tabulek exportuje text jako jeden sloupec — náhrada, ať nástroj není zbytečný."}</p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-touch" id="px-run" type="button" disabled={!file} onClick={run}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg> Převést do Excelu
          </button>
        </div>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg></span>
          <div className="rc-meta"><span className="rc-title">tabulky.xlsx</span><span className="rc-sub">{info}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes pdf.js a SheetJS — soubor neopustí váš počítač.</div>
    </div>
  );
}
