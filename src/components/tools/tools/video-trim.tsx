"use client";

// Ořez videa přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-trim.js.
// Obsahuje náhled vstupu, rozsahové posuvníky synchronizované s HH:MM:SS,
// volbu kopírovat/překódovat, tlačítko Zrušit (AbortController) a náhled výsledku.
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];
const TS = /^\d{1,2}:\d{2}:\d{2}$/;

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}
function seconds(value: string): number {
  const p = value.split(":").map(Number);
  return p.length === 3 && p.every((n) => Number.isFinite(n)) ? p[0] * 3600 + p[1] * 60 + p[2] : NaN;
}
function stamp(value: number): string {
  value = Math.max(0, Math.floor(value));
  return [Math.floor(value / 3600), Math.floor((value % 3600) / 60), value % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function VideoTrim({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:00");
  const [startRange, setStartRange] = useState(0);
  const [endRange, setEndRange] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reenc, setReenc] = useState<"0" | "1">("0");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    abortRef.current?.abort();
  }, []);

  const setPreview = (url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    Promise.resolve().then(() => setPreviewUrl(url));
  };
  const setResultPreview = (url: string | null) => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = url;
    Promise.resolve().then(() => setResultUrl(url));
  };

  const reset = () => {
    abortRef.current?.abort(); abortRef.current = null;
    setPreview(null); setResultPreview(null);
    setFile(null); setResult(null); setError(null); setProgress(null); setRunning(false); setShowCancel(false);
    setStart("00:00:00"); setEnd("00:00:00"); setStartRange(0); setEndRange(0); setDuration(0);
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setProgress(null); setResultPreview(null); setShowCancel(false);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setToolState("ready");
  };

  const onLoadedMetadata = () => {
    const v = previewElRef.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d); setStartRange(0); setEndRange(d);
    setStart("00:00:00"); setEnd(stamp(d));
  };

  const previewElRef = useRef<HTMLVideoElement | null>(null);

  const onRangeStart = (v: number) => { setStartRange(v); setStart(stamp(v)); };
  const onRangeEnd = (v: number) => { setEndRange(v); setEnd(stamp(v)); };
  const onTextStart = (v: string) => { setStart(v); const s = seconds(v); if (Number.isFinite(s)) setStartRange(s); };
  const onTextEnd = (v: string) => { setEnd(v); const s = seconds(v); if (Number.isFinite(s)) setEndRange(s); };

  const run = async () => {
    if (!file) return;
    setError(null);
    if (!TS.test(start) || !TS.test(end) || seconds(end) <= seconds(start)) {
      setError(locale === "en" ? "Enter time as HH:MM:SS and end must be later than start." : "Čas zadávejte jako HH:MM:SS a konec musí být později než začátek.");
      setToolState("error"); return;
    }
    const outExt = ext(file.name) === "webm" ? "webm" : "mp4";
    const outMime = outExt === "webm" ? "video/webm" : "video/mp4";
    setResult(null); setResultPreview(null); setRunning(true); setShowCancel(true);
    setProgress({ pct: 0, label: "" });
    setToolState("processing");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      media.runJob({
        file,
        signal: controller.signal,
        inName: "in." + media.ext(file.name),
        outName: "out." + outExt,
        outMime: outMime,
        args: (inN, outN) => {
          const a = ["-ss", start, "-to", end, "-i", inN];
          if (reenc === "1") a.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
          else a.push("-c", "copy");
          a.push(outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setShowCancel(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResultPreview(URL.createObjectURL(blob));
          setResult({ blob, filename: "video-trim." + outExt });
          setProgress(null); setRunning(false); setShowCancel(false); setToolState("success");
          toastSuccess(locale === "en" ? "Video trimmed" : "Video oříznuto");
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("load_failed");
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setShowCancel(false); setError(msg); setToolState("error"); });
    }
  };

  const cancel = () => {
    abortRef.current?.abort(); abortRef.current = null;
    setShowCancel(false); setProgress(null); setRunning(false);
    setToolState("ready");
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={100 * 1024 * 1024}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte video k oříznutí" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video k oříznutí</span>
        <span className="dz-hint">ffmpeg.wasm — výběr časového úseku</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vt2-work">
        <video
          ref={previewElRef}
          className="media-preview"
          id="vt2-preview"
          controls
          preload="metadata"
          src={previewUrl ?? undefined}
          onLoadedMetadata={onLoadedMetadata}
        />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vt2-start">Začátek (HH:MM:SS)</label>
            <input className="input" id="vt2-start" type="text" value={start} placeholder="00:00:05" onChange={(e) => onTextStart(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vt2-end">Konec (HH:MM:SS)</label>
            <input className="input" id="vt2-end" type="text" value={end} placeholder="00:00:30" onChange={(e) => onTextEnd(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vt2-reenc">Překódovat (přesnější)</label>
            <select className="select" id="vt2-reenc" value={reenc} onChange={(e) => setReenc(e.target.value as "0" | "1")}>
              <option value="0">Kopírovat (rychlé)</option>
              <option value="1">Překódovat</option>
            </select>
          </div>
        </div>
        <div className="media-range">
          <input id="vt2-start-range" type="range" min={0} max={duration || 0} value={startRange} step={0.1} onChange={(e) => onRangeStart(Number(e.target.value))} />
          <input id="vt2-end-range" type="range" min={0} max={duration || 0} value={endRange} step={0.1} onChange={(e) => onRangeEnd(Number(e.target.value))} />
          <output id="vt2-summary">{start} → {end}</output>
        </div>
        <div className="tool-action-bar">
          <button className={`btn btn-secondary btn-touch${showCancel ? "" : " hidden"}`} id="vt2-cancel" type="button" onClick={cancel}>Zrušit</button>
          <button className="btn btn-primary btn-touch" id="vt2-run" type="button" disabled={!file || running} onClick={run}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
            </svg>{" "}
            Oříznout
          </button>
        </div>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      {resultUrl ? (
        <video className="media-preview" id="vt2-result-preview" controls src={resultUrl} />
      ) : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Ořez přes ffmpeg.wasm. „Kopírovat“ je rychlé ale ořezá na klíčových snímcích; „Překódovat“ je přesné. Běží lokálně.
      </p>
    </div>
  );
}