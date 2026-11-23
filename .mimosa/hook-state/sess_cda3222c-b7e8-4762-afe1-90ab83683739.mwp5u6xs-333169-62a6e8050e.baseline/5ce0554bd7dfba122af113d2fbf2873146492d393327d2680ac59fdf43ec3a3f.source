"use client";

// Rozdělení CSV na více částí, čistě client-side.
// Dva režimy: podle počtu řádků na soubor / na N stejných souborů.
// Naivní řádkový parser respektuje uvozovky (nový řádek v uvozovkách zůstává
// v rámci jednoho záznamu). První řádek = hlavička, opakuje se v každé části.
// Části se balí do ZIPu přes JSZip (lazy-load).
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, loadScript, toastSuccess } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, ResultArea, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".csv", "text/csv", "application/vnd.ms-excel", ".txt"];
const MAX = 50 * 1024 * 1024;

// ── Typy UMD JSZip (líně načítaného) ─────────────────────────────────────
interface JSZipLike {
  file(name: string, data: Blob | string | Uint8Array): JSZipLike;
  generateAsync(opts: { type: "blob" }): Promise<Blob>;
}
type JSZipCtor = new () => JSZipLike;
function zipCtor(): JSZipCtor | undefined {
  return (window as unknown as { JSZip?: JSZipCtor }).JSZip;
}
async function ensureZip(): Promise<JSZipCtor> {
  if (!zipCtor()) await loadScript("/tools/assets/js/lib/jszip.min.js");
  const C = zipCtor();
  if (!C) throw new Error("Knihovnu JSZip se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.");
  return C;
}

/**
 * Naivní rozdělení CSV textu na logické řádky se sledováním stavu v uvozovkách:
 * nový řádek uvnitř uvozovek je součástí záznamu, "" je escapovaná uvozovka.
 * Vrací řádky jako surové stringy (bez zásahu do obsahu polí).
 */
function splitCsvLines(text: string): string[] {
  const norm = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i];
    if (inQuote) {
      if (c === '"') {
        if (norm[i + 1] === '"') { cur += '""'; i++; continue; }
        inQuote = false; cur += c; continue;
      }
      cur += c; continue;
    }
    if (c === '"') { inQuote = true; cur += c; continue; }
    if (c === "\n") { lines.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.length) lines.push(cur);
  // zahodit prázdné koncové řádky
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  return lines;
}

/** Základ názvu souboru bez přípony, očištěný pro názvy v ZIPu. */
function baseName(name: string): string {
  return (name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "_").trim() || "data");
}

type Mode = "rows" | "files";

export default function SplitCsv({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [rowsCount, setRowsCount] = useState(0); // počet datových řádků (bez hlavičky)
  const linesRef = useRef<string[] | null>(null); // hlavička + datové řádky
  const [mode, setMode] = useState<Mode>("rows");
  const [count, setCount] = useState(1000);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [chunksInfo, setChunksInfo] = useState<string | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setChunksInfo(null); linesRef.current = null; setRowsCount(0);
    setToolState("idle");
  };

  const onFiles = async (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setChunksInfo(null);
    try {
      const text = await f.text();
      const lines = splitCsvLines(text);
      if (lines.length < 2) {
        setError("CSV nemá dost řádků k rozdělení (potřeba hlavičku a alespoň 1 datový řádek).");
        setToolState("error");
        return;
      }
      linesRef.current = lines;
      setRowsCount(lines.length - 1);
      setFile(f);
      setToolState("ready");
    } catch {
      setError("Soubor se nepodařilo načíst.");
      setToolState("error");
    }
  };

  /** Kolik částí při aktuálním nastavení vznikne (náhled). */
  const chunkCount = (() => {
    const n = Math.max(1, Math.round(count) || 1);
    if (mode === "rows") return Math.ceil(rowsCount / n);
    return Math.min(n, Math.max(1, rowsCount));
  })();

  const run = async () => {
    const lines = linesRef.current;
    if (!file || !lines) return;
    const header = lines[0];
    const body = lines.slice(1);
    const n = Math.max(1, Math.round(count) || 1);
    const per = mode === "rows" ? n : Math.ceil(body.length / Math.min(n, body.length));
    if (per < 1) return;
    setError(null); setResult(null); setRunning(true);
    setProgress({ pct: 5, label: "Načítám JSZip…" });
    setToolState("processing");
    try {
      const ZipCtor = await ensureZip();
      const zip = new ZipCtor();
      const total = Math.ceil(body.length / per);
      const base = baseName(file.name);
      for (let i = 0; i < total; i++) {
        const chunk = body.slice(i * per, (i + 1) * per);
        if (!chunk.length) break;
        const part = String(i + 1).padStart(3, "0");
        zip.file(`${base}-cast-${part}.csv`, header + "\n" + chunk.join("\n") + "\n");
        Promise.resolve().then(() => setProgress({
          pct: 10 + Math.round((80 * (i + 1)) / total),
          label: `Část ${i + 1}/${total}`,
        }));
      }
      Promise.resolve().then(() => setProgress({ pct: 90, label: "Komprimuji ZIP…" }));
      const blob = await zip.generateAsync({ type: "blob" });
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob, filename: "csv-casti.zip" });
        setChunksInfo(`Vytvořeno ${total} ${total === 1 ? "část" : total < 5 ? "části" : "částí"} (hlavička se opakuje v každé z nich).`);
        toastSuccess(locale === "en" ? "CSV split" : "CSV rozděleno");
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
        ariaLabel="Přetáhněte CSV soubor" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte CSV soubor</span>
        <span className="dz-hint">Rozdělí na více částí s opakovanou hlavičkou · ZIP výstup</span>
      </Dropzone>

      {file ? (
        <FileList
          files={[{ name: `${file.name} · ${rowsCount} datových řádků`, size: file.size }]}
          onRemove={() => reset()}
          locale={locale}
        />
      ) : null}

      <div className={file ? "" : " hidden"} id="sc-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="sc-mode">Režim rozdělení</label>
          <select className="select" id="sc-mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="rows">Podle počtu řádků na soubor</option>
            <option value="files">Na N stejně velkých souborů</option>
          </select>
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="sc-count">
            {mode === "rows" ? "Řádků (bez hlavičky) na soubor" : "Počet souborů"}
          </label>
          <input
            className="input" id="sc-count" type="number" min={1} value={count}
            style={{ width: "8rem" }} onChange={(e) => setCount(Number(e.target.value) || 1)}
          />
        </div>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Vznikne {chunkCount} {chunkCount === 1 ? "část" : chunkCount < 5 ? "části" : "částí"} · hlavička se opakuje v každé části.
        </p>
        <button className="btn btn-primary btn-touch" id="sc-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>{" "}
          Rozdělit CSV
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}
      {chunksInfo ? <p className="muted" style={{ fontSize: "0.85rem" }}>{chunksInfo}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} title={t("result_ready")} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Parser respektuje uvozovky (víceřádková pole zůstávají pohromadě). Části se sbalí do ZIPu přes JSZip. Běží lokálně.
      </p>
    </div>
  );
}
