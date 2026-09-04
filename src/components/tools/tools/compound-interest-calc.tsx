"use client";

// Složené úročení — živý výpočet v prohlížeči.
// Portuje legacy-public/tools/compound-interest-calc.html + public/tools/assets/js/tools/compound-interest-calc.js.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  principal: "Počáteční vklad (Kč)",
  pmt: "Měsíční vklad (Kč)",
  rate: "Úroková sazba p.a. (%)",
  years: "Doba (roky)",
  freq: "Frekvence kapitalizace",
  invested: "Celkem vloženo",
  gain: "Zisk",
  total: "Hodnota nakonec",
  note: "Modelový výpočet složeného úročení (nezohledňuje daň z úroků ani inflaci). Výpočet běží živě v prohlížeči.",
};

const FREQS = [["1", "Ročně"], ["2", "Půletálně"], ["4", "Čtvrtletně"], ["12", "Měsíčně"]] as const;

function kc(n: number, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 0 }) + " Kč";
}

// Výpočet 1:1 s legacy compound-interest-calc.js.
function compute(P: number, PMT: number, r: number, yrs: number | null, n: number, locale: string) {
  if (yrs == null || yrs <= 0) return { invested: "—", gain: "—", total: "—" };
  const periods = n * yrs;
  const i = r / n;
  const FVp = i === 0 ? P : P * Math.pow(1 + i, periods);
  const FVann = i === 0 ? PMT * periods : PMT * ((Math.pow(1 + i, periods) - 1) / i);
  const total = FVp + FVann;
  const invested = P + PMT * periods;
  return { invested: kc(invested, locale), gain: kc(total - invested, locale), total: kc(total, locale) };
}

function liveCompute(locale: string) {
  const num = (id: string): number | null => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el || el.value === "" || el.value == null) return null;
    const n = parseFloat(el.value);
    return isNaN(n) ? null : n;
  };
  const freqEl = document.getElementById("ci-freq") as HTMLSelectElement | null;
  const invEl = document.getElementById("ci-invested");
  const gainEl = document.getElementById("ci-gain");
  const totEl = document.getElementById("ci-total");
  if (!invEl || !gainEl || !totEl) return;
  const P = num("ci-principal") || 0;
  const PMT = num("ci-pmt") || 0;
  const r = (num("ci-rate") || 0) / 100;
  const yrs = num("ci-years");
  const n = freqEl ? parseInt(freqEl.value, 10) || 1 : 1;
  const r2 = compute(P, PMT, r, yrs, n, locale);
  invEl.textContent = r2.invested;
  gainEl.textContent = r2.gain;
  totEl.textContent = r2.total;
}

export default function CompoundInterestCalc({ locale }: ToolComponentProps) {
  // výchozí hodnoty z legacy HTML: P=10000, PMT=1000, rate=6, years=10, freq=12
  const initial = useMemo(() => compute(10000, 1000, 6 / 100, 10, 12, locale), [locale]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ci-principal">{S.principal}</label>
          <input className="input" type="number" id="ci-principal" min={0} step={100} defaultValue={10000} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ci-pmt">{S.pmt}</label>
          <input className="input" type="number" id="ci-pmt" min={0} step={100} defaultValue={1000} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ci-rate">{S.rate}</label>
          <input className="input" type="number" id="ci-rate" min={0} step={0.01} defaultValue={6} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ci-years">{S.years}</label>
          <input className="input" type="number" id="ci-years" min={1} max={80} step={1} defaultValue={10} inputMode="numeric" onInput={() => liveCompute(locale)} />
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ci-freq">{S.freq}</label>
        <select className="select" id="ci-freq" defaultValue="12" onChange={() => liveCompute(locale)}>
          {FREQS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.invested}</span><span className="v" id="ci-invested">{initial.invested}</span></div>
        <div className="kv"><span className="k">{S.gain}</span><span className="v accent" id="ci-gain">{initial.gain}</span></div>
        <div className="kv"><span className="k">{S.total}</span><span className="v" id="ci-total">{initial.total}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}