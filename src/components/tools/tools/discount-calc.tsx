"use client";

// Kalkulačka slev — vícenásobné slevy (postupně), živý výpočet.
// Portuje legacy-public/tools/discount-calc.html + public/tools/assets/js/tools/discount-calc.js.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  price: "Původní cena (Kč)",
  d1: "Sleva 1 (%)",
  d2: "Sleva 2 (%) — volitelné",
  final: "Cena po slevě",
  saved: "Ušetříte",
  total: "Celková sleva",
  note: "Slevy se uplatňují postupně (druhá se počítá z ceny po první). Výpočet běží živě v prohlížeči.",
};

function kc(n: number, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 2 }) + " Kč";
}

// Výpočet 1:1 s legacy discount-calc.js.
function compute(p: number | null, d1: number | null, d2: number | null, locale: string) {
  if (p == null) return { final: "—", saved: "—", total: "—" };
  const a = d1 == null ? 0 : Math.max(0, Math.min(100, d1));
  const b = d2 == null ? 0 : Math.max(0, Math.min(100, d2));
  const after1 = p * (1 - a / 100);
  const after2 = after1 * (1 - b / 100);
  const t = p > 0 ? (1 - after2 / p) * 100 : 0;
  return {
    final: kc(after2, locale),
    saved: kc(p - after2, locale),
    total: t.toLocaleString(locale, { maximumFractionDigits: 2 }) + " %",
  };
}

function num(id: string): number | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.value === "" || el.value == null) return null;
  const n = parseFloat(el.value);
  return isNaN(n) ? null : n;
}

function liveCompute(locale: string) {
  const finalEl = document.getElementById("dc-final");
  const savedEl = document.getElementById("dc-saved");
  const totalEl = document.getElementById("dc-total");
  if (!finalEl || !savedEl || !totalEl) return;
  const r = compute(num("dc-price"), num("dc-d1"), num("dc-d2"), locale);
  finalEl.textContent = r.final;
  savedEl.textContent = r.saved;
  totalEl.textContent = r.total;
}

export default function DiscountCalc({ locale }: ToolComponentProps) {
  // výchozí hodnoty z legacy HTML: price=1000, d1=20, d2=0
  const initial = useMemo(() => compute(1000, 20, 0, locale), [locale]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="dc-price">{S.price}</label>
        <input className="input" type="number" id="dc-price" min={0} step={1} defaultValue={1000} inputMode="decimal" onInput={() => liveCompute(locale)} />
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="dc-d1">{S.d1}</label>
          <input className="input" type="number" id="dc-d1" min={0} max={100} step={1} defaultValue={20} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="dc-d2">{S.d2}</label>
          <input className="input" type="number" id="dc-d2" min={0} max={100} step={1} defaultValue={0} inputMode="decimal" onInput={() => liveCompute(locale)} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.final}</span><span className="v accent" id="dc-final">{initial.final}</span></div>
        <div className="kv"><span className="k">{S.saved}</span><span className="v" id="dc-saved">{initial.saved}</span></div>
        <div className="kv"><span className="k">{S.total}</span><span className="v" id="dc-total">{initial.total}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}