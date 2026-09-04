"use client";

// Komprese videa přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-compress.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];

export default function VideoCompress({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState("");
  const [crf, setCrf] = useState(28);
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
      media.runJob({
        file,
        inName: "in." + media.ext(file.name),
        outName: "out.mp4",
        outMime: "video/mp4",
        args: (inN, outN) => {
          const a = ["-i", inN];
          if (res) a.push("-vf", "scale=" + res);
          a.push("-c:v", "libx264", "-preset", "fast", "-crf", String(crf || 28), "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "komprimovano.mp4" });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "Video compressed" : "Video komprimováno");
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
        ariaLabel="Přetáhněte video ke kompresi" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" /><path d="M9 19.8V15m0 0H4.2M9 15l-6 6" />
            <path d="M15 4.2V9m0 0h4.8M15 9l6-6" /><path d="M9 4.2V9m0 0H4.2M9 9 3 3" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video ke kompresi</span>
        <span className="dz-hint">ffmpeg.wasm — snížení bitrate + volitelné rozlišení</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vco-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vco-res">Rozlišení</label>
            <select className="select" id="vco-res" value={res} onChange={(e) => setRes(e.target.value)}>
              <option value="">Původní</option>
              <option value="1280:-2">720p</option>
              <option value="854:-2">480p</option>
              <option value="640:-2">360p</option>
            </select>
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vco-crf">Kvalita (CRF, nižší=lepší)</label>
            <input className="input" id="vco-crf" type="number" value={crf} min={18} max={40} style={{ width: "6rem" }} onChange={(e) => setCrf(Number(e.target.value) || 28)} />
          </div>
        </div>
        <button className="btn btn-primary btn-touch" id="vco-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" /><path d="M9 19.8V15m0 0H4.2M9 15l-6 6" />
            <path d="M15 4.2V9m0 0h4.8M15 9l6-6" /><path d="M9 4.2V9m0 0H4.2M9 9 3 3" />
          </svg>{" "}
          Komprimovat
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Komprese přes ffmpeg.wasm. WASM je pomalé — u velkých souborů limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}