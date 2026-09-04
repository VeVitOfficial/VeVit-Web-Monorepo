"use client";

// Kalkulačka půjčky — anuitní splátka + amortizační tabulka. Čistě client-side.
// Portuje legacy-public/tools/loan-calc.html + public/tools/assets/js/tools/loan-calc.js.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  amount: "Částka (Kč)",
  rate: "Úroková sazba p.a. (%)",
  years: "Doba (roky)",
  freq: "Frekvence splácení",
  extra: "Mimořádná splátka za období (Kč)",
  payment: "Pravidelná splátka",
  total: "Celkem zaplaceno",
  interest: "Z toho úroky",
  count: "Počet splátek",
  principal: "Jistina",
  interestLbl: "Úrok",
  amort: "Amortizační tabulka",
  thNum: "#",
  thPay: "Splátka",
  thInt: "Úrok",
  thPrin: "Jistina",
  thBal: "Zůstatek",
  print: "Vytisknout výsledek",
  note: "Modelový výpočet anuitní splátky. Slouží pro orientaci, ne jako nabídka úvěru.",
};

const FREQS = [["12", "Měsíčně"], ["4", "Čtvrtletně"], ["2", "Půletálně"], ["1", "Ročně"]] as const;

interface RowData { cells: (number | string)[] }

