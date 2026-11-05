"use client";

// Rozostření pozadí přes ONNX MODNet (onnxruntime-web), čistě client-side.
// Model /tools/assets/models/modnet.onnx: vstup [1,3,256,256] RGB, výstup
// alpha matte [1,1,256,256]. Kompozice: rozmazaná kopie celého obrázku jako
// základ + ostrý originál maskovaný alpha (destination-in), jak to dělá
// portrétový režim fotoaparátu.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript } from "@/components/tools/tool-runtime";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/bmp"];
const MAX = 25 * 1024 * 1024;
const MODEL = "/tools/assets/models/modnet.onnx";
const SIZE = 256;

function matchesAccept(f: File, accept: string[]): boolean {
  const name = f.name.toLowerCase();
  return accept.some((a) => {
    if (a.startsWith(".")) return name.endsWith(a);
    if (a.includes("/")) return f.type === a || (a.endsWith("/*") && f.type.startsWith(a.slice(0, -1)));
    return false;
  });
}

// window.ort typ sdílí bg-remover.tsx (declare global) — tady jen lokální alias
type OrtApi = NonNullable<Window["ort"]>;

export default function BlurBackground({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [blur, setBlur] = useState(12);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  const ensure = useCallback(async () => {
    if (window.ort) return true;
    try {
      await loadScript("/tools/assets/js/lib/onnx/ort.min.js");
      if (window.ort) (window.ort as unknown as OrtApi).env.wasm.wasmPaths = "/tools/assets/js/lib/onnx/";
      return !!window.ort;
    } catch { return false; }
  }, []);

  useEffect(() => () => {
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const pick = (list: FileList | null) => {
    if (!list || !list.length) return;
    const f = Array.from(list)[0];
    if (!matchesAccept(f, ACCEPT)) { setError(t("invalid_type")); return; }
    if (f.size > MAX) { setError(t("file_too_large", { name: f.name, limit: fmtSize(MAX) })); return; }
    setError("");
    if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    fileRef.current = f;
    setFileName(f.name);
    setFileSize(f.size);
    const newUrl = URL.createObjectURL(f);
    fileUrlRef.current = newUrl;
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = null; }
    setResult(null);
    Promise.resolve().then(() => setHasFile(true));
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const run = useCallback(async (blurPx: number) => {
    const file = fileRef.current;
    if (!file) return;
    setError("");
    setRunning(true);
    setProgress(5); setProgLabel("Načítám obrázek…");
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("Obrázek se nepodařilo načíst."));
        im.src = url;
      });
      const W = img.naturalWidth, H = img.naturalHeight;

      setProgress(20); setProgLabel("Načítám AI model (MODNet, první použití ~25 MB)…");
      const ok = await ensure();
      if (!ok) throw new Error("Knihovnu pro AI se nepodařilo načíst. Zkontrolujte připojení.");
      const session = await window.ort!.InferenceSession.create(MODEL);

      setProgress(50); setProgLabel("Rozpoznávám objekt v popředí…");
      // vstup: RGB 0..1, NCHW [1,3,256,256]
      const c = document.createElement("canvas"); c.width = SIZE; c.height = SIZE;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
      const n = SIZE * SIZE;
      const rgb = new Float32Array(3 * n);
      for (let i = 0; i < n; i++) {
        rgb[0 * n + i] = d[i * 4] / 255;
        rgb[1 * n + i] = d[i * 4 + 1] / 255;
        rgb[2 * n + i] = d[i * 4 + 2] / 255;
      }
      const input = new window.ort!.Tensor("float32", rgb, [1, 3, SIZE, SIZE]);
      const out = await session.run({ input });

      setProgress(75); setProgLabel("Rozostřuji pozadí…");
      // alpha matte → canvas
      const alpha = Object.values(out)[0].data;
      const ac = document.createElement("canvas"); ac.width = SIZE; ac.height = SIZE;
      const actx = ac.getContext("2d")!;
      const aimg = actx.createImageData(SIZE, SIZE);
      for (let i = 0; i < n; i++) {
        const v = Math.max(0, Math.min(255, Math.round(alpha[i] * 255)));
        aimg.data[i * 4] = v; aimg.data[i * 4 + 1] = v; aimg.data[i * 4 + 2] = v; aimg.data[i * 4 + 3] = 255;
      }
      actx.putImageData(aimg, 0, 0);

      // kompozice: rozmazané pozadí + ostrý popředí přes masku
      const out2 = document.createElement("canvas"); out2.width = W; out2.height = H;
      const octx = out2.getContext("2d")!;
      octx.filter = `blur(${blurPx}px)`;
      octx.drawImage(img, 0, 0, W, H);
      octx.filter = "none";

      // ostrý originál oříznutý maskou
      const fg = document.createElement("canvas"); fg.width = W; fg.height = H;
      const fctx = fg.getContext("2d")!;
      fctx.drawImage(img, 0, 0, W, H);
      fctx.globalCompositeOperation = "destination-in";
      fctx.drawImage(ac, 0, 0, W, H);
      fctx.globalCompositeOperation = "source-over";
      octx.drawImage(fg, 0, 0);

      setProgress(95); setProgLabel("Ukládám…");
      const blob = await new Promise<Blob>((res) => out2.toBlob((b) => res(b!), "image/png", 0.92));
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const rUrl = URL.createObjectURL(blob);
      resultUrlRef.current = rUrl;
      setResult({ url: rUrl, size: blob.size });
      setProgress(100); setProgLabel("");
    } catch (e) {
      setError((e as Error).message || "Zpracování selhalo.");
      setProgress(0); setProgLabel("");
    } finally {
      URL.revokeObjectURL(url);
      setRunning(false);
    }
  }, [ensure]);

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url; a.download = "s-rozmazanym-pozadim.png";
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="bb-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek s objektem v popředí</span>
        <span className="dz-hint">PNG, JPG, WebP — nejlépe funguje osoba/produkt</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div className="stack-sm" id="bb-work">
          <div className="file-item"><span className="fi-meta"><span className="fi-name">{fileName}</span><span className="fi-size">{fmtSize(fileSize)}</span></span></div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="bb-blur">Síla rozostření: <span id="bb-blur-v">{blur}</span> px</label>
            <input type="range" id="bb-blur" min={4} max={24} value={blur} style={{ width: "100%" }} onChange={(e) => setBlur(+e.target.value)} />
          </div>
          <button className="btn btn-primary btn-touch" id="bb-run" type="button" disabled={running} onClick={() => { void run(blur); }}>
            {running ? "Zpracovávám…" : "Rozostřit pozadí"}
          </button>
        </div>
      ) : null}

      {running && progress > 0 ? (
        <div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p className="progress-label" style={{ fontSize: "0.8rem" }}>{progLabel}</p>
        </div>
      ) : null}

      {result ? (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></span>
          <div className="rc-meta"><span className="rc-title">s-rozmazanym-pozadim.png</span><span className="rc-sub">{fmtSize(result.size)}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}>Stáhnout</button>
        </div>
      ) : null}

      {result ? <img src={result.url} alt="Výsledek" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} /> : null}
      {error ? <p className="error-text" id="bb-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Běží lokálně přes AI model MODNet (onnxruntime-web) — při prvním použití se stáhne ~25 MB modelu. Obrázek neopustí váš počítač.</p>
    </div>
  );
}
