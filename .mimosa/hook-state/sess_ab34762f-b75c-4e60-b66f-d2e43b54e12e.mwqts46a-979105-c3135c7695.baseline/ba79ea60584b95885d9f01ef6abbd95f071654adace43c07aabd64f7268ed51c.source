"use client";

// Ořez audia + normalizace hlasitosti přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/audio-trim-normalize.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const CODECS: Record<string, string> = { mp3: "libmp3lame", wav: "pcm_s16le", ogg: "libvorbis" };
const ACCEPT = ["audio/*", ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];
const TS = /^\d{1,2}:\d{2}:\d{2}$/;

export default function AudioTrimNormalize({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:30");
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg">("mp3");
  const [norm, setNorm] = useState(true);
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
    setError(null);
    if (!TS.test(start) || !TS.test(end)) {
      setError("Čas zadávejte ve formátu HH:MM:SS (např. 00:00:05).");
      setToolState("error");
      return;
    }
    setRunning(true); setResult(null); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      const f = format;
      media.runJob({
        file,
        inName: "in." + media.ext(file.name),
        outName: "out." + f,
        outMime: "audio/" + f,
        args: (inN, outN) => {
          const a = ["-ss", start, "-to", end, "-i", inN];
          if (norm) a.push("-af", "loudnorm");
          a.push("-c:a", CODECS[f]);
          if (f === "mp3" || f === "ogg") a.push("-b:a", "192k");
          a.push(outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "audio." + f });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "Audio edited" : "Audio upraveno");
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
        ariaLabel="Přetáhněte audio" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 5H3" /><path d="M12 19H3" /><path d="M14 3v4" /><path d="M16 17v4" />
            <path d="M21 12h-9" /><path d="M21 19h-5" /><path d="M21 5h-7" /><path d="M8 10v4" /><path d="M8 12H3" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte audio</span>
        <span className="dz-hint">Ořez + normalizace hlasitosti (ffmpeg.wasm)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="atn-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="atn-start">Začátek (HH:MM:SS)</label>
            <input className="input" id="atn-start" type="text" value={start} placeholder="00:00:00" style={{ width: "7rem" }} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="atn-end">Konec (HH:MM:SS)</label>
            <input className="input" id="atn-end" type="text" value={end} placeholder="00:00:30" style={{ width: "7rem" }} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="atn-format">Výstup</label>
            <select className="select" id="atn-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
            </select>
          </div>
        </div>
        <label className="row" style={{ gap: "0.5rem", alignItems: "center", fontSize: "0.9rem" }}>
          <input type="checkbox" id="atn-norm" checked={norm} onChange={(e) => setNorm(e.target.checked)} /> Normalizovat hlasitost (loudnorm)
        </label>
        <button className="btn btn-primary btn-touch" id="atn-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 5H3" /><path d="M12 19H3" /><path d="M14 3v4" /><path d="M16 17v4" />
            <path d="M21 12h-9" /><path d="M21 19h-5" /><path d="M21 5h-7" /><path d="M8 10v4" /><path d="M8 12H3" />
          </svg>{" "}
          Oříznout a normalizovat
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Ořez (-ss/-to) + volitelná normalizace (loudnorm). Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}