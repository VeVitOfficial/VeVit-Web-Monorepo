"use client";

// Excel/CSV do PDF — SheetJS (xlsx) přečte sešit, každý list se vyrenderuje
// jako textová mřížka do jsPDF: šířky sloupců dle nejdelšího obsahu, auto
// velikost písma, na šířku při velkých tabulkách, tučná hlavička se šedým
// podkladem, nová stránka na list / při přetečení řádků. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, fmtSize, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface XlsxUtils { sheet_to_json(sheet: unknown, opts: { header: 1 }): unknown[][]; }
interface XlsxWorkbook { SheetNames: string[]; Sheets: Record<string, unknown>; }
interface XlsxLib { read(data: Uint8Array, opts: { type: "array" }): XlsxWorkbook; utils: XlsxUtils; }
interface JsPdf {
  text(text: string, x: number, y: number): void;
  setFontSize(size: number): void;
  setFont(font: string, style: string): void;
  setFillColor(r: number, g: number, b: number): void;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  getTextWidth(text: string): number;
  addPage(): void;
  output(type: "blob"): Blob;
}
interface JsPdfCtor { new (opts: unknown): JsPdf; }

function xlsx(): XlsxLib { return (window as unknown as { XLSX: XlsxLib }).XLSX; }
function jsPdfCtor(): JsPdfCtor { return (window as unknown as { jsPDF: JsPdfCtor }).jsPDF; }

const ACCEPT = ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

const cellStr = (v: unknown): string => v == null ? "" : String(v);

/** Ořízne text na šířku buňky (trochu rezerva na padding). */
function fitText(pdf: JsPdf, s: string, maxW: number): string {
  if (!s) return "";
  if (pdf.getTextWidth(s) <= maxW) return s;
  let out = s;
  while (out.length > 1 && pdf.getTextWidth(out + "…") > maxW) out = out.slice(0, -1);
  return out + "…";
}

