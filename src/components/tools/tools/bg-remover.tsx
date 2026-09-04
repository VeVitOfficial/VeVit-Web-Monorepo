"use client";

// Odstranění pozadí přes ONNX MODNet (onnxruntime-web), čistě client-side.
// Model: /tools/assets/models/modnet.onnx, vstup [1,3,256,256] RGB, výstup [1,1,256,256] alpha matte.
// Port legacy bg-remover.js. Renderuje pouze vnitřní tělo .tool-tool.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useToolUi, fmtSize, loadScript, toastSuccess } from "@/components/tools/tool-runtime";

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

declare global {
  interface Window {
    ort?: {
      env: { wasm: { wasmPaths: string } };
      Tensor: new (type: "float32", data: Float32Array, dims: number[]) => unknown;
      InferenceSession: { create: (m: string) => Promise<{ run: (i: Record<string, unknown>) => Promise<Record<string, { data: Float32Array }>> }> };
    };
  }
}

export default function BgRemover({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const [hasFile, setHasFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileUrl, setFileUrl] = useState("");
  const [bgSel, setBgSel] = useState<"transparent" | "white" | "black" | "green">("transparent");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);

  const ensure = useCallback(async () => {
    if (window.ort) return true;
    try { await loadScript("/tools/assets/js/lib/onnx/ort.min.js"); return !!window.ort; }
    catch { return false; }
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
    setFileUrl(newUrl);
    if (resultUrlRef.current) { URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = null; }
    setResult(null);
    Promise.resolve().then(() => setHasFile(true));
  };

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.remove("dragover"); pick(e.dataTransfer.files); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).classList.add("dragover"); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).classList.remove("dragover"); };

  const preprocess = (img: HTMLImageElement): Float32Array => {
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
    return rgb;
  };

  const postprocess = (alpha: Float32Array, img: HTMLImageElement): Promise<Blob> => {
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    const ac = document.createElement("canvas"); ac.width = SIZE; ac.height = SIZE;
    const actx = ac.getContext("2d")!;
    const aimg = actx.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const v = Math.max(0, Math.min(255, Math.round(alpha[i] * 255)));
      aimg.data[i * 4] = v; aimg.data[i * 4 + 1] = v; aimg.data[i * 4 + 2] = v; aimg.data[i * 4 + 3] = 255;
    }
    actx.putImageData(aimg, 0, 0);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const octx = out.getContext("2d")!;
    if (bgSel === "white") { octx.fillStyle = "#ffffff"; octx.fillRect(0, 0, W, H); }
    else if (bgSel === "black") { octx.fillStyle = "#000000"; octx.fillRect(0, 0, W, H); }
    else if (bgSel === "green") { octx.fillStyle = "#00b140"; octx.fillRect(0, 0, W, H); }
    octx.drawImage(img, 0, 0, W, H);
    octx.globalCompositeOperation = "destination-in";
    octx.drawImage(ac, 0, 0, W, H);
    octx.globalCompositeOperation = "source-over";
    return new Promise((res) => out.toBlob((b) => res(b!), "image/png", 0.92));
  };

  const run = useCallback(async () => {
    const file = fileRef.current;
    if (!file) return;
    setError("");
    setRunning(true);
    setProgress(5); setProgLabel("Načítám obrázek…");
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement | null>((res) => {
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); res(im); };
      im.onerror = () => { URL.revokeObjectURL(url); res(null); };
      im.src = url;
    });
    if (!img) { setError("Obrázek se nepodařilo načíst."); setRunning(false); return; }
    setProgress(10); setProgLabel("Načítám AI model (~26 MB, první spuštění může trvat)…");
    const ok = await ensure();
    if (!ok || !window.ort) { setError("Knihovnu onnxruntime-web se nepodařilo načíst."); setRunning(false); return; }
    window.ort.env.wasm.wasmPaths = "/tools/assets/js/lib/onnx/";
    try {
      const session = await window.ort.InferenceSession.create(MODEL);
      setProgress(55); setProgLabel("Zpracovávám (inference)…");
      const input = preprocess(img);
      const tensor = new window.ort.Tensor("float32", input, [1, 3, SIZE, SIZE]);
      const res = await session.run({ input });
      const keys = Object.keys(res);
      const out0 = res[keys[0]];
      setProgress(85); setProgLabel("Skládám výsledek…");
      const blob = await postprocess(out0.data, img);
      setProgress(100); setProgLabel("Hotovo");
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const rurl = URL.createObjectURL(blob);
      resultUrlRef.current = rurl;
      setResult({ url: rurl, size: blob.size });
      setRunning(false);
      toastSuccess("Pozadí odstraněno");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zpracování selhalo (nepodařilo se spustit model).");
      setRunning(false);
    }
  }, [ensure, bgSel]);

  const dl = () => {
    if (!result) return;
    const a = document.createElement("a"); a.href = result.url; a.download = "bez-pozadi.png"; a.click();
  };

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="dropzone" id="bg-drop" tabIndex={0} role="button" aria-label="Přetáhněte obrázek"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave}>
        <span className="dz-ico"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg></span>
        <span className="dz-title">Přetáhněte obrázek</span>
        <span className="dz-hint">PNG, JPG, WebP, BMP — jedno fotka / postava</span>
        <input ref={inputRef} type="file" className="hidden" accept={ACCEPT.join(",")} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} aria-hidden="true" />
      </div>

      {hasFile ? (
        <div id="bg-work">
          <div className="file-list" id="bg-list">
            <div className="file-row">
              {fileUrl ? <img src={fileUrl} alt="" className="file-thumb" /> : null}
              <span className="file-name">{fileName}</span>
              <span className="muted" style={{ fontSize: "0.75rem" }}>{fmtSize(fileSize)}</span>
            </div>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem" }}>Pozadí:
              <select className="select" id="bg-bg" value={bgSel} onChange={(e) => setBgSel(e.target.value as typeof bgSel)}>
                <option value="transparent">Průhledné (PNG)</option>
                <option value="white">Bílé</option>
                <option value="black">Černé</option>
                <option value="green">Zelené (chroma key)</option>
              </select>
            </label>
            <button className="btn btn-primary btn-touch" id="bg-run" type="button" disabled={running} onClick={run}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z" /></svg> Odstranit pozadí
            </button>
          </div>
          {running ? (
            <div className="stack-sm" style={{ marginTop: "0.75rem" }}>
              <progress id="bg-prog" value={progress} max={100} style={{ width: "100%" }} />
              <span className="muted" id="bg-prog-label" style={{ fontSize: "0.8rem" }}>{progLabel} {progress}%</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div id="bg-out" className="stack-sm" style={{ marginTop: "0.75rem" }}>
          <img src={result.url} alt="Výsledek" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} />
          <button className="btn btn-secondary btn-touch" type="button" onClick={dl}>Stáhnout PNG ({fmtSize(result.size)})</button>
        </div>
      ) : null}

      {error ? <p className="error-text" id="bg-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Lokální AI model MODNet (ONNX Runtime Web, ~26 MB). První spuštění stahuje model a WASM — další už z mezipaměti prohlížeče. Nic se neodesílá na server.</p>
    </div>
  );
}