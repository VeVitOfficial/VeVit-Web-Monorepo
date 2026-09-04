"use client";

// Převodník barev — HEX / RGB / HSL, živý přepočet + swatch. Čistě client-side.
// Portuje legacy-public/tools/color-converter.html + public/tools/assets/js/tools/color-converter.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon, copyText } from "@/components/tools/tool-runtime";

const S = { local: "Lokální", hex: "HEX", rgb: "RGB", hsl: "HSL" };

function parseHex(h: string) {
  const clean = h.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

// rgbToHsl 1:1 s legacy color-converter.js.
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export default function ColorConverter({ locale }: ToolComponentProps) {
  const [hex, setHex] = useState("#10b981");
  const [rgb, setRgb] = useState("16, 185, 129");
  const [hsl, setHsl] = useState("153, 84%, 40%");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const update = (val: string) => {
    setHex(val);
    const p = parseHex(val);
    if (!p) return;
    setRgb(`${p.r}, ${p.g}, ${p.b}`);
    const h = rgbToHsl(p.r, p.g, p.b);
    setHsl(`${h.h}, ${h.s}%, ${h.l}%`);
  };

  const doCopy = (key: string, val: string) => {
    copyText(val, locale).then((ok) => {
      if (ok) {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      }
    });
  };

  const parsed = parseHex(hex);
  const swatchBg = parsed ? hex : "#10b981";
  const display = parsed ? hex.toUpperCase() : "#10B981";

  return (
    <div className="stack" style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <div className="row" style={{ gap: "0.5rem", marginBottom: "0.25rem" }}>
        <span className="badge badge-loc-local">{S.local}</span>
      </div>

      <div className="row" style={{ gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
        <div className="swatch" id="cc-swatch" style={{ background: swatchBg }} />
        <div className="input-mono" id="cc-hex-display" style={{ fontSize: "1.5rem", fontWeight: 600 }}>{display}</div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="cc-hex">{S.hex}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input input-mono" id="cc-hex" value={hex} onChange={(e) => update(e.target.value)} />
          <button className="btn btn-ghost btn-icon cc-copy" type="button" onClick={() => doCopy("hex", hex)} aria-label="Kopírovat HEX">
            <Icon name={copiedKey === "hex" ? "Check" : "Copy"} size={16} />
          </button>
        </div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="cc-rgb">{S.rgb}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input input-mono" id="cc-rgb" value={rgb} readOnly />
          <button className="btn btn-ghost btn-icon cc-copy" type="button" onClick={() => doCopy("rgb", rgb)} aria-label="Kopírovat RGB">
            <Icon name={copiedKey === "rgb" ? "Check" : "Copy"} size={16} />
          </button>
        </div>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="cc-hsl">{S.hsl}</label>
        <div className="row" style={{ gap: "0.5rem" }}>
          <input className="input input-mono" id="cc-hsl" value={hsl} readOnly />
          <button className="btn btn-ghost btn-icon cc-copy" type="button" onClick={() => doCopy("hsl", hsl)} aria-label="Kopírovat HSL">
            <Icon name={copiedKey === "hsl" ? "Check" : "Copy"} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}