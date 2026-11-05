"use client";

// Vytvoření ZIP archivu z více souborů (libovolný typ), čistě client-side.
// JSZip se líně načítá z public/tools/assets/js/lib (žádné npm závislosti).
// Soubory lze odebírat, název archivu je volitelný (výchozí "archiv").
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript, toastSuccess } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, ResultArea, setToolState } from "@/components/tools/tools/audio-convert";

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

/** Očistí název archivu od znaků, které nemají být v názvu souboru. */
function sanitizeName(raw: string): string {
  const s = raw.replace(/\.zip$/i, "").replace(/[\\/:*?"<>|]/g, "_").trim();
  return s || "archiv";
}

export default function CreateZip({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [files, setFiles] = useState<File[]>([]);
  const [archiveName, setArchiveName] = useState("archiv");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  /** počty dokončených souborů v běžícím balení (pro progress bar) */
  const doneRef = useRef(0);

  const totalSize = files.reduce((n, f) => n + f.size, 0);

  const reset = () => {
    setFiles([]); setResult(null); setError(null); setProgress(null); setRunning(false);
    setToolState("idle");
  };
  const onFiles = (arr: File[]) => {
    setError(null); setResult(null);
    setFiles((prev) => [...prev, ...arr]);
    setToolState("ready");
  };
  const removeAt = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const run = async () => {
    if (!files.length) return;
    setError(null); setResult(null); setRunning(true); doneRef.current = 0;
    setProgress({ pct: 5, label: "Načítám JSZip…" });
    setToolState("processing");
    try {
      const ZipCtor = await ensureZip();
      const zip = new ZipCtor();
      // Duplicitní názvy: JSZip by si přepsal soubor → dopočítáme jedinečný název.
      const used = new Set<string>();
      for (const f of files) {
        let name = f.name;
        if (used.has(name)) {
          const dot = f.name.lastIndexOf(".");
          const base = dot > 0 ? f.name.slice(0, dot) : f.name;
          const ext = dot > 0 ? f.name.slice(dot) : "";
          let n = 2;
          while (used.has(`${base}-${n}${ext}`)) n++;
          name = `${base}-${n}${ext}`;
        }
        used.add(name);
        zip.file(name, f);
        doneRef.current += 1;
        Promise.resolve().then(() => setProgress({
          pct: 10 + Math.round((70 * doneRef.current) / files.length),
          label: `Přidávám ${doneRef.current}/${files.length}: ${f.name}`,
        }));
      }
      Promise.resolve().then(() => setProgress({ pct: 85, label: "Komprimuji archiv…" }));
      const blob = await zip.generateAsync({ type: "blob" });
      const filename = sanitizeName(archiveName) + ".zip";
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob, filename });
        toastSuccess(locale === "en" ? "ZIP archive created" : "ZIP archiv vytvořen");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vytvoření archivu selhalo.";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={[]} multiple maxSize={200 * 1024 * 1024}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte soubory" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte soubory</span>
        <span className="dz-hint">Libovolné typy souborů · více souborů najednou</span>
      </Dropzone>

      {files.length ? (
        <FileList
          files={files.map((f) => ({ name: f.name, size: f.size }))}
          onRemove={removeAt}
          locale={locale}
        />
      ) : null}

      <div className={files.length ? "" : " hidden"} id="cz-work">
        <p className="muted" style={{ fontSize: "0.85rem" }} id="cz-summary">
          {files.length} {files.length === 1 ? "soubor" : files.length < 5 ? "soubory" : "souborů"} · celkem {fmtSize(totalSize)}
        </p>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cz-name">Název archivu</label>
          <input
            className="input" id="cz-name" type="text" value={archiveName}
            style={{ width: "16rem" }} onChange={(e) => setArchiveName(e.target.value)}
            placeholder="archiv"
          />
        </div>
        <button className="btn btn-primary btn-touch" id="cz-run" type="button" disabled={!files.length || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>{" "}
          Vytvořit ZIP
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} title={t("result_ready")} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Komprese přes JSZip (lazy-load), vše běží lokálně v prohlížeči — soubory se nikam neodesílají.
      </p>
    </div>
  );
}
