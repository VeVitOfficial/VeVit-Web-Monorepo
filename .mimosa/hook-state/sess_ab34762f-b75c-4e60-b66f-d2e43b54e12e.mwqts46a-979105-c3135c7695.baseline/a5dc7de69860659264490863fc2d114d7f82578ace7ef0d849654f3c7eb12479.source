"use client";

// Komprese videa na cílovou velikost přes ffmpeg.wasm, čistě client-side.
// Bitrate se dopočítá z délky videa (získané přes <video>) a cílové velikosti.
// Portuje legacy tools/assets/js/tools/video-target-size.js.
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];
const AUDIO_BR = 128; // kbps

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}

export default function VideoTargetSize({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [mb, setMb] = useState(25);
  const [dur, setDur] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const durationRef = useRef(0);

  const reset = () => {
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false); setDur("");
    durationRef.current = 0;
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setProgress(null); setFile(f); setDur("");
    setToolState("ready");
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      durationRef.current = v.duration || 0;
      URL.revokeObjectURL(url);
      Promise.resolve().then(() => setDur(durationRef.current ? durationRef.current.toFixed(1) : ""));
    };
    v.onerror = () => { URL.revokeObjectURL(url); durationRef.current = 0; };
    v.src = url;
  };

  const run = async () => {
    if (!file) return;
    setError(null);
    if (!durationRef.current) { setError("Nepodařilo se zjistit délku videa. Zkuste jiný soubor."); setToolState("error"); return; }
    const targetMB = Number(mb);
    if (!targetMB || targetMB <= 0) { setError("Zadejte cílovou velikost (MB)."); setToolState("error"); return; }
    const totalKbps = Math.floor((targetMB * 8192) / durationRef.current);
    if (totalKbps <= AUDIO_BR) {
      setError("Cílová velikost je příliš malá na toto video (audio sama spotřebuje ~" + AUDIO_BR + " kbps). Zvyšte cílovou velikost.");
      setToolState("error");
      return;
    }
    const vbr = Math.max(50, totalKbps - AUDIO_BR);
    setResult(null); setRunning(true); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      media.runJob({
        file,
        inName: "in." + ext(file.name),
        outName: "out.mp4",
        outMime: "video/mp4",
        args: (inN, outN) => ["-i", inN, "-c:v", "libx264", "-preset", "fast", "-b:v", vbr + "k", "-maxrate", vbr + "k", "-bufsize", (2 * vbr) + "k", "-c:a", "aac", "-b:a", AUDIO_BR + "k", outN],
        runLabel: locale === "en" ? "Encoding (may take a while)…" : "Kóduji (může trvat)…",
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "cilova-velikost.mp4" });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "Video compressed" : "Video zkomprimováno");
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
            <path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">Zkompresuje na cílovou velikost (ffmpeg.wasm)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vts-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vts-mb">Cílová velikost (MB)</label>
            <input className="input" id="vts-mb" type="number" value={mb} min={1} max={500} step={0.5} style={{ width: "6rem" }} onChange={(e) => setMb(Number(e.target.value) || 25)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vts-dur">Délka (s, auto)</label>
            <input className="input" id="vts-dur" type="number" min={0} step={0.1} style={{ width: "6rem" }} placeholder="auto" readOnly value={dur} onChange={() => {}} />
          </div>
        </div>
        <button className="btn btn-primary btn-touch" id="vts-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" />
          </svg>{" "}
          Komprimovat na cílovou velikost
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Dopočet bitrate z cílové velikosti a délky (dvouprůchodový režim by byl pomalejší; zde jednorázový -b:v + maxrate). Audio 128 kbps AAC. Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}