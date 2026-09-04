"use client";

// Konverze audia přes ffmpeg.wasm, čistě client-side.
// Portuje legacy tools/assets/js/tools/audio-convert.js.
//
// Tento soubor je zároveň nosičem SDÍLENÝCH helperů pro celou media dávku
// (11 nástrojů). Protože batch agent smí vytvářet jen své <slug>.tsx soubory,
// žijí společné mini-komponenty (Dropzone / FileList / Progress / ResultArea)
// a ffmpeg loadery zde jako pojmenované exporty a ostatní media nástroje je
// importují. ClassName jsou 1:1 s legacy, aby public/tools/assets/css/style.css
// platil beze změny. Žádné nové npm závislosti — ffmpeg UMD zůstává v public/.
import { useEffect, useMemo, useRef, useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import {
  loadScript, fmtSize, Icon, useToolUi, toastSuccess, toastError,
} from "@/components/tools/tool-runtime";

// ── Typy pro ffmpeg.wasm globály (window.FFmpegWrapper / FFmpegMedia) ──────
type FFmpegInstance = {
  writeFile(name: string, data: Uint8Array): Promise<void>;
  readFile(name: string): Promise<Uint8Array>;
  deleteFile(name: string): Promise<void>;
  exec(args: string[]): Promise<number>;
  on(ev: string, cb: (e: { progress: number }) => void): void;
  terminate(): void;
};
interface FFmpegWrapperG {
  ready(onProgress?: (p: number) => void): Promise<FFmpegInstance>;
  write(ff: FFmpegInstance, name: string, data: Uint8Array | Promise<Uint8Array>): Promise<void>;
  read(ff: FFmpegInstance, name: string): Promise<Uint8Array>;
  remove(ff: FFmpegInstance, name: string): Promise<void>;
  run(ff: FFmpegInstance, args: string[]): Promise<void>;
  fetchFile(file: File | Blob): Promise<Uint8Array>;
  cancel(): void;
  LOADING_NOTE: string;
}
type ProgressCb = (p: number, label: string) => void;
interface MediaJob {
  file: File;
  inName?: string;
  outName: string;
  outMime?: string;
  args: string[] | ((inN: string, outN: string) => string[]);
  onProgress?: ProgressCb;
  onError?: (m: string) => void;
  onBlob?: (b: Blob) => void;
  onDone?: (d: Uint8Array) => void;
  signal?: AbortSignal;
  maxBytes?: number;
  runLabel?: string;
}
interface FFmpegMediaG {
  runJob(job: MediaJob): void;
  runMerge(
    files: File[], args: string[], outName: string, outMime: string, outExt: string,
    onProgress: ProgressCb, onError: (m: string) => void, onBlob: (b: Blob) => void,
    onDone?: (d: Uint8Array) => void,
  ): void;
  ext(name: string): string;
  MAX: number;
}

function w(): typeof window & { FFmpegWrapper?: FFmpegWrapperG; FFmpegMedia?: FFmpegMediaG } {
  return window as unknown as typeof window & { FFmpegWrapper?: FFmpegWrapperG; FFmpegMedia?: FFmpegMediaG };
}

/** Načte ffmpeg-media helper (a obalený ffmpeg-wrapper), idempotentně. */
export async function ensureMedia(): Promise<void> {
  const g = w();
  if (g.FFmpegMedia) return;
  await loadScript("/tools/assets/js/lib/ffmpeg-wrapper.js");
  await loadScript("/tools/assets/js/lib/ffmpeg-media.js");
}

/** Načte pouze ffmpeg-wrapper (pro nástroje, které volají FFmpegWrapper přímo). */
export async function ensureWrapper(): Promise<void> {
  const g = w();
  if (g.FFmpegWrapper) return;
  await loadScript("/tools/assets/js/lib/ffmpeg-wrapper.js");
}

export function getFFmpegWrapper(): FFmpegWrapperG | undefined { return w().FFmpegWrapper; }
export function getFFmpegMedia(): FFmpegMediaG | undefined { return w().FFmpegMedia; }

/** Pomocná mutace data-tool-state na #tool-root (shell renderuje ten uzel). */
export function setToolState(state: "idle" | "ready" | "processing" | "success" | "error"): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById("tool-root");
  if (!root) return;
  root.setAttribute("data-tool-state", state);
  root.setAttribute("aria-busy", state === "processing" ? "true" : "false");
}

