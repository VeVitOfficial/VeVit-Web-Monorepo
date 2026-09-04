"use client";

// Náhled videa — <video> + canvas (bez ffmpeg), čistě client-side.
// Portuje legacy tools/assets/js/tools/video-thumbnail.js.
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Dropzone, FileList, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/mp4", "video/webm", "video/ogg", "video/*"];

export default function VideoThumbnail({ locale }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [time, setTime] = useState(1);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/jpeg");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const capture = () => {
    const video = videoRef.current, cv = canvasRef.current;
    if (!video || !cv || !video.videoWidth) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = video.videoWidth; cv.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    setReady(true);
  };

  useEffect(() => () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  const reset = () => {
    setFile(null); setError(null); setReady(false); setVideoVisible(false);
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    if (videoRef.current) videoRef.current.removeAttribute("src");
    setToolState("idle");
  };

  const onFiles = (arr: File[]) => {
    const f = arr[0];
    setError(null);
    if (f.size > 200 * 1024 * 1024) { setError("Video je příliš velké (max 200 MB)."); setToolState("error"); return; }
    if (!/video\//.test(f.type) && !/\.(mp4|webm|ogg|mov|mkv)$/i.test(f.name)) {
      setError("Vyberte video soubor."); setToolState("error"); return;
    }
    setFile(f); setReady(false);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(f);
    setVideoVisible(true);
    setToolState("ready");
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    let t = time;
    if (t >= video.duration) t = Math.min(video.duration / 2, 1);
    try { video.currentTime = t; } catch { /* ignore */ }
  };
  const onSeeked = () => capture();
  const onVideoError = () => { setError("Video se nepodařilo načíst (nepodporovaný kodek?)."); setToolState("error"); };

  const onTimeChange = () => {
    const video = videoRef.current;
    if (!video) return;
    let t = time;
    if (video.duration && t >= video.duration) t = video.duration - 0.1;
    try { video.currentTime = Math.max(0, t); } catch { /* ignore */ }
  };

  const download = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const extName = format === "image/png" ? "png" : format === "image/jpeg" ? "jpg" : "webp";
    cv.toBlob((b) => {
      if (!b) return;
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url; a.download = "nahled-videa." + extName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, format, 0.92);
  };

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte video" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte video</span>
        <span className="dz-hint">MP4, WebM, OGG — náhled přes &lt;video&gt; + canvas (bez ffmpeg)</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      <div className={file ? "" : " hidden"} id="vt-work">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vt-time">Čas snímku (s)</label>
            <input className="input" id="vt-time" type="number" value={time} min={0} step={0.1} style={{ width: "6rem" }} onChange={(e) => setTime(Number(e.target.value) || 0)} onBlur={onTimeChange} />
          </div>
          <div className="stack-sm">
            <label className="field-label" htmlFor="vt-format">Formát</label>
            <select className="select" id="vt-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </div>
        <video
          ref={videoRef}
          id="vt-video"
          controls
          hidden={!videoVisible}
          onLoadedMetadata={onLoadedMetadata}
          onSeeked={onSeeked}
          onError={onVideoError}
          style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }}
        />
        <canvas ref={canvasRef} id="vt-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }} />
        <button className="btn btn-primary" id="vt-dl" type="button" disabled={!ready} onClick={download} style={{ marginTop: "0.75rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
          </svg>{" "}
          Stáhnout
        </button>
      </div>

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Bez ffmpeg — používá nativní dekodér prohlížeče přes element &lt;video&gt; a canvas. Běží lokálně.
      </p>
    </div>
  );
}