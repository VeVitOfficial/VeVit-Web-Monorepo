"use client";

// Křivka audia — Web Audio API decodeAudioData, render na canvas, export PNG/SVG.
// Portuje legacy tools/assets/js/tools/audio-waveform.js.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { toastSuccess } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, Progress, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = ["audio/*", ".mp3", ".wav", ".ogg", ".m4a", ".flac"];

function computePeaks(ch: Float32Array, n: number): number[] {
  const block = Math.floor(ch.length / n);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let max = 0;
    for (let j = 0; j < block; j++) {
      const s = Math.abs(ch[i * block + j] || 0);
      if (s > max) max = s;
    }
    out.push(max);
  }
  let peak = 0;
  for (const v of out) if (v > peak) peak = v;
  return peak > 0 ? out.map((v) => v / peak) : out;
}

export default function AudioWaveform({ locale }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState("#22d3ee");
  const [bg, setBg] = useState("#0b1220");
  const [bars, setBars] = useState(200);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<number[] | null>(null);

  const draw = useCallback(() => {
    const peaks = peaksRef.current;
    const cv = canvasRef.current;
    if (!peaks || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const n = Math.max(20, Math.min(1000, bars));
    const W = 1200, H = 300;
    cv.width = W; cv.height = H;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color;
    const bw = W / n, mid = H / 2;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor((i * peaks.length) / n);
      const v = peaks[idx];
      const bh = Math.max(1, v * mid);
      ctx.fillRect(i * bw, mid - bh, Math.max(1, bw - 1), bh * 2);
    }
    setReady(true);
  }, [bars, bg, color]);

  useEffect(() => { draw(); }, [draw]);

  const reset = () => {
    setFile(null); setError(null); setProgress(null); setReady(false);
    peaksRef.current = null;
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null);
    if (f.size > 100 * 1024 * 1024) { setError("Audio je příliš velké (max 100 MB)."); setToolState("error"); return; }
    setFile(f); setReady(false); peaksRef.current = null;
    setProgress({ pct: 20, label: locale === "en" ? "Decoding audio…" : "Dekóduji audio…" });
    setToolState("processing");
    f.arrayBuffer().then((buf) => {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      return ac.decodeAudioData(buf);
    }).then((buffer) => {
      setProgress({ pct: 70, label: locale === "en" ? "Computing waveform…" : "Počítám křivku…" });
      const n = Math.max(20, Math.min(1000, bars));
      peaksRef.current = computePeaks(buffer.getChannelData(0), n);
      draw();
      setProgress({ pct: 100, label: locale === "en" ? "Done" : "Hotovo" });
      Promise.resolve().then(() => setProgress(null));
      setToolState("success");
      toastSuccess(locale === "en" ? "Waveform rendered" : "Křivka vykreslena");
    }).catch((e: unknown) => {
      const m = e instanceof Error ? e.message : "Dekódování audia selhalo (nepodporovaný formát?).";
      setProgress(null); setError(m); setToolState("error");
    });
  };

  const downloadPng = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.toBlob((b) => { if (b) downloadBlob(b, "křivka.png"); }, "image/png");
  };
  const downloadSvg = () => {
    const peaks = peaksRef.current;
    if (!peaks) return;
    const n = peaks.length, W = 1200, H = 300, bw = W / n, mid = H / 2;
    const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>`];
    for (let i = 0; i < n; i++) {
      const bh = Math.max(1, peaks[i] * mid);
      parts.push(`<rect x="${(i * bw).toFixed(1)}" y="${(mid - bh).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${(bh * 2).toFixed(1)}" fill="${color}"/>`);
    }
    parts.push("</svg>");
    downloadBlob(new Blob([parts.join("")], { type: "image/svg+xml" }), "křivka.svg");
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte audio" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
            <path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte audio</span>
        <span className="dz-hint">MP3, WAV, OGG, M4A — křivka přes Web Audio API</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="aw-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="aw-color">Barva</label>
            <input type="color" id="aw-color" value={color} style={{ width: "4rem", height: "2.4rem", padding: "0.2rem" }} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="aw-bg">Pozadí</label>
            <input type="color" id="aw-bg" value={bg} style={{ width: "4rem", height: "2.4rem", padding: "0.2rem" }} onChange={(e) => setBg(e.target.value)} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="aw-bars">Sloupců</label>
            <input className="input" id="aw-bars" type="number" value={bars} min={20} max={1000} style={{ width: "6rem" }} onChange={(e) => setBars(Number(e.target.value) || 200)} />
          </div>
        </div>
        <canvas ref={canvasRef} id="aw-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }} />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button className="btn btn-secondary" id="aw-png" type="button" disabled={!ready} onClick={downloadPng}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
            </svg>{" "}
            Stáhnout PNG
          </button>
          <button className="btn btn-secondary" id="aw-svg" type="button" disabled={!ready} onClick={downloadSvg}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
            </svg>{" "}
            Stáhnout SVG
          </button>
        </div>
      </div>

      <Progress pct={progress?.pct} label={progress?.label} hidden={!progress} indeterminate={progress != null && progress.pct <= 0} />

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Dekódování přes Web Audio API (AudioContext.decodeAudioData). Běží lokálně — audio neopustí prohlížeč.
      </p>
    </div>
  );

  function downloadBlob(b: Blob, name: string) {
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}