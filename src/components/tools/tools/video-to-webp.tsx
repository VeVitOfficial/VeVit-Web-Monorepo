"use client";

// Video → animovaný WebP přes ffmpeg.wasm (libwebp), čistě client-side.
// Kvalita (1–100), fps a volitelná maximální délka; fps se řeší filtrem
// fps=N (bezpečná forma args). WebP animace jsou výrazně menší než GIF.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureWrapper, getFFmpegWrapper, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi", ".ogv"];
const MAX = 100 * 1024 * 1024;

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}

export default function VideoToWebp({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [fps, setFps] = useState(15);
  const [dur, setDur] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setToolState("idle");
  };
  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null);
    if (f.size > MAX) {
      setError("Video je příliš velké (max " + fmtSize(MAX) + ", limit ffmpeg.wasm).");
      setToolState("error");
      return;
    }
    setResult(null); setProgress(null); setFile(f);
    setToolState("ready");
  };

  const run = async () => {
    if (!file) return;
    setError(null); setResult(null); setRunning(true); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    try {
      await ensureWrapper();
      const wrap = getFFmpegWrapper();
      if (!wrap) throw new Error(t("load_failed"));
      setProgress({ pct: 2, label: wrap.LOADING_NOTE });
      const ff = await wrap.ready((p) => Promise.resolve().then(() => setProgress({ pct: Math.max(5, Math.round((p || 0) * 90)), label: locale === "en" ? "Processing…" : "Zpracovávám…" })));
      const inName = "in." + ext(file.name);
      const outName = "out.webp";
      await wrap.write(ff, inName, wrap.fetchFile(file));

      const q = Math.max(1, Math.min(100, Math.round(quality) || 80));
      const f = Math.max(1, Math.min(60, Math.round(fps) || 15));
      const d = Math.max(0, dur || 0);

      // Bezpečná forma argumentů: fps přes filtr, ztrátový webp s kvalitou q.
      const args = ["-i", inName, "-vcodec", "libwebp", "-filter:v", `fps=${f}`, "-lossless", "0", "-q:v", String(q)];
      if (d > 0) args.push("-t", String(d));
      args.push(outName);

      Promise.resolve().then(() => setProgress({ pct: 30, label: locale === "en" ? "Creating WebP (may take a while)…" : "Vytvářím WebP (může trvat)…" }));
      await wrap.run(ff, args);
      const data = await wrap.read(ff, outName);
      wrap.remove(ff, inName); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: "image/webp" }), filename: "animovano.webp" });
        toastSuccess(locale === "en" ? "WebP created" : "WebP vytvořeno");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vytvoření WebP selhalo (možná nepodporovaný kodek ve ffmpeg.wasm).";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={MAX}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte video" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">Vytvoří animovaný WebP (ffmpeg.wasm, libwebp)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vw-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="vw-q">Kvalita: {quality}</label>
          <input
            className="input" id="vw-q" type="range" min={1} max={100} value={quality}
            style={{ width: "100%" }} onChange={(e) => setQuality(Number(e.target.value) || 80)}
          />
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vw-fps">Snímky/s</label>
            <input className="input" id="vw-fps" type="number" value={fps} min={1} max={60} style={{ width: "5rem" }} onChange={(e) => setFps(Number(e.target.value) || 15)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vw-dur">Max. délka (s, 0 = celé)</label>
            <input className="input" id="vw-dur" type="number" value={dur} min={0} max={120} style={{ width: "7rem" }} onChange={(e) => setDur(Number(e.target.value) || 0)} />
          </div>
        </div>
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Tip: u dlouhých videí zadejte maximální délku (doporučujeme do 10 s) — animované WebP roste s počtem snímků.
        </p>
        <button className="btn btn-primary btn-touch" id="vw-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" />
          </svg>{" "}
          Vytvořit WebP
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Animované WebP přes ffmpeg.wasm (ztrátové, kvalita 1–100). Oproti GIF obvykle výrazně menší soubor. Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}
