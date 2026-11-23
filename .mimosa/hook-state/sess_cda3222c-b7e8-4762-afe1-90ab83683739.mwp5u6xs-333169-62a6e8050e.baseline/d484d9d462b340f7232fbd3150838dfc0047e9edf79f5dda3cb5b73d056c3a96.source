"use client";

// Převod XML → XLSX, čistě client-side. XML se parsuje nativním DOMParserem
// (žádná externí knihovna), hledají se opakující se potomci kořene:
//  - všechny děti kořene mají stejný tagName → řádky (buňky = textContent
//    dceřiných elementů; listový element = jedna buňka s vlastním textem),
//  - jinak fallback: všechny listové elementy jako dvojice klíč→hodnota.
// Výsledek se zapíše přes SheetJS (xlsx.full.min.js, lazy-load).
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, loadScript, toastSuccess } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, ResultArea, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".xml", "application/xml", "text/xml"];
const MAX = 25 * 1024 * 1024;

// ── Typy UMD SheetJS (XLSX) ──────────────────────────────────────────────
interface XlsxWS { [key: string]: unknown; }
interface XlsxWB { SheetNames: string[]; Sheets: Record<string, XlsxWS>; }
interface XLSXLike {
  write(wb: XlsxWB, opts: { bookType: string; type: string }): unknown;
  utils: {
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

/** Text obsažený v elementu (ořezaný o okolní whitespace). */
function cellText(el: Element): string {
  return (el.textContent ?? "").trim();
}

/** Rozseká XML dokument na AOA (pole řádků). */
function xmlToAoa(doc: XMLDocument): { aoa: unknown[][]; mode: string } {
  const root = doc.documentElement;
  if (!root) throw new Error("XML nemá kořenový element.");
  const kids = Array.from(root.children);
  if (!kids.length) {
    // Kořen bez elementových dětí → jedna buňka s textem kořene.
    return { aoa: [["hodnota"], [cellText(root)]], mode: "list" };
  }
  const sameTag = kids.every((k) => k.tagName === kids[0].tagName);
  if (sameTag) {
    // Řádkový režim: každé dítě kořene = jeden řádek.
    const rows: string[][] = [];
    let maxCols = 0;
    for (const rowEl of kids) {
      const cells = rowEl.children.length
        ? Array.from(rowEl.children).map(cellText)
        : [cellText(rowEl)]; // listový element → jediná buňka
      if (cells.length > maxCols) maxCols = cells.length;
      rows.push(cells);
    }
    // Hlavička z názvů tagů prvního řádku (pokud má elementové děti).
    const first = kids[0];
    const header: string[] = [];
    if (first.children.length) {
      for (const c of Array.from(first.children)) header.push(c.tagName);
    }
    while (header.length < maxCols) header.push("col" + (header.length + 1));
    return { aoa: [header, ...rows], mode: "rows" };
  }
  // Fallback: všechny listové elementy jako klíč → hodnota (2 sloupce).
  const out: unknown[][] = [["Klíč", "Hodnota"]];
  const walk = (el: Element, path: string) => {
    const kidsEl = Array.from(el.children);
    if (!kidsEl.length) {
      out.push([path || el.tagName, cellText(el)]);
      return;
    }
    for (const k of kidsEl) walk(k, path ? `${path}/${k.tagName}` : k.tagName);
  };
  walk(root, "");
  return { aoa: out, mode: "kv" };
}

export default function XmlToExcel({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  /** AOA z naparsovaného XML — drží se v refu, převod probíhá až po kliknutí. */
  const [aoa, setAoa] = useState<unknown[][] | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setInfo(null); setAoa(null);
    setToolState("idle");
  };

  const onFiles = async (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setInfo(null);
    try {
      const text = await f.text();
      const doc = new DOMParser().parseFromString(text, "application/xml");
      const perr = doc.getElementsByTagName("parsererror");
      if (perr.length) throw new Error("XML soubor se nepodařilo naparsovat — zkontrolujte, že je well-formed.");
      const { aoa: data, mode } = xmlToAoa(doc);
      if (data.length < 2) throw new Error("V XML nebyla nalezena žádná data k převodu.");
      setAoa(data);
      setInfo(mode === "rows"
        ? `Nalezeny opakující se elementy → ${data.length - 1} datových řádků.`
        : "Opakující se elementy nenalezeny → převádím jako dvojice klíč → hodnota.");
      setFile(f);
      setToolState("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Soubor se nepodařilo načíst.";
      setFile(null); setAoa(null); setInfo(null);
      setError(msg);
      setToolState("error");
    }
  };

  const run = async () => {
    if (!aoa) return;
    setError(null); setResult(null); setRunning(true);
    setProgress({ pct: 10, label: "Načítám SheetJS…" });
    setToolState("processing");
    try {
      const X = await ensureXlsx();
      Promise.resolve().then(() => setProgress({ pct: 60, label: "Zapisuji XLSX…" }));
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoa), "Data");
      const out = X.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob, filename: "prevedeno.xlsx" });
        toastSuccess(locale === "en" ? "XML converted to XLSX" : "XML převedeno na XLSX");
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
        ariaLabel="Přetáhněte XML soubor" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m9 13 3 3 5-5" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte XML soubor</span>
        <span className="dz-hint">Převod do tabulky XLSX (opakující se elementy = řádky)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      {info ? <p className="muted" style={{ fontSize: "0.85rem" }}>{info}</p> : null}

      <div className={aoa ? "" : " hidden"} id="xe-work">
        <button className="btn btn-primary btn-touch" id="xe-run" type="button" disabled={!aoa || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m8 13 3 3 5-5" />
          </svg>{" "}
          Převést na XLSX
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} title={t("result_ready")} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Parsování nativním DOMParserem, zápis přes SheetJS. Texty buněk se berou z textContent. Běží lokálně.
      </p>
    </div>
  );
}
