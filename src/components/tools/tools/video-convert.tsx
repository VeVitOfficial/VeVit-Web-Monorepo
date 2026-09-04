"use client";

// Konverze videa přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-convert.js. Volá FFmpegWrapper přímo.
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

export default function VideoConvert({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
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
      setError("Video je příliš velké (max " + fmtSize(MAX) + " — limit ffmpeg.wasm).");
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
      const args = ["-i", inName];
      if (format === "mp4") args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "-movflags", "+faststart");
      else args.push("-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis");
      args.push(outName);
      Promise.resolve().then(() => setProgress({ pct: 30, label: locale === "en" ? "Converting (may take a while)…" : "Převádím (může trvat)…" }));
      await wrap.run(ff, args);
      const data = await wrap.read(ff, outName);
      wrap.remove(ff, inName); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: "video/" + format }), filename: "prevedeno." + format });
        toastSuccess(locale === "en" ? "Video converted" : "Video převedeno");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Převod selhal (možná nepodporovaný kodek ve ffmpeg.wasm).";
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
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">MP4, WebM, MOV, MKV… — převod přes ffmpeg.wasm</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vc-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="vc-format">Cílový formát</label>
          <select className="select" id="vc-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="mp4">MP4 (H.264/AAC)</option>
            <option value="webm">WebM (VP8/Vorbis)</option>
          </select>
        </div>
        <button className="btn btn-primary btn-touch" id="vc-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
          </svg>{" "}
          Převést
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Převod přes ffmpeg.wasm (běží v prohlížeči). WASM je pomalejší než nativní ffmpeg; u velkých souborů limit ~100 MB. Video neopustí prohlížeč.
      </p>
    </div>
  );
}