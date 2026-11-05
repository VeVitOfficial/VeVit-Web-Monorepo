"use client";

// Převod XLSX → CSV, čistě client-side přes SheetJS (xlsx.full.min.js).
// Po nahrání se načte sešit, vybere se list a oddělovač (, ; tab),
// náhled CSV v textarea + kopírování + stažení pojmenované po listu.
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, loadScript, toastSuccess, Icon } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".xlsx", ".xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
const MAX = 50 * 1024 * 1024;

// ── Typy UMD SheetJS (XLSX) ──────────────────────────────────────────────
interface XlsxWS { [key: string]: unknown; }
interface XlsxWB { SheetNames: string[]; Sheets: Record<string, XlsxWS>; }
interface XLSXLike {
  read(data: ArrayBuffer, opts?: { type?: string }): XlsxWB;
  utils: { sheet_to_csv(ws: XlsxWS, opts?: { FS?: string }): string; };
}
function xlsxLib(): XLSXLike | undefined {
  return (window as unknown as { XLSX?: XLSXLike }).XLSX;
}
async function ensureXlsx(): Promise<XLSXLike> {
  if (!xlsxLib()) await loadScript("/tools/assets/js/lib/xlsx.full.min.js");
  const X = xlsxLib();
  if (!X) throw new Error("Knihovnu SheetJS (xlsx) se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.");
  return X;
}

/** Název souboru z názvu listu — jen bezpečné znaky. */
function fileNameFromSheet(sheet: string): string {
  const s = sheet.replace(/[\\/:*?"<>|]/g, "_").trim();
  return (s || "list") + ".csv";
}

export default function ExcelToCsv({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [delim, setDelim] = useState<"," | ";" | "\t">(",");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wbRef = useRef<XlsxWB | null>(null);
  const xlsxRef = useRef<XLSXLike | null>(null);

  const reset = () => {
    setFile(null); setSheetNames([]); setSheet(""); setCsv(""); setError(null); setBusy(false);
    wbRef.current = null;
    setToolState("idle");
  };

  /** Přegeneruje CSV text pro daný list a oddělovač. */
  const buildCsv = (sheetName: string, d: string): string => {
    const X = xlsxRef.current;
    const wb = wbRef.current;
    if (!X || !wb || !sheetName) return "";
    const ws = wb.Sheets[sheetName];
    if (!ws) return "";
    return X.utils.sheet_to_csv(ws, { FS: d });
  };

  const onFiles = async (arr: File[]) => {
    const f = arr[0];
    setError(null); setCsv(""); setBusy(true);
    try {
      const X = await ensureXlsx();
      xlsxRef.current = X;
      const buf = await f.arrayBuffer();
      const wb = X.read(buf, { type: "array" });
      if (!wb.SheetNames.length) throw new Error("Sešit neobsahuje žádný list.");
      wbRef.current = wb;
      setSheetNames(wb.SheetNames);
      const first = wb.SheetNames[0];
      setSheet(first);
      setCsv(X.utils.sheet_to_csv(wb.Sheets[first], { FS: delim }));
      setFile(f);
      setToolState("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Soubor se nepodařilo načíst (není to platný Excel?).";
      setFile(null); wbRef.current = null;
      setError(msg);
      setToolState("error");
    } finally {
      setBusy(false);
    }
  };

  const onSheet = (name: string) => {
    setSheet(name);
    setCsv(buildCsv(name, delim));
  };
  const onDelim = (d: typeof delim) => {
    setDelim(d);
    setCsv(buildCsv(sheet, d));
  };

  const onCopy = async () => { if (csv) { await copy(csv); } };

  const download = () => {
    if (!csv) return;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM kvůli češtině v Excelu
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileNameFromSheet(sheet || "list");
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastSuccess(locale === "en" ? "CSV downloaded" : "CSV staženo");
  };

  return (
    <div className="stack" style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={MAX}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte Excel soubor" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte Excel soubor</span>
        <span className="dz-hint">XLSX / XLS → CSV, volba listu a oddělovače</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      {file ? (
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }} id="ec-work">
          <div className="stack-sm">
            <label className="field-label" htmlFor="ec-sheet">List</label>
            <select className="select" id="ec-sheet" value={sheet} onChange={(e) => onSheet(e.target.value)}>
              {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="ec-delim">Oddělovač</label>
            <select className="select" id="ec-delim" value={delim} onChange={(e) => onDelim(e.target.value as typeof delim)}>
              <option value=",">Čárka (,)</option>
              <option value=";">Středník (;)</option>
              <option value={"\t"}>Tabulátor</option>
            </select>
          </div>
        </div>
      ) : null}

      {busy ? <p className="muted">Načítám sešit…</p> : null}

      {file && !busy ? (
        <div className="stack-sm">
          <label className="field-label" htmlFor="ec-out">CSV náhled</label>
          <textarea className="textarea mono" id="ec-out" rows={12} readOnly value={csv} />
        </div>
      ) : null}

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      {file && !busy ? (
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" id="ec-dl" type="button" disabled={!csv} onClick={download}>
            <Icon name="Download" size={16} /> Stáhnout {fileNameFromSheet(sheet || "list")}
          </button>
          <button className="btn btn-secondary" id="ec-copy" type="button" disabled={!csv} onClick={onCopy}>
            {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
          </button>
        </div>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Stahovaný CSV má UTF-8 BOM, aby čeština v Excelu správně zobrazila. Hodnoty s oddělovači/uvozovkami se escapují. Běží lokálně, soubor se nikam neodesílá.
      </p>
    </div>
  );
}
