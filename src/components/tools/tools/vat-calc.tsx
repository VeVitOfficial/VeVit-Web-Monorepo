"use client";

// DPH kalkulačka — přidat / odebrat DPH, živý výpočet.
// Portuje legacy-public/tools/vat-calc.html + public/tools/assets/js/tools/vat-calc.js.
import { useEffect, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  segAdd: "Přidat DPH (bez → s)",
  segRem: "Odebrat DPH (s → bez)",
  amount: "Částka (Kč)",
  rate: "Sazba DPH",
  rate21: "21 % — základní",
  rate12: "12 % — snížená",
  rate0: "0 %",
  rateCustom: "vlastní…",
  custom: "Vlastní sazba (%)",
  net: "Bez DPH",
  vat: "DPH",
  gross: "S DPH",
  note: "Orientační výpočet. Aktuální sazby DPH v ČR ověřte u svého daňového poradce. Výpočet běží živě v prohlížeči.",
};

type Mode = "add" | "rem";

const RATES = [["21", S.rate21], ["12", S.rate12], ["0", S.rate0], ["custom", S.rateCustom]] as const;

function kc(n: number, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 2 }) + " Kč";
}

function num(id: string): number | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.value === "" || el.value == null) return null;
  const n = parseFloat(el.value);
  return isNaN(n) ? null : n;
}

function rateVal(): number {
  const sel = document.getElementById("vat-rate") as HTMLSelectElement | null;
  if (sel && sel.value === "custom") {
    const c = num("vat-custom");
    return c == null ? 0 : Math.max(0, Math.min(100, c));
  }
  return sel ? parseFloat(sel.value) || 0 : 0;
}

// Výpočet 1:1 s legacy vat-calc.js.
function compute(mode: Mode, locale: string) {
  const netEl = document.getElementById("vat-net");
  const vatEl = document.getElementById("vat-vat");
  const grossEl = document.getElementById("vat-gross");
  if (!netEl || !vatEl || !grossEl) return;
  const amt = num("vat-amount");
  if (amt == null) { netEl.textContent = "—"; vatEl.textContent = "—"; grossEl.textContent = "—"; return; }
  const r = rateVal();
  let n: number, v: number, g: number;
  if (mode === "add") { n = amt; v = (amt * r) / 100; g = amt + v; }
  else { g = amt; n = amt / (1 + r / 100); v = g - n; }
  netEl.textContent = kc(n, locale);
  vatEl.textContent = kc(v, locale);
  grossEl.textContent = kc(g, locale);
}

export default function VatCalc({ locale }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>("add");
  const [rateSel, setRateSel] = useState("21");
  const [custom, setCustom] = useState("21");

  useEffect(() => {
    compute(mode, locale);
  }, [mode, locale, rateSel, custom]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="vat-mode" role="tablist" aria-label="Směr výpočtu DPH">
        <button type="button" className={mode === "add" ? "active" : ""} data-mode="add" role="tab" aria-selected={mode === "add"} onClick={() => setMode("add")}>{S.segAdd}</button>
        <button type="button" className={mode === "rem" ? "active" : ""} data-mode="rem" role="tab" aria-selected={mode === "rem"} onClick={() => setMode("rem")}>{S.segRem}</button>
      </div>

      <div className="stack-sm">
        <label className="field-label" htmlFor="vat-amount">{S.amount}</label>
        <input className="input" type="number" id="vat-amount" min={0} step={1} defaultValue={1000} inputMode="decimal" onInput={() => compute(mode, locale)} />
      </div>

      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="vat-rate">{S.rate}</label>
          <select className="select" id="vat-rate" value={rateSel} onChange={(e) => setRateSel(e.target.value)}>
            {RATES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
        <div className={`stack-sm${rateSel === "custom" ? "" : " hidden"}`} id="vat-custom-wrap">
          <label className="field-label" htmlFor="vat-custom">{S.custom}</label>
          <input className="input" type="number" id="vat-custom" min={0} max={100} step={0.1} value={custom} inputMode="decimal" onChange={(e) => setCustom(e.target.value)} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.net}</span><span className="v" id="vat-net">—</span></div>
        <div className="kv"><span className="k">{S.vat}</span><span className="v accent" id="vat-vat">—</span></div>
        <div className="kv"><span className="k">{S.gross}</span><span className="v" id="vat-gross">—</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}