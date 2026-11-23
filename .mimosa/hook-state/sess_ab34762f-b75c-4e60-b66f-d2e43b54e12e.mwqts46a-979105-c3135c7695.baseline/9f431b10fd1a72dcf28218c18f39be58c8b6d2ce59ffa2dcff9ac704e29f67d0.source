"use client";

// Změna rozlišení videa (scale filtr) přes ffmpeg.wasm, čistě client-side.
// Presety 480p/720p/1080p drží poměr stran (výška se dopočítá jako -2),
// režim "vlastní" umožňuje zadat šířku i výšku (volitelně se zachováním poměru).
// Zvuk se kopíruje (-c:a copy); když kopírování selže (např. opus do mp4),
// překóduje se na AAC.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureWrapper, getFFmpegWrapper, setToolState,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi", ".ogv"];
const MAX = 100 * 1024 * 1024;

/** Pevné presety — klíč = výšková linka, hodnota = cílová šířka. */
const PRESETS: Record<"480p" | "720p" | "1080p", number> = { "480p": 854, "720p": 1280, "1080p": 1920 };

type Preset = keyof typeof PRESETS | "vlastní";

function ext(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "mp4";
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n) || min));
}

export default function VideoResize({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>("720p");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [keepAspect, setKeepAspect] = useState(true);
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
      const outName = "out.mp4";
      await wrap.write(ff, inName, wrap.fetchFile(file));

      // Presety vždy drží poměr stran (výška -2 = automaticky, na sudé číslo).
      const w = preset === "vlastní" ? clamp(width, 16, 3840) : PRESETS[preset];
      const keep = preset !== "vlastní" || keepAspect;
      const vf = `scale=${w}:${keep ? "-2" : String(clamp(height, 16, 2160))}`;

      Promise.resolve().then(() => setProgress({ pct: 30, label: locale === "en" ? "Resizing (may take a while)…" : "Zmenšuji (může trvat)…" }));
      const args = ["-i", inName, "-vf", vf, "-c:a", "copy", outName];
      try {
        await wrap.run(ff, args);
      } catch {
        // Kopie zvuku selhala (např. opus/vorbis nepatří do mp4) → překódovat na AAC.
        wrap.remove(ff, outName);
        Promise.resolve().then(() => setProgress({ pct: 40, label: locale === "en" ? "Retrying with AAC audio…" : "Zkusit znovu se zvukem AAC…" }));
        await wrap.run(ff, ["-i", inName, "-vf", vf, "-c:a", "aac", "-b:a", "128k", outName]);
      }
      const data = await wrap.read(ff, outName);
      wrap.remove(ff, inName); wrap.remove(ff, outName);
      Promise.resolve().then(() => {
        setProgress(null); setRunning(false); setToolState("success");
        setResult({ blob: new Blob([data as BlobPart], { type: "video/mp4" }), filename: "zmeneno.mp4" });
        toastSuccess(locale === "en" ? "Video resized" : "Video zmenšeno");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Změna rozlišení selhala (možná nepodporovaný kodek ve ffmpeg.wasm).";
      Promise.resolve().then(() => { setProgress(null); setRunning(false); setError(msg); setToolState("error"); });
    }
  };

  const isCustom = preset === "vlastní";

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
        <span className="dz-hint">Změna rozlišení přes ffmpeg.wasm (scale filtr)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vr-work">
        <div className="stack-sm">
          <label className="field-label" htmlFor="vr-preset">Cílové rozlišení</label>
          <select className="select" id="vr-preset" value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
            <option value="480p">480p (854 × výška podle poměru)</option>
            <option value="720p">720p (1280 × výška podle poměru)</option>
            <option value="1080p">1080p (1920 × výška podle poměru)</option>
            <option value="vlastní">Vlastní</option>
          </select>
        </div>
        {isCustom ? (
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm">
              <label className="field-label" htmlFor="vr-width">Šířka (px)</label>
              <input className="input" id="vr-width" type="number" value={width} min={16} max={3840} style={{ width: "6rem" }} onChange={(e) => setWidth(Number(e.target.value) || 1280)} />
            </div>
            <div className={`stack-sm${keepAspect ? " hidden" : ""}`}>
              <label className="field-label" htmlFor="vr-height">Výška (px)</label>
              <input className="input" id="vr-height" type="number" value={height} min={16} max={2160} style={{ width: "6rem" }} onChange={(e) => setHeight(Number(e.target.value) || 720)} />
            </div>
            <label className="row" style={{ gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", paddingBottom: "0.55rem" }}>
              <input type="checkbox" id="vr-keep" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
              Zachovat poměr stran
            </label>
          </div>
        ) : null}
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Při zachování poměru stran se výška dopočítá automaticky z šířky (výsledný rozměr bude sudý kvůli kodekům).
        </p>
        <button className="btn btn-primary btn-touch" id="vr-run" type="button" disabled={!file || running} onClick={run}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>{" "}
          Zmenšit video
        </button>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Škálování přes ffmpeg.wasm (běží v prohlížeči, video neopustí zařízení). U velkých souborů limit ~100 MB.
      </p>
    </div>
  );
}
