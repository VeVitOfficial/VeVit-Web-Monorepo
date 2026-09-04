"use client";

// Časová kalkulačka — trvání +/- a čas + trvání, živý výpočet.
// Portuje legacy-public/tools/time-calc.html + public/tools/assets/js/tools/time-calc.js.
import { useEffect, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  segDur: "Trvání +/−",
  segClock: "Čas + trvání",
  result: "Výsledek",
  dur1: "Trvání 1",
  dur2: "Trvání 2",
  clock: "Čas dne",
  plusDur: "+ trvání",
  note: "Formát HH:MM:SS (sekundy lze vynechat). Výpočet běží živě v prohlížeči.",
};

type Mode = "dur" | "clock";

// "HH:MM:SS" nebo "HH:MM" → sekundy. Vrací null při chybě. 1:1 s legacy.
function parseT(s: string): number | null {
  if (!s) return null;
  const parts = s.trim().split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => parseInt(p, 10));
  if (nums.some(isNaN)) return null;
  const h = nums[0], m = nums[1], sec = nums.length === 3 ? nums[2] : 0;
  if (m < 0 || m > 59 || sec < 0 || sec > 59) return null;
  return h * 3600 + m * 60 + sec;
}

function fmtT(sec: number): string {
  sec = Math.round(sec);
  const neg = sec < 0;
  sec = Math.abs(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (n: number) => (n < 10 ? "0" : "") + n;
  return (neg ? "−" : "") + p(h) + ":" + p(m) + ":" + p(s);
}

function val(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  return el ? (el as HTMLInputElement).value : "";
}

// Výpočet 1:1 s legacy time-calc.js.
function compute(mode: Mode) {
  const result = document.getElementById("tc-result");
  if (!result) return;
  if (mode === "dur") {
    const a = parseT(val("tc-a")), b = parseT(val("tc-b"));
    if (a == null || b == null) { result.textContent = "—"; return; }
    const op = val("tc-op");
    const r = op === "-" ? a - b : a + b;
    result.textContent = fmtT(r);
  } else {
    const c = parseT(val("tc-c")), d = parseT(val("tc-d"));
    if (c == null || d == null) { result.textContent = "—"; return; }
    let r = (c + d) % 86400;
    if (r < 0) r += 86400;
    result.textContent = fmtT(r);
  }
}

export default function TimeCalc({ locale }: ToolComponentProps) {
  void locale;
  const [mode, setMode] = useState<Mode>("dur");

  useEffect(() => {
    compute(mode);
  }, [mode]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" id="tc-mode" role="tablist" aria-label="Režim časové kalkulačky">
        <button type="button" className={mode === "dur" ? "active" : ""} data-mode="dur" role="tab" aria-selected={mode === "dur"} onClick={() => setMode("dur")}>{S.segDur}</button>
        <button type="button" className={mode === "clock" ? "active" : ""} data-mode="clock" role="tab" aria-selected={mode === "clock"} onClick={() => setMode("clock")}>{S.segClock}</button>
      </div>

      <div className={`stack-sm${mode === "dur" ? "" : " hidden"}`} id="tc-dur">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "end" }}>
          <span className="muted" style={{ fontSize: "0.875rem" }}>{S.dur1}</span>
          <input className="input mono" type="text" id="tc-a" style={{ width: "8rem" }} placeholder="HH:MM:SS" defaultValue="01:30:00" onInput={() => compute(mode)} />
          <select className="select" id="tc-op" style={{ width: "auto" }} defaultValue="+" onChange={() => compute(mode)}>
            <option value="+">+</option>
            <option value="-">−</option>
          </select>
          <span className="muted" style={{ fontSize: "0.875rem" }}>{S.dur2}</span>
          <input className="input mono" type="text" id="tc-b" style={{ width: "8rem" }} placeholder="HH:MM:SS" defaultValue="00:45:30" onInput={() => compute(mode)} />
        </div>
      </div>

      <div className={`stack-sm${mode === "clock" ? "" : " hidden"}`} id="tc-clock">
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "end" }}>
          <span className="muted" style={{ fontSize: "0.875rem" }}>{S.clock}</span>
          <input className="input mono" type="text" id="tc-c" style={{ width: "8rem" }} placeholder="HH:MM:SS" defaultValue="10:00:00" onInput={() => compute(mode)} />
          <span className="muted" style={{ fontSize: "0.875rem" }}>{S.plusDur}</span>
          <input className="input mono" type="text" id="tc-d" style={{ width: "8rem" }} placeholder="HH:MM:SS" defaultValue="02:15:00" onInput={() => compute(mode)} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.result}</span><span className="v accent mono" id="tc-result">—</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}