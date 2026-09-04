"use client";

// Průměr známek — vážený, dynamické řádky, živý výpočet.
// Portuje legacy-public/tools/grade-average-calc.html + public/tools/assets/js/tools/grade-average-calc.js.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon } from "@/components/tools/tool-runtime";

const S = {
  add: "Přidat známku",
  avg: "Vážený průměr",
  count: "Počet známek",
  grade: "Známka",
  weight: "Váha",
  remove: "Odebrat známku",
  note: "Známky 1 (nejlepší) až 5. Váhu použij pro předměty s jinou hodinovou dotací. Výpočet běží živě v prohlížeči.",
};

interface Row {
  id: number;
  grade: number;
  weight: number;
}

let seq = 0;

export default function GradeAverageCalc({ locale }: ToolComponentProps) {
  // výchozí 3 řádky jako v legacy (buildRow × 3)
  const [rows, setRows] = useState<Row[]>(() => [
    { id: ++seq, grade: 1, weight: 1 },
    { id: ++seq, grade: 1, weight: 1 },
    { id: ++seq, grade: 1, weight: 1 },
  ]);

  const result = useMemo(() => {
    let sum = 0, wsum = 0;
    for (const r of rows) {
      const w = isNaN(r.weight) || r.weight <= 0 ? 1 : r.weight;
      sum += r.grade * w;
      wsum += w;
    }
    const n = rows.length;
    return {
      count: String(n),
      avg: n === 0 || wsum === 0 ? "—" : (sum / wsum).toLocaleString(locale, { maximumFractionDigits: 3 }),
    };
  }, [rows, locale]);

  const addRow = () => setRows((rs) => [...rs, { id: ++seq, grade: 1, weight: 1 }]);
  const removeRow = (id: number) => setRows((rs) => rs.filter((r) => r.id !== id));
  const setField = (id: number, field: "grade" | "weight", value: number) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="stack-sm" id="ga-rows">
        {rows.map((r) => (
          <div className="row ga-row" key={r.id} style={{ gap: "0.5rem", flexWrap: "wrap", alignItems: "end" }}>
            <span className="muted" style={{ fontSize: "0.8rem" }}>{S.grade}</span>
            <select
              className="input"
              aria-label={S.grade}
              value={r.grade}
              style={{ width: "7rem" }}
              onChange={(e) => setField(r.id, "grade", parseInt(e.target.value, 10))}
            >
              {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <span className="muted" style={{ fontSize: "0.8rem" }}>{S.weight}</span>
            <input
              className="input"
              type="number"
              aria-label={S.weight}
              min={1}
              max={10}
              step={1}
              value={r.weight}
              inputMode="numeric"
              style={{ width: "6rem" }}
              onChange={(e) => setField(r.id, "weight", parseFloat(e.target.value))}
            />
            <button
              type="button"
              className="btn btn-ghost btn-icon-sm"
              aria-label={S.remove}
              onClick={() => removeRow(r.id)}
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-secondary btn-touch" id="ga-add" type="button" onClick={addRow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>{" "}{S.add}
      </button>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.avg}</span><span className="v accent" id="ga-avg">{result.avg}</span></div>
        <div className="kv"><span className="k">{S.count}</span><span className="v" id="ga-count">{result.count}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}