"use client";

// Spotřeba paliva — l/100 km ↔ mpg, živý výpočet.
// Portuje legacy-public/tools/fuel-consumption-calc.html + public/tools/assets/js/tools/fuel-consumption-calc.js.
import { useEffect, useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  segL: "l/100 km → mpg",
  segMpg: "mpg → l/100 km",
  inL: "Spotřeba (l/100 km)",
  inMpg: "Spotřeba (mpg US)",
  note: "Převod mezi l/100 km a mpg (US i UK). Výpočet běží živě v prohlížeči.",
};

const KM_PER_MILE = 1.609344;

function fmt(n: number, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 2 });
}

// Výpočet 1:1 s legacy fuel-consumption-calc.js.
function compute(mode: "l" | "mpg", locale: string) {
  const inp = document.getElementById("fc-in") as HTMLInputElement | null;
  const out = document.getElementById("fc-out");
  const outK = document.getElementById("fc-out-k");
  const out2Row = document.getElementById("fc-out2-row");
  const out2 = document.getElementById("fc-out2");
  const out2K = document.getElementById("fc-out2-k");
  if (!inp || !out || !outK || !out2Row || !out2 || !out2K) return;
  const x = inp.value === "" || inp.value == null ? null : parseFloat(inp.value);
  if (x == null || isNaN(x) || x <= 0) {
    out.textContent = "—";
    out2.textContent = "—";
    return;
  }
  if (mode === "l") {
    const mpgUs = (100 / x) * 3.785411784 / (100 / KM_PER_MILE);
    const mpgUk = (100 / x) * 4.54609 / (100 / KM_PER_MILE);
    outK.textContent = "mpg (US)";
    out.textContent = fmt(mpgUs, locale);
    out2K.textContent = "mpg (UK)";
    out2.textContent = fmt(mpgUk, locale);
    out2Row.classList.remove("hidden");
  } else {
    const l100 = (100 * 3.785411784) / (x * KM_PER_MILE);
    outK.textContent = "l/100 km";
    out.textContent = fmt(l100, locale);
    out2Row.classList.add("hidden");
  }
}

export default function FuelConsumptionCalc({ locale }: ToolComponentProps) {
  const [mode, setMode] = useState<"l" | "mpg">("l");
  const [inLabel, setInLabel] = useState(S.inL);
  const [inValue, setInValue] = useState("7.5");

  // výchozí výsledek pro režim l, x=7.5
  const initial = useMemo(() => {
    const x = 7.5;
    const mpgUs = (100 / x) * 3.785411784 / (100 / KM_PER_MILE);
    const mpgUk = (100 / x) * 4.54609 / (100 / KM_PER_MILE);
    return { outK: "mpg (US)", out: fmt(mpgUs, locale), out2K: "mpg (UK)", out2: fmt(mpgUk, locale), show2: true };
  }, [locale]);

  // přepočet při změně režimu (DOM zápis — bez setState v effect těle)
  useEffect(() => {
    compute(mode, locale);
  }, [mode, locale]);

  const switchMode = (m: "l" | "mpg") => {
    setMode(m);
    if (m === "l") { setInLabel(S.inL); setInValue("7.5"); }
    else { setInLabel(S.inMpg); setInValue("31"); }
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="fc-mode" role="tablist" aria-label="Směr převodu spotřeby">
        <button type="button" className={mode === "l" ? "active" : ""} data-mode="l" role="tab" aria-selected={mode === "l"} onClick={() => switchMode("l")}>{S.segL}</button>
        <button type="button" className={mode === "mpg" ? "active" : ""} data-mode="mpg" role="tab" aria-selected={mode === "mpg"} onClick={() => switchMode("mpg")}>{S.segMpg}</button>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="fc-in" id="fc-in-label">{inLabel}</label>
        <input className="input" type="number" id="fc-in" min={0} step={0.1} value={inValue} inputMode="decimal" onInput={() => compute(mode, locale)} onChange={(e) => setInValue(e.target.value)} />
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k" id="fc-out-k">{initial.outK}</span><span className="v accent" id="fc-out">{initial.out}</span></div>
        <div className={`kv${initial.show2 ? "" : " hidden"}`} id="fc-out2-row"><span className="k" id="fc-out2-k">{initial.out2K}</span><span className="v" id="fc-out2">{initial.out2}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}