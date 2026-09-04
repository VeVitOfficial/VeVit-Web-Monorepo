"use client";

// Převodník jednotek — délka, hmotnost, teplota, objem, rychlost. Client-side.
// Portuje legacy-public/tools/unit-converter.html + public/tools/assets/js/tools/unit-converter.js.
import { useEffect, useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon } from "@/components/tools/tool-runtime";

const S = {
  cats: { length: "Délka", mass: "Hmotnost", temp: "Teplota", volume: "Objem", speed: "Rychlost" } as Record<string, string>,
  value: "Hodnota",
  from: "Z",
  to: "Do",
  swap: "Prohodit",
  result: "Výsledek",
};

type Unit = [string, string, number];
type CatKey = "length" | "mass" | "temp" | "volume" | "speed";

const UNITS: Record<Exclude<CatKey, "temp">, Unit[]> = {
  length: [
    ["mm", "Milimetr", 0.001], ["cm", "Centimetr", 0.01], ["m", "Metr", 1],
    ["km", "Kilometr", 1000], ["in", "Palec", 0.0254], ["ft", "Stopa", 0.3048],
    ["yd", "Yard", 0.9144], ["mi", "Míle", 1609.344], ["nmi", "Námořní míle", 1852],
  ],
  mass: [
    ["mg", "Miligram", 0.000001], ["g", "Gram", 0.001], ["kg", "Kilogram", 1],
    ["t", "Tuna", 1000], ["lb", "Libra", 0.45359237], ["oz", "Unce", 0.028349523], ["ct", "Karat", 0.0002],
  ],
  volume: [
    ["ml", "Mililitr", 0.001], ["l", "Litr", 1], ["m3", "Metr krychlový", 1000],
    ["gal", "Galon (US)", 3.785411784], ["pt", "Pinta (US)", 0.473176473], ["cup", "Hránek (US)", 0.236588236],
    ["tbsp", "Lžíce", 0.0147867648], ["tsp", "Lžička", 0.00492892159],
  ],
  speed: [
    ["m/s", "Metr za sekundu", 1], ["km/h", "Kilometr za hodinu", 0.277777778],
    ["mph", "Míle za hodinu", 0.44704], ["knot", "Uzel", 0.514444444], ["ft/s", "Stopa za sekundu", 0.3048],
  ],
};

const TEMP: [string, string][] = [["C", "Celsius"], ["F", "Fahrenheit"], ["K", "Kelvin"]];

function toC(v: number, u: string) { return u === "C" ? v : u === "F" ? (v - 32) * 5 / 9 : v - 273.15; }
function fromC(c: number, u: string) { return u === "C" ? c : u === "F" ? c * 9 / 5 + 32 : c + 273.15; }

// fmt 1:1 s legacy unit-converter.js.
function fmt(n: number, locale: string): string {
  if (n == null || isNaN(n) || !isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  const s = abs >= 1e6 || abs < 1e-4 ? n.toExponential(4) : (Math.round(n * 1e6) / 1e6).toString();
  return parseFloat(s).toLocaleString(locale, { maximumFractionDigits: 6 });
}

function listFor(cat: CatKey): [string, string][] {
  if (cat === "temp") return TEMP;
  return UNITS[cat].map((u) => [u[0], u[1]]);
}

export default function UnitConverter({ locale }: ToolComponentProps) {
  const [cat, setCat] = useState<CatKey>("length");
  const [fromU, setFromU] = useState("m");
  const [toU, setToU] = useState("cm");
  const [value, setValue] = useState("1");

  const list = useMemo(() => listFor(cat), [cat]);

  // při změně kategorie resetuj výběry na první dvě jednotky (jako legacy fillUnits).
  // setState v effect těle přes microtask (react-hooks v6 — žádný synchronní setState).
  useEffect(() => {
    Promise.resolve().then(() => {
      setFromU(list[0][0]);
      setToU(list[Math.min(1, list.length - 1)][0]);
    });
  }, [list]);

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return { text: "—", k: S.result };
    let out: number;
    if (cat === "temp") out = fromC(toC(v, fromU), toU);
    else {
      const items = UNITS[cat];
      const fc = items.find((u) => u[0] === fromU)![2];
      const tc = items.find((u) => u[0] === toU)![2];
      out = (v * fc) / tc;
    }
    return { text: fmt(out, locale) + " " + toU, k: v + " " + fromU + " =" };
  }, [value, fromU, toU, cat, locale]);

  const switchCat = (c: CatKey) => setCat(c);
  const swap = () => { setFromU(toU); setToU(fromU); };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="uc-cat" role="tablist" aria-label="Kategorie převodu">
        {(Object.keys(S.cats) as CatKey[]).map((c) => (
          <button
            key={c}
            type="button"
            className={cat === c ? "active" : ""}
            data-cat={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => switchCat(c)}
          >{S.cats[c]}</button>
        ))}
      </div>

      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="uc-value">{S.value}</label>
          <input className="input" type="number" id="uc-value" value={value} inputMode="decimal" onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="uc-from">{S.from}</label>
          <select className="select" id="uc-from" value={fromU} onChange={(e) => setFromU(e.target.value)}>
            {list.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="uc-to">{S.to}</label>
          <select className="select" id="uc-to" value={toU} onChange={(e) => setToU(e.target.value)}>
            {list.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
        </div>
        <div className="stack-sm" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" id="uc-swap" type="button" onClick={swap}>
            <Icon name="Upload" size={16} /> {S.swap}
          </button>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k" id="uc-result-k">{result.k}</span><span className="v accent" id="uc-result">{result.text}</span></div>
      </div>
    </div>
  );
}