function num(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function kc(n: number | null, locale: string): string {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(n);
}

// Výpočet 1:1 s legacy loan-calc.js. Vrací stav pro React + nastavuje data-tool-state.
function compute(locale: string) {
  const amountEl = document.getElementById("ln-amount") as HTMLInputElement | null;
  const rateEl = document.getElementById("ln-rate") as HTMLInputElement | null;
  const yearsEl = document.getElementById("ln-years") as HTMLInputElement | null;
  const freqSel = document.getElementById("ln-freq") as HTMLSelectElement | null;
  const extraEl = document.getElementById("ln-extra") as HTMLInputElement | null;
  const root = document.getElementById("tool-root");
  if (!amountEl || !rateEl || !yearsEl || !freqSel || !extraEl) return null;

  const P = num(amountEl.value);
  const r = num(rateEl.value);
  const y = num(yearsEl.value);
  const f = parseInt(freqSel.value, 10) || 12;
  const extra = Math.max(0, num(extraEl.value) || 0);

  if (P == null || P <= 0 || y == null || y <= 0 || r == null || r < 0) {
    if (root) root.setAttribute("data-tool-state", "error");
    return { payment: "—", total: "—", interest: "—", count: "—", rows: [] as RowData[], principalPct: "—", interestPct: "—" };
  }

  const n = Math.round(y * f);
  const i = r / 100 / f;
  const payment = i === 0 ? P / n : (P * i) / (1 - Math.pow(1 + i, -n));

  let balance = P, totalInterest = 0, actualTotal = 0;
  const rows: RowData[] = [];
  const cap = 600;
  for (let k = 1; balance > 0.005 && k <= n && k <= cap; k++) {
    const interest = balance * i;
    const actualPayment = Math.min(payment + extra, balance + interest);
    const principal = actualPayment - interest;
    balance -= principal;
    if (balance < 0.005) balance = 0;
    totalInterest += interest;
    actualTotal += actualPayment;
    rows.push({ cells: [k, actualPayment, interest, principal, balance] });
  }
  if (n > cap) rows.push({ cells: ["…", "—", "—", "—", "—"] });

  const principalShare = actualTotal ? (P / actualTotal) * 100 : 100;
  const interestShare = 100 - principalShare;
  if (root) root.setAttribute("data-tool-state", "success");

  return {
    payment: kc(payment + extra, locale),
    total: kc(actualTotal, locale),
    interest: kc(totalInterest, locale),
    count: String(rows.length),
    rows,
    principalPct: Math.round(principalShare) + " %",
    interestPct: Math.round(interestShare) + " %",
    principalWidth: principalShare + "%",
    interestWidth: interestShare + "%",
  };
}

type Computed = NonNullable<ReturnType<typeof compute>>;

export default function LoanCalc({ locale }: ToolComponentProps) {
  const [state, setState] = useState<Computed | null>(null);

  // výchozí hodnoty z legacy HTML: amount=500000, rate=6.5, years=20, freq=12, extra=0
  const initial = useMemo<Computed>(() => {
    const P = 500000, r = 6.5, y = 20, f = 12, extra = 0;
    const n = Math.round(y * f);
    const i = r / 100 / f;
    const payment = (P * i) / (1 - Math.pow(1 + i, -n));
    let balance = P, totalInterest = 0, actualTotal = 0;
    const rows: RowData[] = [];
    const cap = 600;
    for (let k = 1; balance > 0.005 && k <= n && k <= cap; k++) {
      const interest = balance * i;
      const actualPayment = Math.min(payment + extra, balance + interest);
      const principal = actualPayment - interest;
      balance -= principal;
      if (balance < 0.005) balance = 0;
      totalInterest += interest;
      actualTotal += actualPayment;
      rows.push({ cells: [k, actualPayment, interest, principal, balance] });
    }
    if (n > cap) rows.push({ cells: ["…", "—", "—", "—", "—"] });
    const principalShare = actualTotal ? (P / actualTotal) * 100 : 100;
    const interestShare = 100 - principalShare;
    return {
      payment: kc(payment + extra, locale),
      total: kc(actualTotal, locale),
      interest: kc(totalInterest, locale),
      count: String(rows.length),
      rows,
      principalPct: Math.round(principalShare) + " %",
      interestPct: Math.round(interestShare) + " %",
      principalWidth: principalShare + "%",
      interestWidth: interestShare + "%",
    };
  }, [locale]);

  const recalc = () => {
    const next = compute(locale);
    if (next) setState(next);
  };

  const cur = state ?? initial;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ln-amount">{S.amount}</label>
          <input className="input" type="number" id="ln-amount" min={0} step={1000} defaultValue={500000} inputMode="decimal" onInput={recalc} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ln-rate">{S.rate}</label>
          <input className="input" type="number" id="ln-rate" min={0} step={0.01} defaultValue={6.5} inputMode="decimal" onInput={recalc} />
        </div>
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="ln-years">{S.years}</label>
          <input className="input" type="number" id="ln-years" min={1} max={40} step={1} defaultValue={20} inputMode="numeric" onInput={recalc} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ln-freq">{S.freq}</label>
          <select className="select" id="ln-freq" defaultValue="12" onChange={recalc}>
            {FREQS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ln-extra">{S.extra}</label>
        <input className="input" type="number" id="ln-extra" min={0} step={100} defaultValue={0} inputMode="decimal" onInput={recalc} />
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.25rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.payment}</span><span className="v accent" id="ln-payment">{cur.payment}</span></div>
        <div className="kv"><span className="k">{S.total}</span><span className="v" id="ln-total">{cur.total}</span></div>
        <div className="kv"><span className="k">{S.interest}</span><span className="v" id="ln-interest">{cur.interest}</span></div>
        <div className="kv"><span className="k">{S.count}</span><span className="v" id="ln-count">{cur.count}</span></div>
      </div>

      <div className="loan-chart" role="img" aria-labelledby="ln-chart-label">
        <div className="loan-chart-bar">
          <span id="ln-principal-bar" style={{ width: cur.principalWidth }} />
          <span id="ln-interest-bar" style={{ width: cur.interestWidth }} />
        </div>
        <p id="ln-chart-label">
          <span>{S.principal} <strong id="ln-principal-pct">{cur.principalPct}</strong></span>
          <span>{S.interestLbl} <strong id="ln-interest-pct">{cur.interestPct}</strong></span>
        </p>
      </div>

      <details className="accordion">
        <summary>{S.amort} <span className="acc-chev">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span></summary>
        <div className="acc-body">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{S.thNum}</th><th>{S.thPay}</th><th>{S.thInt}</th><th>{S.thPrin}</th><th>{S.thBal}</th></tr></thead>
              <tbody id="ln-table">
                {cur.rows.map((row, idx) => (
                  <tr key={idx}>
                    {row.cells.map((val, ci) => (
                      <td key={ci}>{ci === 0 ? val : val === "—" ? "—" : kc(val as number, locale)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <button className="btn btn-outline" id="ln-print" type="button" onClick={() => window.print()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
        </svg>{" "}{S.print}
      </button>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}