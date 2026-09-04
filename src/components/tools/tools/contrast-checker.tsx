"use client";

// Kontrola kontrastu dle WCAG 2.1 — port legacy contrast-checker.js.
// Výpočet poměru jasu a badge AA/AAA. Čistě client-side.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

function parseColor(str: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  const probe = document.createElement("div");
  probe.style.color = "rgb(0,0,0)";
  probe.style.color = str;
  if (!probe.style.color) return null;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function lin(c: number): number { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function lum(rgb: [number, number, number]): number { return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]); }
function toHex(rgb: [number, number, number]): string { return "#" + rgb.map((c) => { const h = c.toString(16); return h.length < 2 ? "0" + h : h; }).join(""); }

export default function ContrastChecker({ locale }: ToolComponentProps) {
  void locale;
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#0f172a");
  const [fgText, setFgText] = useState("#ffffff");
  const [bgText, setBgText] = useState("#0f172a");

  const res = useMemo(() => {
    const f = parseColor(fgText);
    const b = parseColor(bgText);
    if (!f) return { err: 'Neplatná barva textu: "' + fgText + '".' };
    if (!b) return { err: 'Neplatná barva pozadí: "' + bgText + '".' };
    const L1 = lum(f), L2 = lum(b);
    const r = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { ratio: r, fgHex: toHex(f), bgHex: toHex(b) };
  }, [fgText, bgText]);

  const ratioText = res && "ratio" in res ? res.ratio!.toFixed(2) + " : 1" : "—";
  const badges = res && "ratio" in res
    ? { aa: res.ratio! >= 4.5, aaL: res.ratio! >= 3, aaa: res.ratio! >= 7, aaaL: res.ratio! >= 4.5 }
    : null;

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="cc-fg">Barva textu</label>
          <input className="input mono" id="cc-fg" value={fgText} onChange={(e) => setFgText(e.target.value)} />
          <input type="color" id="cc-fg-pick" value={fg} onChange={(e) => { setFg(e.target.value); setFgText(e.target.value); }} style={{ width: "100%", height: "2.5rem" }} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cc-bg">Barva pozadí</label>
          <input className="input mono" id="cc-bg" value={bgText} onChange={(e) => setBgText(e.target.value)} />
          <input type="color" id="cc-bg-pick" value={bg} onChange={(e) => { setBg(e.target.value); setBgText(e.target.value); }} style={{ width: "100%", height: "2.5rem" }} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
        <div id="cc-preview" style={{ color: fgText, background: bgText, padding: "1rem", borderRadius: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
          Aa Bb Cc ěščřžýáíé
        </div>
      </div>

      <div className="kv"><span className="k">Kontrastní poměr</span><span className="v accent" id="cc-ratio">{ratioText}</span></div>

      {res && "err" in res ? <p className="error-text" role="alert">{res.err}</p> : null}

      {badges ? (
        <div className="two-col">
          <div className="kv"><span className="k">WCAG AA (normální)</span><span className="v" id="cc-aa">{badges.aa ? "✅ Splňuje" : "❌ Nesplňuje"}</span></div>
          <div className="kv"><span className="k">WCAG AA (velký text)</span><span className="v" id="cc-aa-large">{badges.aaL ? "✅ Splňuje" : "❌ Nesplňuje"}</span></div>
          <div className="kv"><span className="k">WCAG AAA (normální)</span><span className="v" id="cc-aaa">{badges.aaa ? "✅ Splňuje" : "❌ Nesplňuje"}</span></div>
          <div className="kv"><span className="k">WCAG AAA (velký text)</span><span className="v" id="cc-aaa-large">{badges.aaaL ? "✅ Splňuje" : "❌ Nesplňuje"}</span></div>
        </div>
      ) : null}
    </div>
  );
}