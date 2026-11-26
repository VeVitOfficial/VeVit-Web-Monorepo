"use client";

// Náhled videa — <video> + canvas (bez ffmpeg), čistě client-side.
// Port legacy tools/assets/js/tools/video-thumbnail.js + náhled z odkazu
// (YouTube přehrávač/thumbnail, přímé URL videa).
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Dropzone, FileList, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = ["video/mp4", "video/webm", "video/ogg", "video/*"];

/** YouTube ID z běžných tvarů odkazů (watch?v=, youtu.be/, shorts/, embed/). */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

interface YtInfo { id: string; }

export default function VideoThumbnail({ locale }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [time, setTime] = useState(1);
  const [format, setFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/jpeg");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRemote, setIsRemote] = useState(false); // přímé URL videa (může být CORS-tainted)
  const [yt, setYt] = useState<YtInfo | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const capture = () => {
    const video = videoRef.current, cv = canvasRef.current;
    if (!video || !cv || !video.videoWidth) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = video.videoWidth; cv.height = video.videoHeight;
    try {
      ctx.drawImage(video, 0, 0);
      setReady(true);
      setError(null);
    } catch {
      // cross-origin video bez CORS hlaviček — canvas je tainted
      setReady(false);
      setError(locale === "en"
        ? "The frame cannot be saved from this source (the server does not allow cross-origin access). Playback and seeking work; use a downloaded file for saving."
        : "Snímek z tohoto zdroje nelze uložit (server nepovoluje cross-origin přístup). Přehrávání a posun času fungují; k uložení použijte stažený soubor.");
    }
  };

  useEffect(() => () => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  const reset = () => {
    setFile(null); setError(null); setReady(false); setVideoVisible(false);
    setVideoUrl(null); setIsRemote(false); setYt(null);
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
    setYt(null); setIsRemote(false); setReady(false);
    setFile(f);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(f);
    setVideoUrl(urlRef.current);
    setVideoVisible(true);
    setToolState("ready");
  };

  /** Náhled z odkazu: YouTube → přehrávač + thumbnail; jinak přímé URL videa. */
  const loadUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setError(null); setReady(false);
    const ytId = youtubeId(url);
    if (ytId) {
      setFile(null); setVideoUrl(null); setVideoVisible(false);
      setYt({ id: ytId });
      setToolState("ready");
      return;
    }
    // přímý soubor (mp4/webm/ogg…) — zkusíme načíst s CORS, ať jde snímek uložit
    let parsed: URL;
    try { parsed = new URL(url); } catch { setError(locale === "en" ? "Invalid URL." : "Neplatný odkaz."); setToolState("error"); return; }
    if (!/^https?:$/.test(parsed.protocol)) { setError(locale === "en" ? "Only http(s) links are supported." : "Podporované jsou jen http(s) odkazy."); setToolState("error"); return; }
    setYt(null); setFile(null);
    setIsRemote(true);
    setVideoUrl(url);
    setVideoVisible(true);
    setToolState("ready");
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    let t = time;
    if (video.duration && Number.isFinite(video.duration) && t >= video.duration) t = Math.min(video.duration / 2, 1);
    try { video.currentTime = t; } catch { /* ignore */ }
  };
  const onSeeked = () => capture();
  const onVideoError = () => {
    setError(locale === "en"
      ? "The video could not be loaded (unsupported codec or unreachable link)."
      : "Video se nepodařilo načíst (nepodporovaný kodek nebo nedostupný odkaz).");
    setToolState("error");
  };

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

  /** YouTube thumbnail — maximum rozlišení, co YouTube nabízí. */
  const ytThumbSrc = yt ? `https://i.ytimg.com/vi/${yt.id}/maxresdefault.jpg` : null;
  const onYtThumbError = () => {
    const img = document.getElementById("vt-yt-thumb") as HTMLImageElement | null;
    if (img && !img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${yt?.id}/hqdefault.jpg`;
  };

  const showFileControls = Boolean(file || isRemote);

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
        <span className="dz-hint">MP4, WebM, OGG, náhled přes &lt;video&gt; + canvas (bez ffmpeg)</span>
      </Dropzone>

      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "end" }}>
        <div className="stack-sm" style={{ flex: "1 1 16rem", minWidth: 0 }}>
          <label className="field-label" htmlFor="vt-url">{locale === "en" ? "Preview from link (YouTube or direct video URL)" : "Náhled z odkazu (YouTube nebo přímé URL videa)"}</label>
          <input
            className="input" id="vt-url" type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=…"
            value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); loadUrl(); } }}
          />
        </div>
        <button className="btn btn-secondary" id="vt-url-load" type="button" onClick={loadUrl}>
          {locale === "en" ? "Load" : "Načíst"}
        </button>
      </div>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      {yt ? (
        <div className="stack-sm" id="vt-yt">
          <iframe
            className="media-preview"
            style={{ width: "100%", aspectRatio: "16 / 9", border: 0, marginTop: "0.25rem" }}
            src={`https://www.youtube-nocookie.com/embed/${yt.id}?rel=0`}
            title={locale === "en" ? "YouTube preview" : "YouTube náhled"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <img
              id="vt-yt-thumb" src={ytThumbSrc ?? undefined} onError={onYtThumbError} alt=""
              style={{ maxWidth: "180px", borderRadius: "0.5rem", display: "block" }}
            />
            <div className="stack-sm" style={{ gap: "0.25rem" }}>
              <span className="muted" style={{ fontSize: "0.8rem" }}>
                {locale === "en"
                  ? "YouTube video cannot be frame-extracted locally — preview and thumbnail only. To grab a frame, download the video first."
                  : "YouTube video nelze lokálně rozřezávat na snímky — k dispozici je přehrávač a náhledový obrázek. K snímku si video nejprve stáhněte."}
              </span>
              <div className="row" style={{ gap: "0.5rem" }}>
                <a className="btn btn-outline" href={`https://i.ytimg.com/vi/${yt.id}/maxresdefault.jpg`} target="_blank" rel="noopener">
                  {locale === "en" ? "Open thumbnail" : "Otevřít náhled"}
                </a>
                <button className="btn btn-ghost" type="button" onClick={reset}>{locale === "en" ? "Clear" : "Zrušit"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={videoVisible && videoUrl ? "" : " hidden"} id="vt-work">
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
          crossOrigin={isRemote ? "anonymous" : undefined}
          src={videoUrl ?? undefined}
          onLoadedMetadata={onLoadedMetadata}
          onSeeked={onSeeked}
          onError={onVideoError}
          style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }}
        />
        <canvas ref={canvasRef} id="vt-canvas" style={{ maxWidth: "100%", borderRadius: "0.5rem", marginTop: "0.75rem" }} />
        {showFileControls ? (
          <button className="btn btn-primary" id="vt-dl" type="button" disabled={!ready} onClick={download} style={{ marginTop: "0.75rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
            </svg>{" "}
            Stáhnout
          </button>
        ) : null}
      </div>

      {error ? <p className="error-text" role="alert">{error}</p> : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Bez ffmpeg, používá nativní dekodér prohlížeče přes element &lt;video&gt; a canvas. Odkazy na YouTube zobrazí přehrávač a náhled. Běží lokálně.
      </p>
    </div>
  );
}
