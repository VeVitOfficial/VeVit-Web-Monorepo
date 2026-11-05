"use client";

// Odstranění zvukové stopy z videa (-an) přes ffmpeg.wasm, čistě client-side.
// Video se nejprve snaží zkopírovat beze změny (-c:v copy — rychlé, beze ztráty);
// pokud kopie selže (kontejner/kodek kombinace), spadne se do fallbacku
// s překódováním na H.264 (libx264, preset fast).
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

export default function VideoMute({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
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
      const outName = "out.mp4";
      await wrap.write(ff, inName, wrap.fetchFile(file));
      Promise.resolve().then(() => setProgress({ pct: 30, label: locale === "en" ? "Removing audio (stream copy)…" : "Odebírám zvuk (kopie streamu)…" }));
      try {
        // 1. pokus: jen zrušit zvuk, video zkopírovat beze změny (rychlé).
        await wrap.run(ff, ["-i", inName, "-an", "-c:v", "copy", outName]);
      } catch {
        // 2. pokus: kopie selhala → překódovat video na H.264.
        wrap.remove(ff, outName);
        Promise.resolve().then(() => setProgress({ pct: 40, label: locale === "en" ? "Copy failed, re-encoding (may take a while)…" : "Kopie selhala, překóduji (může trvat)…" }));
        await wrap.run(ff, ["-i", inName, "-an", "-c:v", "libx264", "-preset", "fast", outName]);
      }
      const data = await wrap.read(ff, outName);
      wrap.remove(ff, inName); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: "video/mp4" }), filename: "bez-zvuku.mp4" });
        toastSuccess(locale === "en" ? "Audio removed" : "Zvuk odebrán");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Odebrání zvuku selhalo (možná nepodporovaný kodek ve ffmpeg.wasm).";
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
            <path d="M11 5 6 9H2v6h4l5 4z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">Odebere zvukovou stopu (ffmpeg.wasm, běží lokálně)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vm-work">
        <button className="btn btn-primary btn-touch" id="vm-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
          </svg>{" "}
          Odstranit zvuk
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Nejdřív zkusí video zkopírovat beze změny (rychle, beze ztráty kvality); pokud to daný kodek neumožňuje, překóduje na H.264.
        Přes ffmpeg.wasm v prohlížeči, limit ~100 MB, video neopustí zařízení.
      </p>
    </div>
  );
}
