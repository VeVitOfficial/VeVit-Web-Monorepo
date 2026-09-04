"use client";

// Open Graph meta generátor — port legacy og-meta-generator.js.
// Živý náhled karty + export meta tagů. Čistě client-side.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function host(u: string): string {
  try { return new URL(u).hostname; } catch { return u || ""; }
}

export default function OgMetaGenerator({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [img, setImg] = useState("");
  const [site, setSite] = useState("");
  const [type, setType] = useState("website");

  const out = useMemo(() => {
    const lines = [
      `<meta property="og:title" content="${esc(title)}">`,
      `<meta property="og:description" content="${esc(desc)}">`,
      `<meta property="og:type" content="${esc(type)}">`,
    ];
    if (url) lines.push(`<meta property="og:url" content="${esc(url)}">`);
    if (img) lines.push(`<meta property="og:image" content="${esc(img)}">`);
    if (site) lines.push(`<meta property="og:site_name" content="${esc(site)}">`);
    lines.push('<meta name="twitter:card" content="summary_large_image">');
    lines.push(`<meta name="twitter:title" content="${esc(title)}">`);
    lines.push(`<meta name="twitter:description" content="${esc(desc)}">`);
    if (img) lines.push(`<meta name="twitter:image" content="${esc(img)}">`);
    return lines.join("\n");
  }, [title, desc, url, img, site, type]);

  const onCopy = async () => { if (out) { const ok = await copy(out); if (ok) toastSuccess("Zkopírováno"); } };

  const cSite = site || host(url) || "example.com";
  const cTitle = title || "Titulek stránky";
  const cDesc = desc || "Popis stránky…";

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="og-title">Titulek</label>
          <input className="input" id="og-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="og-type">Typ</label>
          <select className="select" id="og-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="website">website</option>
            <option value="article">article</option>
            <option value="product">product</option>
            <option value="profile">profile</option>
          </select>
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="og-desc">Popis</label>
        <textarea className="textarea" id="og-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="og-url">URL</label>
          <input className="input" id="og-url" placeholder="https://example.com/clanek" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="og-img">Obrázek URL</label>
          <input className="input" id="og-img" placeholder="https://example.com/og.png" value={img} onChange={(e) => setImg(e.target.value)} />
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="og-site">Název webu (volitelné)</label>
        <input className="input" id="og-site" value={site} onChange={(e) => setSite(e.target.value)} />
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "1rem" }}>
        <span className="field-label">Náhled karty</span>
        <div className="og-card" style={{ maxWidth: "28rem", borderRadius: "0.75rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div id="og-card-img" style={{
            height: "160px", display: "flex", alignItems: "center", justifyContent: "center",
            background: img ? `url("${img}") center/cover` : "rgba(255,255,255,0.05)",
            color: "var(--muted)", fontSize: "0.85rem",
          }}>{img ? "" : "Bez obrázku"}</div>
          <div style={{ padding: "0.75rem 1rem", background: "rgba(0,0,0,0.2)" }}>
            <div id="og-card-site" className="muted" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>{cSite}</div>
            <div id="og-card-title" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{cTitle}</div>
            <div id="og-card-desc" className="muted" style={{ fontSize: "0.85rem" }}>{cDesc}</div>
          </div>
        </div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="og-out">Meta tagy</label>
        <textarea className="textarea mono" id="og-out" rows={10} readOnly value={out} />
        <button className="btn btn-secondary" id="og-copy" type="button" onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
    </div>
  );
}