"use client";

// Kalkulačka čisté mzdy — zjednodušený odhad pro CZ 2024, živý výpočet.
// Portuje legacy-public/tools/net-salary-calc.html + public/tools/assets/js/tools/net-salary-calc.js.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  gross: "Hrubá mzda měsíčně (Kč)",
  children: "Počet dětí",
  discount: "Sleva na poplatníka",
  discYes: "Ano (2 570 Kč / měsíc)",
  discNo: "Ne",
  levy: "Odvody zaměstnance (11 %)",
  tax: "Záloha na daň",
  net: "Čistá mzda",
  eff: "Efektivní zdanění",
  note: "Orientační odhad pro rok 2024 (sazba 15 %, superhrubá = hrubá × 1,34, odvody zaměstnance 6,5 % + 4,5 %, sleva na poplatníka 2 570 Kč, daňové zvýhodnění na dítě 1 467 / 2 170 / 2 520 Kč). Nejedná se o daňové poradenství. Výpočet běží živě v prohlížeči.",
};

// Daňové zvýhodnění na dítě (měsíční), 2024.
const CHILD = [0, 1467, 2170, 2520];
function childBonus(n: number) {
  n = Math.max(0, Math.min(10, n));
  if (n <= 3) return CHILD[n];
  return CHILD[3] + (n - 3) * 2520;
}

function kc(n: number, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 0 }) + " Kč";
}

// Výpočet 1:1 s legacy net-salary-calc.js.
function compute(g: number | null, childN: number, useDiscount: boolean, locale: string) {
  if (g == null) return { levy: "—", tax: "—", net: "—", eff: "—" };
  const odvody = g * 0.11;
  const superGross = g * 1.34;
  const zaklad = superGross - odvody;
  const sleva = useDiscount ? 2570 : 0;
  const zakladPoSleve = Math.max(0, zaklad - sleva);
  let zaloha = zakladPoSleve * 0.15;
  const bonus = childBonus(childN);
  zaloha = Math.max(0, zaloha - bonus);
  const net = g - odvody - zaloha;
  return {
    levy: kc(odvody, locale),
    tax: kc(zaloha, locale),
    net: kc(net, locale),
    eff: g > 0 ? ((1 - net / g) * 100).toLocaleString(locale, { maximumFractionDigits: 1 }) + " %" : "—",
  };
}

function num(id: string): number | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.value === "" || el.value == null) return null;
  const n = parseFloat(el.value);
  return isNaN(n) ? null : n;
}

function liveCompute(locale: string) {
  const levyEl = document.getElementById("ns-levy");
  const taxEl = document.getElementById("ns-tax");
  const netEl = document.getElementById("ns-net");
  const effEl = document.getElementById("ns-eff");
  const discEl = document.getElementById("ns-discount") as HTMLSelectElement | null;
  if (!levyEl || !taxEl || !netEl || !effEl) return;
  const g = num("ns-gross");
  const childN = Math.round(num("ns-children") || 0);
  const useDiscount = discEl ? discEl.value === "1" : false;
  const r = compute(g, childN, useDiscount, locale);
  levyEl.textContent = r.levy;
  taxEl.textContent = r.tax;
  netEl.textContent = r.net;
  effEl.textContent = r.eff;
}

export default function NetSalaryCalc({ locale }: ToolComponentProps) {
  // výchozí z legacy HTML: gross=40000, children=0, discount=1
  const initial = useMemo(() => compute(40000, 0, true, locale), [locale]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ns-gross">{S.gross}</label>
          <input className="input" type="number" id="ns-gross" min={0} step={500} defaultValue={40000} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ns-children">{S.children}</label>
          <input className="input" type="number" id="ns-children" min={0} max={10} step={1} defaultValue={0} inputMode="numeric" onInput={() => liveCompute(locale)} />
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ns-discount">{S.discount}</label>
        <select className="select" id="ns-discount" defaultValue="1" onChange={() => liveCompute(locale)}>
          <option value="1">{S.discYes}</option>
          <option value="0">{S.discNo}</option>
        </select>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.levy}</span><span className="v" id="ns-levy">{initial.levy}</span></div>
        <div className="kv"><span className="k">{S.tax}</span><span className="v" id="ns-tax">{initial.tax}</span></div>
        <div className="kv"><span className="k">{S.net}</span><span className="v accent" id="ns-net">{initial.net}</span></div>
        <div className="kv"><span className="k">{S.eff}</span><span className="v" id="ns-eff">{initial.eff}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}