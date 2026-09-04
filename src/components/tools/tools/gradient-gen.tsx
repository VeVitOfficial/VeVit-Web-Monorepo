"use client";

// CSS Gradient Editor — port legacy gradient-gen.js.
// Lineární/radiální/konický, živý náhled + export CSS, dynamické zarážky.
import { useMemo, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

type GType = "linear" | "radial" | "conic";
interface Stop { id: number; color: string; pos: number; }

const PALETTE = ["#6366f1", "#ec4899", "#f59e0b"];

function clampP(v: number): number { return Math.max(0, Math.min(100, isNaN(v) ? 0 : v)); }

export default function GradientGen({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [type, setType] = useState<GType>("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<Stop[]>([
    { id: 1, color: "#6366f1", pos: 0 },
    { id: 2, color: "#ec4899", pos: 100 },
  ]);
  const seqRef = useRef(2);

  const css = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    const list = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
    if (!list) return "background: linear-gradient(0deg, #000, #000);";
    let g: string;
    if (type === "linear") g = `linear-gradient(${angle}deg, ${list})`;
    else if (type === "radial") g = `radial-gradient(circle, ${list})`;
    else g = `conic-gradient(from ${angle}deg, ${list})`;
    return `background: ${g};`;
  }, [type, angle, stops]);

  const updateStop = (id: number, patch: Partial<Stop>) =>
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeStop = (id: number) => setStops((prev) => prev.filter((s) => s.id !== id));
  const addStop = () => {
    const id = ++seqRef.current;
    setStops((prev) => [...prev, { id, color: PALETTE[id % 3], pos: prev.length === 0 ? 0 : 100 }]);
  };

  const onCopy = async () => { if (css) { const ok = await copy(css); if (ok) toastSuccess("CSS zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm" style={{ minWidth: "9rem" }}>
          <label className="field-label" htmlFor="gg-type">Typ gradientu</label>
          <select className="select" id="gg-type" value={type} onChange={(e) => setType(e.target.value as GType)}>
            <option value="linear">Lineární</option>
            <option value="radial">Radiální</option>
            <option value="conic">Konický</option>
          </select>
        </div>
        <div className="stack-sm" id="gg-angle-wrap" style={{ display: type === "radial" ? "none" : undefined }}>
          <label className="field-label" htmlFor="gg-angle">Úhel: <span className="mono" id="gg-angle-val">{angle}</span>°</label>
          <div className="range-row"><input type="range" id="gg-angle" min={0} max={360} step={1} value={angle} onChange={(e) => setAngle(parseInt(e.target.value, 10))} /><span className="range-val">0–360</span></div>
        </div>
      </div>

      <div className="stack-sm">
        <span className="field-label">Zarážky barev</span>
        <div id="gg-stops" className="stack-sm">
          {stops.map((s) => (
            <div className="row" key={s.id} style={{ gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input type="color" className="input" aria-label="Barva zarážky" value={s.color}
                style={{ width: "3.5rem", height: "2.5rem", padding: "0.2rem" }}
                onChange={(e) => updateStop(s.id, { color: e.target.value })} />
              <input type="number" className="input" aria-label="Pozice %" min={0} max={100} step={1} value={s.pos} inputMode="numeric"
                style={{ width: "5rem" }} onChange={(e) => updateStop(s.id, { pos: clampP(parseInt(e.target.value, 10)) })} />
              <span className="muted" style={{ fontSize: "0.8rem" }}>%</span>
              <button className="btn btn-ghost btn-icon-sm" aria-label="Odebrat zarážku" onClick={() => removeStop(s.id)}>
                <Icon name="X" size={16} />
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" id="gg-add-stop" type="button" onClick={addStop}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Přidat zarážku
        </button>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "1rem" }}>
        <div id="gg-preview" style={{ height: "120px", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.08)", background: css.replace("background: ", "").replace(";", "") }} />
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="gg-css">CSS</label>
        <textarea className="textarea mono" id="gg-css" readOnly rows={2} value={css} />
        <button className="btn btn-secondary" id="gg-copy" type="button" onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
    </div>
  );
}