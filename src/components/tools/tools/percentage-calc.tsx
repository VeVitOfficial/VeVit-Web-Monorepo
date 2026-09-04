"use client";

// Kalkulačka procent — živý výpočet v prohlížeči.
// Portuje legacy-public/tools/percentage-calc.html + public/tools/assets/js/tools/percentage-calc.js.
import { useEffect, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  segOf: "Kolik je X % z Y",
  segPct: "X je kolik % z Y",
  segDelta: "Zvýšení / snížení",
  result: "Výsledek",
  detail: "Rozdíl",
  note: "Výpočet běží živě v prohlížeči při psaní.",
};

type Mode = "of" | "pct" | "delta";

function num(id: string): number | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || el.value == null || el.value === "") return null;
  const n = parseFloat(el.value);
  return isNaN(n) ? null : n;
}

// fmt 1:1 s legacy percentage-calc.js.
function fmt(n: number, locale: string): string {
  if (n == null || isNaN(n)) return "—";
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  const s = abs >= 1000 || (abs > 0 && abs < 0.01) ? n.toPrecision(6) : (Math.round(n * 100000) / 100000).toString();
  return parseFloat(s).toLocaleString(locale, { maximumFractionDigits: 6 });
}

// Výpočet 1:1 s legacy percentage-calc.js.
function compute(mode: Mode, locale: string) {
  const result = document.getElementById("pc-result");
  const detailRow = document.getElementById("pc-detail-row");
  const detailK = document.getElementById("pc-detail-k");
  const detailV = document.getElementById("pc-detail-v");
  if (!result || !detailRow || !detailK || !detailV) return;
  detailRow.classList.add("hidden");
  if (mode === "of") {
    const a = num("pc-of-a"), b = num("pc-of-b");
    if (a == null || b == null) { result.textContent = "—"; return; }
    result.textContent = fmt((a / 100) * b, locale);
  } else if (mode === "pct") {
    const pa = num("pc-pct-a"), pb = num("pc-pct-b");
    if (pa == null || pb == null || pb === 0) { result.textContent = "—"; return; }
    result.textContent = fmt((pa / pb) * 100, locale) + " %";
  } else {
    const f = num("pc-dl-from"), t = num("pc-dl-to");
    if (f == null || t == null) { result.textContent = "—"; return; }
    if (f === 0) { result.textContent = "—"; return; }
    const pct = ((t - f) / f) * 100;
    result.textContent = (pct >= 0 ? "+" : "") + fmt(pct, locale) + " %";
    detailK.textContent = S.detail;
    detailV.textContent = (t - f >= 0 ? "+" : "") + fmt(t - f, locale);
    detailRow.classList.remove("hidden");
  }
}

export default function PercentageCalc({ locale }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>("of");
  const [initial] = useState<string>("—");

  // přepočet při změně režimu (DOM zápis, bez setState v effect těle)
  useEffect(() => {
    compute(mode, locale);
  }, [mode, locale]);

  const switchMode = (m: Mode) => setMode(m);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="pc-mode" role="tablist" aria-label="Režim výpočtu procent">
        <button type="button" className={mode === "of" ? "active" : ""} data-mode="of" role="tab" aria-selected={mode === "of"} onClick={() => switchMode("of")}>{S.segOf}</button>
        <button type="button" className={mode === "pct" ? "active" : ""} data-mode="pct" role="tab" aria-selected={mode === "pct"} onClick={() => switchMode("pct")}>{S.segPct}</button>
        <button type="button" className={mode === "delta" ? "active" : ""} data-mode="delta" role="tab" aria-selected={mode === "delta"} onClick={() => switchMode("delta")}>{S.segDelta}</button>
      </div>

      <div className="stack-sm" id="pc-inputs">
        <div className={`pc-group${mode === "of" ? "" : " hidden"}`} data-for="of">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem 0.75rem", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "0.875rem" }}>Kolik je</span>
            <input className="input" type="number" id="pc-of-a" style={{ width: "7rem" }} inputMode="decimal" placeholder="25" onInput={() => compute(mode, locale)} />
            <span className="muted" style={{ fontSize: "0.875rem" }}>% z</span>
            <input className="input" type="number" id="pc-of-b" style={{ width: "9rem" }} inputMode="decimal" placeholder="200" onInput={() => compute(mode, locale)} />
            <span className="muted" style={{ fontSize: "0.875rem" }}>?</span>
          </div>
        </div>
        <div className={`pc-group${mode === "pct" ? "" : " hidden"}`} data-for="pct">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem 0.75rem", alignItems: "center" }}>
            <input className="input" type="number" id="pc-pct-a" style={{ width: "7rem" }} inputMode="decimal" placeholder="50" onInput={() => compute(mode, locale)} />
            <span className="muted" style={{ fontSize: "0.875rem" }}>je kolik % z</span>
            <input className="input" type="number" id="pc-pct-b" style={{ width: "9rem" }} inputMode="decimal" placeholder="200" onInput={() => compute(mode, locale)} />
            <span className="muted" style={{ fontSize: "0.875rem" }}>?</span>
          </div>
        </div>
        <div className={`pc-group${mode === "delta" ? "" : " hidden"}`} data-for="delta">
          <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem 0.75rem", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "0.875rem" }}>Z</span>
            <input className="input" type="number" id="pc-dl-from" style={{ width: "7rem" }} inputMode="decimal" placeholder="100" onInput={() => compute(mode, locale)} />
            <span className="muted" style={{ fontSize: "0.875rem" }}>na</span>
            <input className="input" type="number" id="pc-dl-to" style={{ width: "7rem" }} inputMode="decimal" placeholder="125" onInput={() => compute(mode, locale)} />
          </div>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.result}</span><span className="v accent" id="pc-result">{initial}</span></div>
        <div className="kv hidden" id="pc-detail-row"><span className="k" id="pc-detail-k">{S.detail}</span><span className="v" id="pc-detail-v">—</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}