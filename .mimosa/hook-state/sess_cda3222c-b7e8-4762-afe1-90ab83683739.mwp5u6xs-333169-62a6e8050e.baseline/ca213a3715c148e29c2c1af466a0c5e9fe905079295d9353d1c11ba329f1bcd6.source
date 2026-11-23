"use client";

// Generátor barevné palety (HSL) — port legacy color-palette-generator.js.
// Komplementární, analogická, triadická, tetradická, monochromatická, odstíny.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { toastSuccess } from "@/components/tools/tool-runtime";

type Scheme = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic" | "shades";

function hexToHsl(hex: string): [number, number, number] | null {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; let s = 0; const l = (mx + mn) / 2;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const to = (x: number) => { const v = Math.round(255 * x); return v.toString(16).padStart(2, "0"); };
  return "#" + to(f(0)) + to(f(8)) + to(f(4));
}

function palette(hsl: [number, number, number], scheme: Scheme): [number, number, number][] {
  const [h, s, l] = hsl;
  switch (scheme) {
    case "complementary": return [[h, s, l], [(h + 180) % 360, s, l]];
    case "analogous": return [[(h + 330) % 360, s, l], [h, s, l], [(h + 30) % 360, s, l]];
    case "triadic": return [[h, s, l], [(h + 120) % 360, s, l], [(h + 240) % 360, s, l]];
    case "tetradic": return [[h, s, l], [(h + 90) % 360, s, l], [(h + 180) % 360, s, l], [(h + 270) % 360, s, l]];
    case "monochromatic": return [20, 40, 60, 80].map((ll) => [h, s, ll]);
    case "shades": return [10, 25, 40, 55, 70, 85].map((ll) => [h, s, ll]);
    default: return [[h, s, l]];
  }
}

export default function ColorPaletteGenerator({ locale }: ToolComponentProps) {
  void locale;
  const [base, setBase] = useState("#6366f1");
  const [pick, setPick] = useState("#6366f1");
  const [scheme, setScheme] = useState<Scheme>("complementary");

  const swatches = useMemo(() => {
    const hsl = hexToHsl(base);
    if (!hsl) return [];
    return palette(hsl, scheme).map((c) => {
      const hex = hslToHex(c[0], c[1], c[2]);
      return { hex, light: c[2] > 55 };
    });
  }, [base, scheme]);

  const onPick = (v: string) => { setPick(v); setBase(v); };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cp-base">Základní barva (HEX)</label>
          <input className="input mono" id="cp-base" value={base} onChange={(e) => setBase(e.target.value)} style={{ width: "8rem" }} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cp-pick">Barva</label>
          <input type="color" id="cp-pick" value={pick} onChange={(e) => onPick(e.target.value)} style={{ width: "3.5rem", height: "2.5rem", padding: "0.2rem" }} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cp-scheme">Schéma</label>
          <select className="select" id="cp-scheme" value={scheme} onChange={(e) => setScheme(e.target.value as Scheme)}>
            <option value="complementary">Komplementární</option>
            <option value="analogous">Analogická</option>
            <option value="triadic">Triadická</option>
            <option value="tetradic">Tetradická</option>
            <option value="monochromatic">Monochromatická</option>
            <option value="shades">Odstíny</option>
          </select>
        </div>
      </div>

      <div id="cp-out" className="row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        {swatches.map((sw, i) => (
          <button key={i} type="button"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              width: "7rem", height: "6rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.1)",
              background: sw.hex, color: sw.light ? "#111" : "#fff",
              fontFamily: "ui-monospace,monospace", fontSize: "0.8rem", padding: "0.4rem", cursor: "pointer",
            }}
            title={"Klik = kopírovat " + sw.hex}
            onClick={() => { void navigator.clipboard.writeText(sw.hex).then(() => toastSuccess(sw.hex + " zkopírováno")); }}>
            {sw.hex}
          </button>
        ))}
      </div>
    </div>
  );
}