// ── matchesAccept (port tool-ui.js dropzone) ──────────────────────────────
function matchesAccept(file: File, accept: string[]): boolean {
  const name = file.name.toLowerCase();
  return accept.some((a) => {
    if (a.indexOf(".") === 0) return name.endsWith(a);
    if (a.indexOf("/") > -1) {
      return file.type === a || (a.endsWith("/*") && file.type.indexOf(a.slice(0, -1)) === 0);
    }
    return false;
  });
}

// ── Dropzone (port tool-ui.js dropzone) ───────────────────────────────────
// Renderuje .dropzone se skrytým <input type=file>, klik/Enter otevírá výběr,
// drag&drop + accept/multiple/maxSize filtrace 1:1 s legacy.
export function Dropzone({
  accept, multiple, maxSize, onFiles, onError, ariaLabel, locale, children,
}: {
  accept: string[];
  multiple?: boolean;
  maxSize?: number;
  onFiles: (files: File[]) => void;
  onError?: (msg: string) => void;
  ariaLabel?: string;
  locale: Locale;
  children: React.ReactNode;
}) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list) return;
    let arr = Array.from(list);
    if (!arr.length) return;
    if (!multiple) arr = [arr[0]];
    if (accept.length) {
      const ok = arr.filter((f) => matchesAccept(f, accept));
      const rejected = arr.length - ok.length;
      if (rejected > 0 && onError) onError(t("invalid_type"));
      arr = ok;
    }
    if (maxSize != null) {
      arr = arr.filter((f) => {
        if (f.size <= maxSize) return true;
        if (onError) onError(t("file_too_large", { name: f.name, limit: fmtSize(maxSize) }));
        return false;
      });
    }
    if (arr.length && onFiles) onFiles(arr);
  };

  return (
    <div
      className={`dropzone${dragOver ? " dragover" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) setDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setDragOver(false); handle(e.dataTransfer.files); }}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept.join(",")}
        aria-hidden="true"
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

// ── FileList (port tool-ui.js renderFileList) ─────────────────────────────
// .file-list > .file-item s .fi-ico / .fi-meta (.fi-name + .fi-size) + tlačítko
// odebrat (a volitelně přesun výše/níže pro video-merge).
export function FileList({
  files, onRemove, reorder, onMove, locale,
}: {
  files: { name: string; size: number }[];
  onRemove: (index: number) => void;
  reorder?: boolean;
  onMove?: (index: number, dir: -1 | 1) => void;
  locale: Locale;
}) {
  const { t } = useToolUi(locale);
  if (!files.length) return <div className="file-list hidden" />;
  return (
    <div className="file-list">
      {files.map((f, i) => (
        <div className="file-item" key={`${f.name}-${i}`}>
          <span className="fi-ico"><Icon name="File" size={18} /></span>
          <span className="fi-meta">
            <span className="fi-name">{f.name}</span>
            <span className="fi-size">{fmtSize(f.size)}</span>
          </span>
          {reorder && onMove ? (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-icon-sm fi-move dz-noopen"
                aria-label={t("move_up", { name: f.name })}
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: "rotate(180deg)" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-icon-sm fi-move dz-noopen"
                aria-label={t("move_down", { name: f.name })}
                disabled={i === files.length - 1}
                onClick={() => onMove(i, 1)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost btn-icon-sm fi-remove dz-noopen"
            aria-label={t("remove_file", { name: f.name })}
            onClick={() => onRemove(i)}
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Progress (port tool-ui.js setProgress) ────────────────────────────────
// .progress-track + sourozenecký <p class="progress-label"> (1:1 legacy HTML).
export function Progress({
  pct, label, hidden, indeterminate,
}: {
  pct?: number;
  label?: string;
  hidden?: boolean;
  indeterminate?: boolean;
}) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <>
      <div
        className={`progress-track${hidden ? " hidden" : ""}${indeterminate ? " is-indeterminate" : ""}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(p)}
      >
        <div
          className="progress-fill"
          style={indeterminate ? undefined : { width: `${p}%` }}
        />
      </div>
      <p className={`progress-label${hidden ? " hidden" : ""}`}>{label ?? ""}</p>
    </>
  );
}