export default function ExcelToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addFile = async (arr: File[]) => {
    const f = arr.find((x) => /\.(xlsx|xls|csv)$/i.test(x.name) || x.type.includes("excel") || x.type === "text/csv");
    if (!f) { setError(t("invalid_type")); return; }
    setFile(f); setError(""); setDone(false); setBlobUrl(""); setSheetNames([]); setSelected([]); setState("ready");
    try {
      // seznam listů načteme hned po výběru (ať může uživatel vybírat)
      await loadScript("/tools/assets/js/lib/xlsx.full.min.js");
      const buf = await f.arrayBuffer();
      const wb = xlsx().read(new Uint8Array(buf), { type: "array" });
      setSheetNames(wb.SheetNames);
      setSelected(wb.SheetNames);
    } catch (e) {
      const m = (e as Error).message || "Soubor se nepodařilo přečíst.";
      setError(m); setState("error", m);
    }
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) void addFile(Array.from(e.target.files)); e.target.value = ""; };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); dragDepth.current = 0; if (e.dataTransfer.files) void addFile(Array.from(e.dataTransfer.files)); };
  const clearAll = () => { setFile(null); setError(""); setProgress(null); setDone(false); setBlobUrl(""); setSheetNames([]); setSelected([]); setState("idle"); };
  const toggleSheet = (name: string) => setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);

  const run = async () => {
    if (!file || !selected.length) return;
    setError(""); setDone(false); setState("processing"); setProgress({ pct: 10, label: "Načítám knihovny…" });
    try {
      await loadScript("/tools/assets/js/lib/xlsx.full.min.js");
      await loadScript("/tools/assets/js/lib/jspdf.umd.min.js");
      setProgress({ pct: 20, label: "Čtu sešit…" });
      const buf = await file.arrayBuffer();
      const wb = xlsx().read(new Uint8Array(buf), { type: "array" });
      const names = wb.SheetNames.filter((n) => selected.includes(n));
      const sheets = names.map((n) => ({ name: n, rows: xlsx().utils.sheet_to_json(wb.Sheets[n], { header: 1 }) as string[][] }));

      setProgress({ pct: 35, label: "Kreslím tabulky…" });
      const pageW = A4_W - MARGIN * 2;
      const pageHp = A4_H - MARGIN * 2;
      const pageHl = A4_W - MARGIN * 2; // landscape výška
      const totalCells = sheets.reduce((n, s) => n + s.rows.length, 0);
      let doneCells = 0;

      let pdf: JsPdf | null = null;
      for (const sheet of sheets) {
        const rows = sheet.rows.map((r) => (r as unknown[]).map(cellStr));
        if (!rows.length) continue;
        // šířky sloupců dle nejdelšího obsahu (cap 40 znaků na buňku)
        const cols = Math.max(...rows.map((r) => r.length));
        const maxChars = Array.from({ length: cols }, (_, ci) => Math.min(40, Math.max(4, ...rows.map((r) => (r[ci] ?? "").length))));
        // na šířku, pokud to na výšku při 10 pt nejde; jinak zmenšit písmo
        const needed10 = maxChars.reduce((a, c) => a + c * 10 * 0.55 + 8, 0);
        const landscape = needed10 > pageW;
        const avail = landscape ? A4_H - MARGIN * 2 : pageW;
        const fontSize = Math.max(6, Math.min(10, Math.floor(10 * (avail / needed10))));
        const scale = fontSize / 10;
        let widths = maxChars.map((c) => c * 10 * 0.55 * scale + 8 * scale);
        const totalW = widths.reduce((a, w) => a + w, 0);
        if (totalW > avail) widths = widths.map((w) => (w / totalW) * avail);
        const rowH = fontSize * 1.7;
        const pageH = landscape ? pageHl : pageHp;

        if (!pdf) pdf = new (jsPdfCtor())({ orientation: landscape ? "l" : "p", unit: "pt", format: "a4" });
        else pdf.addPage();

        let y = MARGIN;
        // název listu
        pdf.setFontSize(12); pdf.setFont("helvetica", "bold");
        pdf.text(sheet.name, MARGIN, y + 10);
        y += 24;

        rows.forEach((row, ri) => {
          doneCells += 1;
          if (ri % 25 === 0) setProgress({ pct: 35 + Math.round((55 * doneCells) / Math.max(1, totalCells)), label: `Kreslím ${sheet.name} (${ri}/${rows.length})` });
          if (y + rowH > MARGIN + pageH) { pdf!.addPage(); y = MARGIN; }
          let x = MARGIN;
          const header = ri === 0;
          if (header) { pdf!.setFillColor(232, 232, 232); pdf!.rect(x, y, widths.reduce((a, w) => a + w, 0), rowH, "F"); }
          pdf!.setFont("helvetica", header ? "bold" : "normal");
          pdf!.setFontSize(fontSize);
          row.forEach((cell, ci) => {
            const w = widths[ci] ?? 0;
            pdf!.text(fitText(pdf!, cell, w - 6 * scale), x + 4 * scale, y + rowH - fontSize * 0.55);
            x += w;
          });
          y += rowH;
        });
      }
      if (!pdf) throw new Error("Vybrané listy neobsahují žádná data.");
      setProgress({ pct: 95, label: "Ukládám PDF…" });
      const blob = await pdf.output("blob");
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Tabulka byla převedena na PDF");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Převod do PDF selhal.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = "tabulka.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className={`dropzone${dragOver ? " dragover" : ""}`} id="ep-drop" role="button" tabIndex={0} aria-label="Přetáhněte sem tabulku"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current += 1; setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragDepth.current -= 1; if (dragDepth.current <= 0) setDragOver(false); }}
        onDrop={onDrop}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg></span>
        <span className="dz-title">Přetáhněte sem tabulku</span>
        <span className="dz-hint">nebo klikněte pro výběr</span>
        <span className="dz-accept">.xlsx, .xls, .csv · jeden soubor</span>
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

      {sheetNames.length > 1 && (
        <div className="stack-sm" id="ep-sheets">
          <span className="field-label">Listy k převodu (ve výchozím stavu všechny)</span>
          {sheetNames.map((n) => (
            <label key={n} className="checkbox-row"><input type="checkbox" checked={selected.includes(n)} onChange={() => toggleSheet(n)} /> <span>{n}</span></label>
          ))}
        </div>
      )}

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="ep-run" type="button" disabled={!file || !selected.length} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></svg> Převést na PDF
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">tabulka.pdf</span><span className="rc-sub">{selected.length} {selected.length === 1 ? "list" : "listy/listů"}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Převod běží lokálně přes SheetJS a jsPDF — vzorce se převádějí na své hodnoty, soubor neopustí váš počítač.</div>
    </div>
  );
}
