"use client";

// Konverze videa přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-convert.js. Volá FFmpegWrapper přímo.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, toastSuccess } from "@/components/tools/tool-runtime";
import { ConvertShell, FormatMenu, FilePreview, type FormatOption } from "@/components/tools/convert-layout";
import {
  Dropzone, Progress, ResultArea, ensureWrapper, getFFmpegWrapper, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi", ".ogv"];
const MAX = 100 * 1024 * 1024;

type VFormat = "mp4" | "webm" | "mkv" | "mov" | "avi";
const FORMATS: FormatOption<VFormat>[] = [
  { key: "mp4", label: "MP4", hint: "H.264/AAC, funguje všude" },
  { key: "webm", label: "WebM", hint: "VP8/Vorbis, pro web" },
  { key: "mkv", label: "MKV", hint: "H.264/AAC, kontejner Matroska" },
  { key: "mov", label: "MOV", hint: "H.264/AAC, Apple/QuickTime" },
  { key: "avi", label: "AVI", hint: "MPEG-4/MP3, starší přehrávače" },
];
const MIME: Record<VFormat, string> = { mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska", mov: "video/quicktime", avi: "video/x-msvideo" };
const ARGS: Record<VFormat, string[]> = {
  mp4: ["-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "-movflags", "+faststart"],
  mov: ["-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "-movflags", "+faststart"],
  mkv: ["-c:v", "libx264", "-preset", "fast", "-c:a", "aac"],
  webm: ["-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis"],
  avi: ["-c:v", "mpeg4", "-q:v", "5", "-c:a", "libmp3lame"],
};

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}

export default function VideoConvert({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<VFormat>("mp4");
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
      const outName = "out." + format;
      await wrap.write(ff, inName, wrap.fetchFile(file));
      const args = ["-i", inName, ...ARGS[format], outName];
      Promise.resolve().then(() => setProgress({ pct: 30, label: locale === "en" ? "Converting (may take a while)…" : "Převádím (může trvat)…" }));
      await wrap.run(ff, args);
      const data = await wrap.read(ff, outName);
      wrap.remove(ff, inName); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: MIME[format] }), filename: "prevedeno." + format });
        toastSuccess(locale === "en" ? "Video converted" : "Video převedeno");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Převod selhal (možná nepodporovaný kodek ve ffmpeg.wasm).";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <ConvertShell
      hasFile={!!file}
      left={
        <>
          <Dropzone accept={ACCEPT} multiple={false} maxSize={MAX} onFiles={onFiles} onError={(m) => setError(m)} ariaLabel="Přetáhněte video" locale={locale}>
            <span className="dz-ico">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
            </span>
            <span className="dz-title">{file ? "Vyměnit video" : "Přetáhněte video"}</span>
            <span className="dz-hint">MP4, WebM, MOV, MKV…, převod přes ffmpeg.wasm</span>
          </Dropzone>
          {file ? <FilePreview file={file} onRemove={reset} /> : null}
        </>
      }
      right={
        <>
          <FormatMenu title="Převést na" formats={FORMATS} value={format} onChange={(k) => { setFormat(k); setResult(null); }} disabled={!file || running} />
          <button className="btn btn-primary btn-touch btn-block" id="vc-run" type="button" disabled={!file || running} onClick={run}>
            Převést na {format.toUpperCase()}
          </button>
          <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />
          {error ? <p className="error-text" role="alert">{error}</p> : null}
          <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />
          <p className="muted" style={{ fontSize: "0.78rem", margin: 0 }}>
            ffmpeg.wasm běží v prohlížeči a je pomalejší než nativní ffmpeg; limit ~100 MB. Video neopustí prohlížeč.
          </p>
        </>
      }
    />
  );
}