// ── ResultArea (port tool-ui.js download + resultCard) ────────────────────
// .tool-auto-result > .result-card se stažovacím tlačítkem a resetem.
export function ResultArea({
  blob, filename, onReset, locale, title,
}: {
  blob: Blob | null;
  filename: string;
  onReset: () => void;
  locale: Locale;
  title?: string;
}) {
  const { t } = useToolUi(locale);
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!blob) return <div className="tool-auto-result hidden" />;
  return (
    <div className="tool-auto-result">
      <div className="result-card">
        <span className="result-card-icon"><Icon name="Check" size={20} /></span>
        <span className="rc-meta">
          <strong className="rc-title">{title ?? t("result_ready")}</strong>
          <span className="rc-sub">{[filename, fmtSize(blob.size)].filter(Boolean).join(" · ")}</span>
        </span>
        <a className="btn btn-primary btn-touch" href={url ?? undefined} download={filename}>
          <Icon name="Download" size={17} /> <span>{t("download")}</span>
        </a>
        <button type="button" className="btn btn-outline btn-touch" onClick={onReset}>
          {t("reset")}
        </button>
      </div>
    </div>
  );
}

/** Společný formát erroru → toast + stav. Vrátí zprávu pro zobrazení. */
export function reportError(locale: Locale, msg: string): string {
  toastError(msg);
  return msg;
}

export { toastSuccess, fmtSize };

// ── audio-convert: komponenta ─────────────────────────────────────────────
const CODECS: Record<string, string> = { mp3: "libmp3lame", wav: "pcm_s16le", ogg: "libvorbis", flac: "flac" };
const LOSSY: Record<string, boolean> = { mp3: true, ogg: true };
const ACCEPT = ["audio/*", ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

export default function AudioConvert({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"mp3" | "wav" | "ogg" | "flac">("mp3");
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
    setError(null); setResult(null); setProgress(null);
    setFile(arr[0] ?? null);
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
        outMime: "audio/" + f,
        args: (inN, outN) => {
          const a = ["-i", inN, "-c:a", CODECS[f]];
          if (LOSSY[f]) a.push("-b:a", String(bitrate || 192) + "k");
          a.push("-vn", outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => {
          setProgress(null); setRunning(false); setError(m); setToolState("error");
        }),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResult({ blob, filename: "prevedeno." + f });
          setProgress(null); setRunning(false); setToolState("success");
          toastSuccess(locale === "en" ? "Audio converted" : "Audio převedeno");
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
        accept={ACCEPT}
        multiple={false}
        maxSize={100 * 1024 * 1024}
        onFiles={onFiles}
        onError={(m) => setError(m)}
        ariaLabel="Přetáhněte audio"
        locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte audio</span>
        <span className="dz-hint">MP3, WAV, OGG, M4A, FLAC — převod přes ffmpeg.wasm</span>
      </Dropzone>

      {file ? (
        <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} />
      ) : null}

      <div className={file ? "" : " hidden"} id="ac-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ac-format">Cílový formát</label>
          <select
            className="select" id="ac-format" value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="ogg">OGG (Vorbis)</option>
            <option value="flac">FLAC</option>
          </select>
        </div>
        <div className={`stack-sm${LOSSY[format] ? "" : " hidden"}`} id="ac-br-grp">
          <label className="field-label" htmlFor="ac-br">Bitrate (kbps, ztrátové)</label>
          <input
            className="input" id="ac-br" type="number" value={bitrate} min={64} max={320}
            style={{ width: "6rem" }}
            onChange={(e) => setBitrate(Number(e.target.value) || 192)}
          />
        </div>
        <button
          className="btn btn-primary btn-touch" id="ac-run" type="button"
          disabled={!file || running}
          onClick={run}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>{" "}
          Převést
        </button>
      </div>

      <Progress
        pct={progress?.pct}
        label={progress?.label}
        hidden={!progress}
        indeterminate={progress != null && progress.pct <= 0}
      />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea
        blob={result?.blob ?? null}
        filename={result?.filename ?? ""}
        onReset={reset}
        locale={locale}
      />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Převod audia přes ffmpeg.wasm. Limit ~100 MB. Běží lokálně.
      </p>
    </div>
  );
}