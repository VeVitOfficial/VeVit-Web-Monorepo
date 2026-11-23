"use client";

// Video → animovaný GIF přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-to-gif.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];

export default function VideoToGif({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [dur, setDur] = useState(10);
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false);
    setToolState("idle");
  };
  const onFiles = (arr: File[]) => {
    setError(null); setResult(null); setProgress(null); setFile(arr[0] ?? null);
    setToolState("ready");
  };

  const run = async () => {
    if (!file) return;
    setError(null); setResult(null); setRunning(true); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      const f = Math.max(5, Math.min(24, fps || 10));
      const w = Math.max(120, Math.min(1280, width || 480));
      const d = dur || 0;
      media.runJob({
        file,
        inName: "in." + media.ext(file.name),
        outName: "out.gif",
        outMime: "image/gif",
        args: (inN, outN) => {
          const vf = "fps=" + f + ",scale=" + w + ":-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
          const a = ["-i", inN];
          if (d > 0) a.push("-t", String(d));
          a.push("-vf", vf, outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "video.gif" });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "GIF created" : "GIF vytvořeno");
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("load_failed");
      setProgress(null); setRunning(false); setError(msg); setToolState("error");
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={100 * 1024 * 1024}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte video" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">Vytvoří animované GIF (ffmpeg.wasm)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vg-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vg-dur">Délka (s, 0 = celé)</label>
            <input className="input" id="vg-dur" type="number" value={dur} min={0} max={60} style={{ width: "5rem" }} onChange={(e) => setDur(Number(e.target.value) || 0)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vg-fps">Snímky/s</label>
            <input className="input" id="vg-fps" type="number" value={fps} min={5} max={24} style={{ width: "5rem" }} onChange={(e) => setFps(Number(e.target.value) || 10)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vg-width">Šířka (px)</label>
            <input className="input" id="vg-width" type="number" value={width} min={120} max={1280} step={2} style={{ width: "6rem" }} onChange={(e) => setWidth(Number(e.target.value) || 480)} />
          </div>
        </div>
        <button className="btn btn-primary btn-touch" id="vg-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" />
          </svg>{" "}
          Vytvořit GIF
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        GIF přes ffmpeg.wasm (palettegen + paletteuse pro lepší kvalitu). Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}