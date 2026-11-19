"use client";

// Rozdělení Excel sešitu, čistě client-side přes SheetJS (xlsx.full.min.js,
// lazy-load z public). Dva režimy:
//  - po řádcích: vybraný list se rozkouskuje po N řádcích (hlavička = 1. řádek
//    se opakuje v každé části), každá část = vlastní .xlsx,
//  - každý list zvlášť: každý list se uloží jako samostatný .xlsx.
// Výstup se balí do ZIPu přes JSZip.
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, loadScript, toastSuccess } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, ResultArea, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".xlsx", ".xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
const MAX = 50 * 1024 * 1024;

// ── Typy UMD SheetJS (XLSX) ──────────────────────────────────────────────
interface XlsxWS { [key: string]: unknown; }
interface XlsxWB { SheetNames: string[]; Sheets: Record<string, XlsxWS>; }
interface XLSXLike {
  read(data: ArrayBuffer, opts?: { type?: string }): XlsxWB;
  write(wb: XlsxWB, opts: { bookType: string; type: string }): unknown;
  utils: {
    sheet_to_json(ws: XlsxWS, opts?: { header?: number; raw?: boolean }): unknown[][];
    book_new(): XlsxWB;
    book_append_sheet(wb: XlsxWB, ws: XlsxWS, name?: string): void;
    aoa_to_sheet(aoa: unknown[][]): XlsxWS;
  };
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

// ── Typy UMD JSZip ───────────────────────────────────────────────────────
interface JSZipLike {
  file(name: string, data: Blob | string | Uint8Array | ArrayBuffer): JSZipLike;
  generateAsync(opts: { type: "blob" }): Promise<Blob>;
}
type JSZipCtor = new () => JSZipLike;
function zipCtor(): JSZipCtor | undefined {
  return (window as unknown as { JSZip?: JSZipCtor }).JSZip;
}
async function ensureZip(): Promise<JSZipCtor> {
  if (!zipCtor()) await loadScript("/tools/assets/js/lib/jszip.min.js");
  const C = zipCtor();
  if (!C) throw new Error("Knihovnu JSZip se nepodařilo načíst.");
  return C;
}

function baseName(name: string): string {
  return (name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_").trim() || "excel");
}
function safeSheetName(name: string): string {
  return name.replace(/[\\/:*?"<>|[\]]/g, "_").trim() || "list";
}

type Mode = "rows" | "sheets";

export default function SplitExcel({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [sheetRows, setSheetRows] = useState(0); // datové řádky vybraného listu (bez hlavičky)
  const [mode, setMode] = useState<Mode>("rows");
  const [rowsPerFile, setRowsPerFile] = useState(1000);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [chunksInfo, setChunksInfo] = useState<string | null>(null);
  const wbRef = useRef<XlsxWB | null>(null);
  const xlsxRef = useRef<XLSXLike | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setChunksInfo(null); wbRef.current = null; setSheetNames([]); setSheet(""); setSheetRows(0);
    setToolState("idle");
  };

  const onFiles = async (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setChunksInfo(null);
    setProgress({ pct: 10, label: "Načítám sešit…" });
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
      const aoa = X.utils.sheet_to_json(wb.Sheets[first], { header: 1, raw: false });
      setSheetRows(Math.max(0, aoa.length - 1));
      setFile(f);
      setProgress(null);
      setToolState("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Soubor se nepodařilo načíst.";
      Promise.resolve().then(() => { setProgress(null); setError(msg); setToolState("error"); });
    }
  };

  const onSheetChange = (name: string) => {
    setSheet(name);
    const X = xlsxRef.current;
    const wb = wbRef.current;
    if (X && wb && wb.Sheets[name]) {
      const aoa = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false });
      setSheetRows(Math.max(0, aoa.length - 1));
    } else {
      setSheetRows(0);
    }
  };

  /** Náhled počtu částí v režimu řádků. */
  const chunkCount = Math.max(1, Math.ceil(sheetRows / Math.max(1, Math.round(rowsPerFile) || 1)));

  const run = async () => {
    const X = xlsxRef.current ?? (await ensureXlsx());
    const wb = wbRef.current;
    if (!file || !wb) return;
    setError(null); setResult(null); setRunning(true);
    setProgress({ pct: 5, label: "Načítám knihovny…" });
    setToolState("processing");
    try {
      const ZipCtor = await ensureZip();
      const zip = new ZipCtor();
      let total = 0;
      const base = baseName(file.name);
      if (mode === "rows") {
        const ws = wb.Sheets[sheet];
        if (!ws) throw new Error("Vybraný list neexistuje.");
        const aoa = X.utils.sheet_to_json(ws, { header: 1, raw: false });
        if (aoa.length < 2) throw new Error("List nemá dost řádků k rozdělení.");
        const header = aoa[0];
        const body = aoa.slice(1);
        const per = Math.max(1, Math.round(rowsPerFile) || 1);
        total = Math.ceil(body.length / per);
        for (let i = 0; i < total; i++) {
          const chunk = body.slice(i * per, (i + 1) * per);
          if (!chunk.length) break;
          const nwb = X.utils.book_new();
          X.utils.book_append_sheet(nwb, X.utils.aoa_to_sheet([header, ...chunk]), "List1");
          zip.file(`${base}-cast-${String(i + 1).padStart(3, "0")}.xlsx`, X.write(nwb, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
          Promise.resolve().then(() => setProgress({ pct: 10 + Math.round((75 * (i + 1)) / total), label: `Část ${i + 1}/${total}` }));
        }
      } else {
        total = wb.SheetNames.length;
        wb.SheetNames.forEach((name, i) => {
          const nwb = X.utils.book_new();
          X.utils.book_append_sheet(nwb, wb.Sheets[name], name);
          zip.file(`${safeSheetName(name)}.xlsx`, X.write(nwb, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
          Promise.resolve().then(() => setProgress({ pct: 10 + Math.round((75 * (i + 1)) / total), label: `List ${i + 1}/${total}: ${name}` }));
        });
      }
      Promise.resolve().then(() => setProgress({ pct: 90, label: "Komprimuji ZIP…" }));
      const blob = await zip.generateAsync({ type: "blob" });
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob, filename: "excel-casti.zip" });
        setChunksInfo(`Vytvořeno ${total} ${total === 1 ? "soubor" : total < 5 ? "soubory" : "souborů"}.`);
        toastSuccess(locale === "en" ? "Workbook split" : "Sešit rozdělen");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Rozdělení selhalo.";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
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
        <span className="dz-hint">XLSX / XLS · rozdělení po řádcích nebo po listech · ZIP výstup</span>
      </Dropzone>

      {file ? (
        <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} />
      ) : null}

      <div className={file ? "" : " hidden"} id="sx-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="sx-mode">Režim rozdělení</label>
          <select className="select" id="sx-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="rows">Rozdělit po řádcích</option>
            <option value="sheets">Každý list zvlášť</option>
          </select>
        </div>
        {mode === "rows" ? (
          <>
            <div className="stack-sm">
              <label className="field-label" htmlFor="sx-sheet">List</label>
              <select className="select" id="sx-sheet" value={sheet} onChange={(e) => onSheetChange(e.target.value)}>
                {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="stack-sm">
              <label className="field-label" htmlFor="sx-rows">Řádků (bez hlavičky) na soubor</label>
              <input className="input" id="sx-rows" type="number" min={1} value={rowsPerFile} style={{ width: "8rem" }} onChange={(e) => setRowsPerFile(Number(e.target.value) || 1)} />
            </div>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              List „{sheet}“ má {sheetRows} datových řádků → vznikne {chunkCount} {chunkCount === 1 ? "soubor" : chunkCount < 5 ? "soubory" : "souborů"} (hlavička se opakuje).
            </p>
          </>
        ) : (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Sešit má {sheetNames.length} {sheetNames.length === 1 ? "list" : sheetNames.length < 5 ? "listy" : "listů"} → každý se uloží jako samostatný .xlsx.
          </p>
        )}
        <button className="btn btn-primary btn-touch" id="sx-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
          </svg>{" "}
          Rozdělit
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {chunksInfo ? <p className="muted" style={{ fontSize: "0.85rem" }}>{chunksInfo}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} title={t("result_ready")} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Zpracování přes SheetJS + JSZip (lazy-load), vše běží lokálně v prohlížeči. Vzhled/buňkové styly se nezachovávají, jen data.
      </p>
    </div>
  );
}
