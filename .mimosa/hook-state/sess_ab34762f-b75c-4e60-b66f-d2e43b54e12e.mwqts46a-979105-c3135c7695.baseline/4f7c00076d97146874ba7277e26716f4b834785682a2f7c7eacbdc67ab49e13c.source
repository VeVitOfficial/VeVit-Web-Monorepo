"use client";

// Převod CSV → XLSX, čistě client-side přes SheetJS (xlsx.full.min.js).
// CSV načte přímo XLSX.read (detekuje oddělovač), sloupce dostanou automaticky
// dopočtenou šířku (!cols wch podle nejdelší hodnoty). Styly hlavičky
// (tučné písmo) community build SheetJS nepodporuje — záměrně vynechány.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess, loadScript } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, ResultArea, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".csv", "text/csv", "application/vnd.ms-excel", ".txt"];
const MAX = 50 * 1024 * 1024;

// ── Typy UMD SheetJS (XLSX) ──────────────────────────────────────────────
interface XlsxWS { ["!cols"]?: { wch: number }[]; [key: string]: unknown; }
interface XlsxWB { SheetNames: string[]; Sheets: Record<string, XlsxWS>; }
interface XLSXLike {
  read(data: string, opts?: { type?: string }): XlsxWB;
  write(wb: XlsxWB, opts: { bookType: string; type: string }): unknown;
  utils: { sheet_to_json(ws: XlsxWS, opts?: { header?: number; raw?: boolean }): unknown[][]; };
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

export default function CsvToExcel({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setInfo(null);
    setToolState("idle");
  };
  const onFiles = (arr: File[]) => {
    setError(null); setResult(null); setInfo(null);
    setFile(arr[0] ?? null);
    setToolState("ready");
  };

  const run = async () => {
    if (!file) return;
    setError(null); setResult(null); setRunning(true);
    setProgress({ pct: 10, label: "Načítám SheetJS…" });
    setToolState("processing");
    try {
      const X = await ensureXlsx();
      Promise.resolve().then(() => setProgress({ pct: 30, label: "Parseuji CSV…" }));
      const text = await file.text();
      // XLSX.read umí CSV přímo (string) a sám detekuje oddělovač (; , tab…).
      const wb = X.read(text, { type: "string" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("CSV se nepodařilo naparsovat.");

      // Automatické šířky sloupců: max. délka textové reprezentace buňky ve sloupci.
      const aoa = X.utils.sheet_to_json(ws, { header: 1, raw: false });
      let cols = 0;
      for (const row of aoa) if (row.length > cols) cols = row.length;
      const widths: number[] = [];
      for (let c = 0; c < cols; c++) {
        let max = 0;
        for (const row of aoa) {
          const v = row[c];
          if (v == null) continue;
          const len = String(v).length;
          if (len > max) max = len;
        }
        widths.push(Math.max(4, Math.min(60, max + 2))); // wch ≈ počet znaků, s rezervou
      }
      ws["!cols"] = widths.map((w) => ({ wch: w }));

      Promise.resolve().then(() => setProgress({ pct: 70, label: "Zapisuji XLSX…" }));
      const out = X.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob, filename: "prevedeno.xlsx" });
        setInfo(aoa.length ? `${rowsLabel(aoa.length)} · ${cols} ${cols === 1 ? "sloupec" : cols < 5 ? "sloupce" : "sloupců"}` : null);
        toastSuccess(locale === "en" ? "CSV converted to XLSX" : "CSV převedeno na XLSX");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Převod selhal.";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={MAX}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte CSV soubor" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte CSV soubor</span>
        <span className="dz-hint">Převede na XLSX s automatickou šířkou sloupců</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="ce-work">
        <button className="btn btn-primary btn-touch" id="ce-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
          </svg>{" "}
          Převést na XLSX
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {info ? <p className="muted" style={{ fontSize: "0.85rem" }}>{info}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} title={t("result_ready")} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Oddělovač (čárka/středník/tab) detekuje SheetJS automaticky. Šířky sloupců se dopočítají z nejdelších hodnot. Běží lokálně.
      </p>
    </div>
  );
}

/** Český label počtu řádků (včetně hlavičky). */
function rowsLabel(n: number): string {
  return `${n} ${n === 1 ? "řádek" : n < 5 ? "řádky" : "řádků"} (včetně hlavičky)`;
}
