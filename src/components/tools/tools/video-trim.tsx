"use client";

// Ořez, rozpůlení a grafický crop videa přes ffmpeg.wasm, čistě client-side.
// Tři režimy:
//   trim  — časový úsek (začátek–konec), kopírovat/překódovat
//   slice — rozpůlení videa v bodě (dva výstupy)
//   crop  — grafický ořez okrajů tažením rámečku přes náhled (-vf crop)
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, toastSuccess } from "@/components/tools/tool-runtime";
import {
  Dropzone, FileList, Progress, ResultArea, ensureMedia, getFFmpegMedia, setToolState,
  ensureWrapper, getFFmpegWrapper,
} from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/*", ".mp4", ".webm", ".mov", ".mkv", ".avi"];
const TS = /^\d{1,2}:\d{2}:\d{2}$/;
type Mode = "trim" | "slice" | "crop";

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
/** ffmpeg crop filtr potřebuje sudé hodnoty (yuv420p). */
function even(n: number): number { return Math.max(2, Math.round(n / 2) * 2); }

export default function VideoTrim({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const EN = locale === "en";
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("trim");
  const [start, setStart] = useState("00:00:00");
  const [end, setEnd] = useState("00:00:00");
  const [startRange, setStartRange] = useState(0);
  const [endRange, setEndRange] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reenc, setReenc] = useState<"0" | "1">("0");
  const [sliceAt, setSliceAt] = useState(0); // sekundy bodu rozpůlení
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [sliceResults, setSliceResults] = useState<{ blob: Blob; filename: string; label: string; url: string }[] | null>(null);
  const [showCancel, setShowCancel] = useState(false);

  // grafický crop — rámeček v % zobrazeného videa (přepočet na přirozené px až v run())
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const cropDragRef = useRef<{ x: number; y: number } | null>(null);
  const videoBoxRef = useRef<HTMLDivElement | null>(null);
  const previewElRef = useRef<HTMLVideoElement | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  // Blob URL výsledků řeší useEffect na stavu (revokace při novém run/resetu);
  // staré slice URL držíme v refu jen pro cleanup při unmount.
  const sliceUrlsRef = useRef<string[]>([]);
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    sliceUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    abortRef.current?.abort();
  }, []);
  const trackSliceUrls = (items: { url: string }[]) => {
    sliceUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    sliceUrlsRef.current = items.map((i) => i.url);
  };

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
    trackSliceUrls([]);
    setFile(null); setResult(null); setSliceResults(null); setError(null); setProgress(null); setRunning(false); setShowCancel(false);
    setStart("00:00:00"); setEnd("00:00:00"); setStartRange(0); setEndRange(0); setDuration(0);
    setSliceAt(0); setCrop(null); setNaturalSize(null);
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null); setResult(null); setSliceResults(null); setProgress(null); setResultPreview(null); setShowCancel(false);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setCrop(null);
    setToolState("ready");
  };

  const onLoadedMetadata = () => {
    const v = previewElRef.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d); setStartRange(0); setEndRange(d);
    setStart("00:00:00"); setEnd(stamp(d));
    setSliceAt(Math.floor(d / 2)); // rozpůlení ve výchozím stavu uprostřed
    if (v.videoWidth && v.videoHeight) setNaturalSize({ w: v.videoWidth, h: v.videoHeight });
  };

  const onRangeStart = (v: number) => { setStartRange(v); setStart(stamp(v)); };
  const onRangeEnd = (v: number) => { setEndRange(v); setEnd(stamp(v)); };
  const onTextStart = (v: string) => { setStart(v); const s = seconds(v); if (Number.isFinite(s)) setStartRange(s); };
  const onTextEnd = (v: string) => { setEnd(v); const s = seconds(v); if (Number.isFinite(s)) setEndRange(s); };

  // ── Grafický crop: tažení rámečku přes náhled (v % displayed boxe) ──────
  const cropPt = (e: React.PointerEvent): { x: number; y: number } => {
    const box = videoBoxRef.current!;
    const r = box.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    };
  };
  const onCropDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = cropPt(e);
    cropDragRef.current = p;
    setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onCropMove = (e: React.PointerEvent) => {
    if (!cropDragRef.current) return;
    const a = cropDragRef.current;
    const b = cropPt(e);
    setCrop({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
  };
  const onCropUp = () => { cropDragRef.current = null; };

  const startRun = () => {
    setError(null); setResult(null); setSliceResults(null); setResultPreview(null);
    trackSliceUrls([]);
    setRunning(true); setShowCancel(true); setProgress({ pct: 0, label: "" });
    setToolState("processing");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };
  const failRun = (m: string) => {
    setProgress(null); setRunning(false); setShowCancel(false); setError(m); setToolState("error");
  };

  const run = async () => {
    if (!file) return;
    if (mode === "trim") return runTrim();
    if (mode === "slice") return runSlice();
    return runCrop();
  };

  /** Režim trim — klasický časový ořez (jeden výstup). */
  const runTrim = async () => {
    if (!TS.test(start) || !TS.test(end) || seconds(end) <= seconds(start)) {
      setError(EN ? "Enter time as HH:MM:SS and end must be later than start." : "Čas zadávejte jako HH:MM:SS a konec musí být později než začátek.");
      setToolState("error"); return;
    }
    const controller = startRun();
    const outExt = ext(file!.name) === "webm" ? "webm" : "mp4";
    const outMime = outExt === "webm" ? "video/webm" : "video/mp4";
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      media.runJob({
        file: file!,
        signal: controller.signal,
        inName: "in." + media.ext(file!.name),
        outName: "out." + outExt,
        outMime,
        args: (inN, outN) => {
          const a = ["-ss", start, "-to", end, "-i", inN];
          if (reenc === "1") a.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
          else a.push("-c", "copy");
          a.push(outN);
          return a;
        },
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => failRun(m)),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResultPreview(URL.createObjectURL(blob));
          setResult({ blob, filename: "video-trim." + outExt });
          setProgress(null); setRunning(false); setShowCancel(false); setToolState("success");
          toastSuccess(EN ? "Video trimmed" : "Video oříznuto");
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("load_failed");
      Promise.resolve().then(() => failRun(msg));
    }
  };

  /** Režim slice — rozpůlení v bodě: dva výstupy z jednoho vstupu
      (vstup se do FS zapíše jen jednou, spustí se dvě exec). */
  const runSlice = async () => {
    const cut = Math.min(Math.max(0.1, sliceAt), Math.max(0.1, duration - 0.1));
    if (duration && cut >= duration - 0.05) {
      setError(EN ? "The split point must be inside the video." : "Bod rozpůlení musí být uvnitř videa.");
      setToolState("error"); return;
    }
    const controller = startRun();
    try {
      await ensureWrapper();
      const W = getFFmpegWrapper();
      if (!W) throw new Error(t("load_failed"));
      const onCancel = () => W.cancel();
      controller.signal.addEventListener("abort", onCancel, { once: true });
      const ff = await W.ready((p) => { setProgress({ pct: Math.max(5, Math.round(p * 50)), label: EN ? "Loading ffmpeg…" : "Načítám ffmpeg…" }); });
      const inName = "in." + ext(file!.name);
      const outExt = ext(file!.name) === "webm" ? "webm" : "mp4";
      setProgress({ pct: 55, label: EN ? "Splitting part 1…" : "Dělím část 1…" });
      await W.write(ff, inName, W.fetchFile(file!));
      await W.run(ff, ["-ss", "00:00:00", "-to", stamp(cut), "-i", inName, "-c", "copy", "partA." + outExt]);
      setProgress({ pct: 80, label: EN ? "Splitting part 2…" : "Dělím část 2…" });
      await W.run(ff, ["-ss", stamp(cut), "-i", inName, "-c", "copy", "partB." + outExt]);
      const a = await W.read(ff, "partA." + outExt);
      const b = await W.read(ff, "partB." + outExt);
      await W.remove(ff, inName); await W.remove(ff, "partA." + outExt); await W.remove(ff, "partB." + outExt);
      controller.signal.removeEventListener("abort", onCancel);
      if (controller.signal.aborted) return;
      const mime = outExt === "webm" ? "video/webm" : "video/mp4";
      const toBlob = (data: Uint8Array) => new Blob([new Uint8Array(data)], { type: mime });
      const items = [
        { blob: toBlob(a), filename: `video-cast1.${outExt}`, label: EN ? `Part 1 (0:00 → ${stamp(cut)})` : `Část 1 (0:00 → ${stamp(cut)})` },
        { blob: toBlob(b), filename: `video-cast2.${outExt}`, label: EN ? `Part 2 (${stamp(cut)} → ${stamp(duration)})` : `Část 2 (${stamp(cut)} → ${stamp(duration)})` },
      ].map((i) => ({ ...i, url: URL.createObjectURL(i.blob) }));
      trackSliceUrls(items);
      Promise.resolve().then(() => {
        setSliceResults(items);
        setProgress(null); setRunning(false); setShowCancel(false); setToolState("success");
        toastSuccess(EN ? "Video split" : "Video rozpůleno");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("load_failed");
      Promise.resolve().then(() => failRun(msg));
    }
  };

  /** Režim crop — grafický ořez okrajů (tažený rámeček → -vf crop=w:h:x:y). */
  const runCrop = async () => {
    if (!naturalSize) { setError(EN ? "Load a video first." : "Nejdřív načtěte video."); setToolState("error"); return; }
    if (!crop || crop.w < 2 || crop.h < 2) {
      setError(EN ? "Drag a rectangle over the video to select the area to keep." : "Táhněte přes video rámeček s oblastí, kterou chcete ponechat.");
      setToolState("error"); return;
    }
    const controller = startRun();
    try {
      await ensureMedia();
      const media = getFFmpegMedia();
      if (!media) throw new Error(t("load_failed"));
      // % zobrazeného rámečku → přirozené pixely (sudé hodnoty pro yuv420p)
      const cw = even((crop.w / 100) * naturalSize.w);
      const ch = even((crop.h / 100) * naturalSize.h);
      const cx = Math.min(even((crop.x / 100) * naturalSize.w), naturalSize.w - cw);
      const cy = Math.min(even((crop.y / 100) * naturalSize.h), naturalSize.h - ch);
      const outExt = ext(file!.name) === "webm" ? "webm" : "mp4";
      media.runJob({
        file: file!,
        signal: controller.signal,
        inName: "in." + media.ext(file!.name),
        outName: "out." + outExt,
        outMime: outExt === "webm" ? "video/webm" : "video/mp4",
        args: (inN, outN) => ["-i", inN, "-vf", `crop=${cw}:${ch}:${cx}:${cy}`, "-c:v", "libx264", "-preset", "veryfast", "-c:a", "copy", outN],
        onProgress: (p, l) => Promise.resolve().then(() => setProgress({ pct: p, label: l })),
        onError: (m) => Promise.resolve().then(() => failRun(m)),
        onBlob: (blob) => Promise.resolve().then(() => {
          setResultPreview(URL.createObjectURL(blob));
          setResult({ blob, filename: "video-crop." + outExt });
          setProgress(null); setRunning(false); setShowCancel(false); setToolState("success");
          toastSuccess(EN ? "Video cropped" : "Video oříznuto");
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("load_failed");
      Promise.resolve().then(() => failRun(msg));
    }
  };

  const cancel = () => {
    abortRef.current?.abort(); abortRef.current = null;
    if (getFFmpegWrapper()) getFFmpegWrapper()!.cancel();
    setShowCancel(false); setProgress(null); setRunning(false);
    setToolState("ready");
  };

  const cropStyle = crop && crop.w > 0 && crop.h > 0 ? {
    left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%`,
  } : undefined;

  // Přirozené rozměry videa držíme ve stavu (ref nesmí být čten během renderu).
  const naturalCrop = naturalSize && crop && crop.w >= 2 && crop.h >= 2 ? {
    w: Math.round((crop.w / 100) * naturalSize.w),
    h: Math.round((crop.h / 100) * naturalSize.h),
  } : null;

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
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">ffmpeg.wasm — ořez času, rozpůlení, grafický crop okrajů</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vt2-work">
        <div className="seg" role="group" aria-label={EN ? "Mode" : "Režim"} style={{ marginBottom: "0.75rem" }}>
          <button type="button" className={mode === "trim" ? "active" : ""} aria-pressed={mode === "trim"} onClick={() => setMode("trim")}>{EN ? "Trim time" : "Ořez času"}</button>
          <button type="button" className={mode === "slice" ? "active" : ""} aria-pressed={mode === "slice"} onClick={() => setMode("slice")}>{EN ? "Split in half" : "Rozpůlit"}</button>
          <button type="button" className={mode === "crop" ? "active" : ""} aria-pressed={mode === "crop"} onClick={() => setMode("crop")}>{EN ? "Crop edges" : "Grafický crop"}</button>
        </div>

        {mode === "crop" ? (
          <div className="stack-sm" style={{ marginBottom: "0.5rem" }}>
            <span className="field-label">{EN ? "Drag a rectangle over the video — only that area will remain." : "Táhněte přes video rámeček — zůstane jen označená oblast."}</span>
            <div ref={videoBoxRef} style={{ position: "relative", display: "inline-block", maxWidth: "100%", touchAction: "none" }}>
              <video
                ref={previewElRef}
                className="media-preview"
                id="vt2-preview"
                controls
                preload="metadata"
                src={previewUrl ?? undefined}
                onLoadedMetadata={onLoadedMetadata}
                style={{ display: "block", maxWidth: "100%" }}
              />
              <div
                style={{ position: "absolute", inset: 0, cursor: "crosshair" }}
                onPointerDown={onCropDown}
                onPointerMove={onCropMove}
                onPointerUp={onCropUp}
                onPointerCancel={onCropUp}
                aria-hidden="true"
              >
                {cropStyle ? (
                  <div style={{
                    position: "absolute",
                    left: cropStyle.left, top: cropStyle.top, width: cropStyle.width, height: cropStyle.height,
                    border: "2px solid var(--et-accent, #5546ff)",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    borderRadius: "4px",
                    pointerEvents: "none",
                  }} />
                ) : null}
              </div>
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {naturalCrop ? `${naturalCrop.w}×${naturalCrop.h} px` : (EN ? "No selection yet" : "Zatím nic nevybráno")}
              </span>
              {crop ? <button className="btn btn-ghost btn-sm" type="button" onClick={() => setCrop(null)}>{EN ? "Clear selection" : "Zrušit výběr"}</button> : null}
            </div>
          </div>
        ) : (
          <video
            ref={previewElRef}
            className="media-preview"
            id="vt2-preview"
            controls
            preload="metadata"
            src={previewUrl ?? undefined}
            onLoadedMetadata={onLoadedMetadata}
          />
        )}

        {mode === "trim" ? (
          <>
            <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
              <div className="stack-sm">
                <label className="field-label" htmlFor="vt2-start">{EN ? "Start (HH:MM:SS)" : "Začátek (HH:MM:SS)"}</label>
                <input className="input" id="vt2-start" type="text" value={start} placeholder="00:00:05" onChange={(e) => onTextStart(e.target.value)} />
              </div>
              <div className="stack-sm">
                <label className="field-label" htmlFor="vt2-end">{EN ? "End (HH:MM:SS)" : "Konec (HH:MM:SS)"}</label>
                <input className="input" id="vt2-end" type="text" value={end} placeholder="00:00:30" onChange={(e) => onTextEnd(e.target.value)} />
              </div>
              <div className="stack-sm">
                <label className="field-label" htmlFor="vt2-reenc">{EN ? "Re-encode (precise)" : "Překódovat (přesnější)"}</label>
                <select className="select" id="vt2-reenc" value={reenc} onChange={(e) => setReenc(e.target.value as "0" | "1")}>
                  <option value="0">{EN ? "Copy (fast)" : "Kopírovat (rychlé)"}</option>
                  <option value="1">{EN ? "Re-encode" : "Překódovat"}</option>
                </select>
              </div>
            </div>
            <div className="media-range">
              <input id="vt2-start-range" type="range" min={0} max={duration || 0} value={startRange} step={0.1} onChange={(e) => onRangeStart(Number(e.target.value))} aria-label={EN ? "Start" : "Začátek"} />
              <input id="vt2-end-range" type="range" min={0} max={duration || 0} value={endRange} step={0.1} onChange={(e) => onRangeEnd(Number(e.target.value))} aria-label={EN ? "End" : "Konec"} />
              <output id="vt2-summary">{start} → {end}</output>
            </div>
          </>
        ) : null}

        {mode === "slice" ? (
          <div className="media-range">
            <label className="field-label" htmlFor="vt2-slice" style={{ marginBottom: "0.35rem" }}>
              {EN ? "Split point" : "Bod rozpůlení"}: <span className="mono">{stamp(sliceAt)}</span>
            </label>
            <input id="vt2-slice" type="range" min={0} max={duration || 0} value={Math.min(sliceAt, duration || 0)} step={0.1} onChange={(e) => setSliceAt(Number(e.target.value))} />
            <output id="vt2-slice-summary">00:00:00 → {stamp(sliceAt)} → {stamp(duration)}</output>
            <p className="muted" style={{ fontSize: "0.8rem", margin: "0.35rem 0 0" }}>
              {EN ? "Default is the middle of the video. Output: two files (part 1 and part 2)." : "Výchozí je střed videa. Výstupem jsou dva soubory (část 1 a část 2)."}
            </p>
          </div>
        ) : null}

        <div className="tool-action-bar">
          <button className={`btn btn-secondary btn-touch${showCancel ? "" : " hidden"}`} id="vt2-cancel" type="button" onClick={cancel}>{EN ? "Cancel" : "Zrušit"}</button>
          <button className="btn btn-primary btn-touch" id="vt2-run" type="button" disabled={!file || running} onClick={run}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" />
            </svg>{" "}
            {mode === "slice" ? (EN ? "Split video" : "Rozpůlit video") : mode === "crop" ? (EN ? "Crop video" : "Oříznout okraje") : (EN ? "Trim" : "Oříznout")}
          </button>
        </div>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      {sliceResults ? (
        <div className="stack-sm">
          {sliceResults.map((r, i) => (
            <div className="result-card" key={r.filename}>
              <span className="result-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg></span>
              <span className="rc-meta">
                <strong className="rc-title">{r.label}</strong>
                <span className="rc-sub">{r.filename}</span>
              </span>
              <a className="btn btn-primary btn-touch" href={r.url} download={r.filename}>{t("download")}</a>
            </div>
          ))}
        </div>
      ) : null}

      {resultUrl && mode === "trim" ? (
        <video className="media-preview" id="vt2-result-preview" controls src={resultUrl} />
      ) : null}
      {resultUrl && mode === "crop" ? (
        <video className="media-preview" id="vt2-result-preview" controls src={resultUrl} />
      ) : null}

      <ResultArea blob={result?.blob ?? null} filename={result?.filename ?? ""} onReset={reset} locale={locale} />

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        {EN
          ? "Processing runs locally via ffmpeg.wasm. „Copy“ is fast but cuts on keyframes; „Re-encode“ is precise. Graphical crop always re-encodes the video track."
          : "Zpracování běží lokálně přes ffmpeg.wasm. „Kopírovat“ je rychlé ale ořezá na klíčových snímcích; „Překódovat“ je přesné. Grafický crop vždy překóduje video stopu."}
      </p>
    </div>
  );
}
