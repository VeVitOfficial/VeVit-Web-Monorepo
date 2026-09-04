"use client";

// Spojení více videí přes ffmpeg.wasm concat demuxer, čistě client-side.
// Portuje legacy tools/assets/js/tools/video-merge.js. Požaduje stejný kodek +
// rozlišení (-c copy). Vstupy se do FS zapisují pod pevnými jmény in0.<ext>…
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureWrapper, getFFmpegWrapper, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];
const MAX = 100 * 1024 * 1024;

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}

export default function VideoMerge({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);

  const reset = () => {
    setFiles([]); setResult(null); setError(null); setProgress(null); setRunning(false);
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    setError(null);
    for (const f of arr) {
      if (f.size > MAX) {
        setError("Soubor „" + f.name + "\" je příliš velký (max " + fmtSize(MAX) + " — limit ffmpeg.wasm).");
        setToolState("error");
        return;
      }
    }
    setFiles((prev) => [...prev, ...arr]);
    setToolState("ready");
  };

  const removeAt = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const move = (i: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[i]; next[i] = next[j]; next[j] = tmp;
      return next;
    });
  };

  const run = async () => {
    if (files.length < 2) { setError("Přidejte alespoň dvě videa."); setToolState("error"); return; }
    setError(null); setResult(null); setRunning(true); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    try {
      await ensureWrapper();
      const wrap = getFFmpegWrapper();
      if (!wrap) throw new Error(t("load_failed"));
      const outExt = format, outName = "out." + outExt, outMime = "video/" + outExt;
      setProgress({ pct: 2, label: wrap.LOADING_NOTE });
      const ff = await wrap.ready((p) => Promise.resolve().then(() => setProgress({ pct: Math.max(5, Math.round((p || 0) * 80)), label: locale === "en" ? "Loading…" : "Načítám…" })));
      const inNames = files.map((f, i) => "in" + i + "." + ext(f.name));
      let chain = Promise.resolve();
      inNames.forEach((n, i) => { chain = chain.then(() => wrap.write(ff, n, wrap.fetchFile(files[i]))); });
      await chain;
      const txt = inNames.map((n) => "file '" + n + "'").join("\n");
      await wrap.write(ff, "list.txt", new TextEncoder().encode(txt));
      Promise.resolve().then(() => setProgress({ pct: 40, label: locale === "en" ? "Merging…" : "Spojuji…" }));
      await wrap.run(ff, ["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", outName]);
      const data = await wrap.read(ff, outName);
      inNames.forEach((n) => wrap.remove(ff, n));
      wrap.remove(ff, "list.txt"); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: outMime }), filename: "spojeno." + outExt });
        toastSuccess(locale === "en" ? "Videos merged" : "Videa spojena");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Spojení selhalo — pravděpodobně videa nemají shodný kodek/rozlišení. Zkuste stejný formát nebo převeďte každé zvlášť.";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple maxSize={MAX}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte 2 a více videí" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte 2 a více videí</span>
        <span className="dz-hint">Stejný kodek a rozlišení (ffmpeg.wasm, concat demuxer)</span>
      </Dropzone>

      {files.length ? (
        <FileList
          files={files.map((f) => ({ name: f.name, size: f.size }))}
          onRemove={removeAt}
          reorder
          onMove={move}
          locale={locale}
        />
      ) : null}

      <div className={files.length ? "" : " hidden"} id="vm-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="vm-format">Výstupní formát</label>
          <select className="select" id="vm-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
          </select>
        </div>
        <button className="btn btn-primary btn-touch" id="vm-run" type="button" disabled={files.length < 2 || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
          </svg>{" "}
          Spojit videa
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Spojení přes concat demuxer (-c copy). Všechna videa musí mít shodný kodek a rozlišení, jinak výstup selže — v takovém případě použijte stejný formát nebo převeďte každé zvlášť. Limit ~100 MB na soubor. Běží lokálně.
      </p>
    </div>
  );
}