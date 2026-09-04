"use client";

// BMR a kalorie — Mifflin-St Jeor, živý výpočet v prohlížeči.
// Portuje legacy-public/tools/bmr-calc.html + public/tools/assets/js/tools/bmr-calc.js.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  sex: "Pohlaví",
  male: "Muž",
  female: "Žena",
  age: "Věk (roky)",
  height: "Výška (cm)",
  weight: "Váha (kg)",
  act: "Aktivita",
  bmr: "BMR (klidový metabolismus)",
  tdee: "Denní spotřeba (TDEE)",
  note: "Vzorec Mifflin-St Jeor. Orientační odhad — skutečná spotřeba se liší podle tělesné konstituce. Výpočet běží živě v prohlížeči.",
};

const ACTS = [
  ["1.2", "Převážně sedavý"],
  ["1.375", "Lehká aktivita (1–3×/týden)"],
  ["1.55", "Střední aktivita (3–5×/týden)"],
  ["1.725", "Těžká aktivita (6–7×/týden)"],
  ["1.9", "Velmi těžká aktivita (fyzická práce)"],
];

function kc(n: number, locale: string) {
  return Math.round(n).toLocaleString(locale) + " kcal";
}

// Živý přepočet — čte DOM inputy, zapisuje výsledky do textContent (věrně legacy).
function liveCompute(locale: string) {
  const num = (id: string): number | null => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el || el.value === "" || el.value == null) return null;
    const n = parseFloat(el.value);
    return isNaN(n) ? null : n;
  };
  const bmrEl = document.getElementById("bmr-bmr");
  const tdeeEl = document.getElementById("bmr-tdee");
  const sexEl = document.getElementById("bmr-sex") as HTMLSelectElement | null;
  const actEl = document.getElementById("bmr-act") as HTMLSelectElement | null;
  if (!bmrEl || !tdeeEl) return;
  const age = num("bmr-age");
  const h = num("bmr-height");
  const w = num("bmr-weight");
  const act = actEl ? parseFloat(actEl.value) || 1.2 : 1.2;
  if (age == null || h == null || w == null || age <= 0 || h <= 0 || w <= 0) {
    bmrEl.textContent = "—";
    tdeeEl.textContent = "—";
    return;
  }
  const sex = sexEl ? sexEl.value : "m";
  let bmr = 10 * w + 6.25 * h - 5 * age + (sex === "f" ? -161 : 5);
  if (bmr < 0) bmr = 0;
  bmrEl.textContent = kc(bmr, locale);
  tdeeEl.textContent = kc(bmr * act, locale);
}

export default function BmrCalc({ locale }: ToolComponentProps) {
  // výchozí hodnoty odpovídají legacy HTML (sex=m, age=30, height=175, weight=70, act=1.375)
  const initial = useMemo(() => {
    const w = 70, h = 175, age = 30, act = 1.375;
    let bmr = 10 * w + 6.25 * h - 5 * age + 5;
    if (bmr < 0) bmr = 0;
    return { bmr: kc(bmr, locale), tdee: kc(bmr * act, locale) };
  }, [locale]);

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmr-sex">{S.sex}</label>
          <select className="select" id="bmr-sex" defaultValue="m" onChange={() => liveCompute(locale)}>
            <option value="m">{S.male}</option>
            <option value="f">{S.female}</option>
          </select>
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmr-age">{S.age}</label>
          <input className="input" type="number" id="bmr-age" min={1} max={120} step={1} defaultValue={30} inputMode="numeric" onInput={() => liveCompute(locale)} />
        </div>
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmr-height">{S.height}</label>
          <input className="input" type="number" id="bmr-height" min={80} max={250} step={0.5} defaultValue={175} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="bmr-weight">{S.weight}</label>
          <input className="input" type="number" id="bmr-weight" min={20} max={400} step={0.1} defaultValue={70} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="bmr-act">{S.act}</label>
        <select className="select" id="bmr-act" defaultValue="1.375" onChange={() => liveCompute(locale)}>
          {ACTS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.bmr}</span><span className="v" id="bmr-bmr">{initial.bmr}</span></div>
        <div className="kv"><span className="k">{S.tdee}</span><span className="v accent" id="bmr-tdee">{initial.tdee}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}