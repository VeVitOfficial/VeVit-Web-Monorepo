"use client";

// Extrakce audia z videa přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-extract-audio.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const CODECS: Record<string, string> = { mp3: "libmp3lame", wav: "pcm_s16le", ogg: "libvorbis", flac: "flac", m4a: "aac" };
const LOSSY: Record<string, boolean> = { mp3: true, ogg: true, m4a: true };
const MIME: Record<string, string> = { mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac", m4a: "audio/mp4" };
const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];

export default function VideoExtractAudio({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg" | "flac" | "m4a">("mp3");
  const [bitrate, setBitrate] = useState(192);
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
      const f = format;
      media.runJob({
        file,
        inName: "in." + media.ext(file.name),
        outName: "out." + f,
        outMime: MIME[f],
        args: (inN, outN) => {
          const a = ["-i", inN, "-vn"];
          if (f === "m4a") {
            // M4A: zkusíme rovnou zkopírovat zvuk (rychlé, beze ztráty); u AAC
            // stop v MP4 to je běžná a nejspolehlivější cesta.
            a.push("-c:a", "copy");
          } else {
            a.push("-c:a", CODECS[f]);
            if (LOSSY[f]) a.push("-b:a", String(bitrate || 192) + "k");
          }
          a.push(outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false);
          // ffmpeg exit 1 nejčastěji znamená: video nemá zvukovou stopu, nebo
          // používá kodek, který ffmpeg.wasm nedekóduje (typicky HEVC/H.265
          // z iPhonu). M4A copy navíc selže, když zvuk není AAC.
          setError(m + (locale === "en"
            ? " — Check that the video has an audio track and a decodable codec (H.264/AAC, WebM/VP9; HEVC is not supported). Try the M4A or WAV format."
            : " — Zkontrolujte, že video má zvukovou stopu a dekódovatelný kodek (H.264/AAC, WebM/VP9; HEVC není podporovaný). Zkuste formát M4A nebo WAV."));
          setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "audio." + f });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "Audio extracted" : "Audio extrahováno");
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
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">Vytáhne zvukovou stopu (ffmpeg.wasm)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="va-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="va-format">Formát audia</label>
            <select className="select" id="va-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
              <option value="mp3">MP3</option>
              <option value="m4a">M4A (zkopíruje zvuk, nejrychlejší)</option>
              <option value="wav">WAV</option>
              <option value="ogg">OGG</option>
              <option value="flac">FLAC</option>
            </select>
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="va-br">Bitrate (ztrátové)</label>
            <input className="input" id="va-br" type="number" value={bitrate} min={64} max={320} style={{ width: "6rem" }} onChange={(e) => setBitrate(Number(e.target.value) || 192)} />
          </div>
        </div>
        <button className="btn btn-primary btn-touch" id="va-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>{" "}
          Extrahovat audio
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Extrakce přes ffmpeg.wasm (-vn, jen zvuk). Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}