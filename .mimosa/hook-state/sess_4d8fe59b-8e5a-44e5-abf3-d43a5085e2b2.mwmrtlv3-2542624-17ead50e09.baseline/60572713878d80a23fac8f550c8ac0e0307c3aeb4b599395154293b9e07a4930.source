"use client";

// Tvůrce grafů — data jako CSV ("popisek,hodnota" na řádek; 3. sloupec = 2. řada),
// sloupcový / čárový / koláčový graf na canvasu 800×500 (bílé pozadí, osy,
// mřížka, popisky hodnot, legenda s procenty u koláče). Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, useToolState } from "@/components/tools/tool-runtime";

const PALETTE = ["#10b981", "#0891c4", "#7c4ddb", "#a86a1a", "#cf4038"];
const FONT = "system-ui, sans-serif";
const CW = 800, CH = 500;

/** Interpretace CSV vstupu: 2 sloupce = 1 řada, 3 sloupce = 2 řady. */
interface ChartData { labels: string[]; series: number[][]; }

function parseCsv(text: string): ChartData {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("Zadejte alespoň jeden řádek dat ve formátu „popisek,hodnota“ (např. „Led,42“).");
  const labels: string[] = [];
  const series: number[][] = [];
  let cols = 0;
  lines.forEach((line, idx) => {
    const parts = line.split(/[,;]/).map((p) => p.trim());
    if (cols === 0) cols = parts.length;
    if (cols < 2) throw new Error(`Řádek ${idx + 1}: očekávám formát „popisek,hodnota“ (např. „Led,42“).`);
    if (parts.length !== cols) throw new Error(`Řádek ${idx + 1}: očekávám stejný počet sloupců jako v prvním řádku (${cols}).`);
    labels.push(parts[0]);
    for (let s = 0; s < cols - 1; s++) {
      if (!series[s]) series[s] = [];
      const v = Number(parts[1 + s].replace(",", "."));
      if (!Number.isFinite(v)) throw new Error(`Řádek ${idx + 1}: „${parts[1 + s]}“ není platné číslo.`);
      series[s].push(v);
    }
  });
  return { labels, series };
}

/** Zaokrouhlení nahoru na "hezké" číslo pro osu (1/2/5 × 10^n). */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const f = v / Math.pow(10, exp);
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * Math.pow(10, exp);
}

/** Číslo s českou desetinnou čárkou, bez zbytečných nul. */
function fmtNum(v: number): string {
  const s = parseFloat(v.toFixed(2)).toString();
  return s.replace(".", ",");
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export default function ChartMaker({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("ready");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [csv, setCsv] = useState("Led,12\nÚnor,19\nBřezen,7\nDuben,15\nKvěten,23");
  const [type, setType] = useState<"bar" | "line" | "pie">("bar");
  const [title, setTitle] = useState("Můj graf");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let data: ChartData;
    try {
      data = parseCsv(csv);
      setError("");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Neplatný vstup.";
      setError(m); setState("error", m); setInfo("");
      return;
    }

    // Bílé pozadí + titulek.
    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CW, CH);
    if (title.trim()) {
      ctx.fillStyle = "#111827";
      ctx.font = `bold 20px ${FONT}`;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(title.trim(), CW / 2, 34);
    }

    const n = data.labels.length;
    const seriesNames = data.series.map((_, i) => `Řada ${i + 1}`);

    if (type === "pie") {
      const vals = data.series[0];
      if (vals.some((v) => v < 0)) { const m = "Koláčový graf neumí záporné hodnoty."; setError(m); setState("error", m); return; }
      const total = vals.reduce((a, b) => a + b, 0);
      if (total <= 0) { const m = "Součet hodnot musí být větší než nula."; setError(m); setState("error", m); return; }
      setError("");
      const legendW = 230;
      const cx = 60 + (CW - 90 - legendW) / 2, cy = (60 + CH - 60) / 2 + 10;
      const r = Math.min((CH - 140) / 2, (CW - 150 - legendW) / 2, 150);
      let angle = -Math.PI / 2;
      vals.forEach((v, i) => {
        const slice = (v / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = PALETTE[i % PALETTE.length];
        ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
        ctx.stroke();
        angle += slice;
      });
      // Legenda vpravo — swatch, popisek, procenta.
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `13px ${FONT}`;
      const lx = CW - 40 - legendW;
      vals.forEach((v, i) => {
        const y = cy - ((n - 1) * 26) / 2 + i * 26;
        ctx.fillStyle = PALETTE[i % PALETTE.length];
        ctx.fillRect(lx, y - 7, 14, 14);
        ctx.fillStyle = "#374151";
        const pct = (v / total) * 100;
        ctx.fillText(`${truncate(data.labels[i], 18)} — ${fmtNum(pct)} %`, lx + 20, y);
      });
      if (data.series.length > 1) {
        ctx.fillStyle = "#6b7280"; ctx.font = `12px ${FONT}`;
        ctx.fillText("(koláč používá první řadu)", lx, cy + ((n - 1) * 26) / 2 + 28);
      }
      setInfo(`${n} hodnot · celkem ${fmtNum(total)}`);
    } else {
      setError("");
      // Rozsah osy Y (včetně záporných hodnot).
      const all = data.series.flat();
      const maxV = Math.max(0, ...all);
      const minV = Math.min(0, ...all);
      const yMax = niceCeil(maxV || 1);
      const yMin = minV < 0 ? -niceCeil(-minV) : 0;
      const L = 60, R = 30, T = 60, B = 60;
      const plotW = CW - L - R, plotH = CH - T - B;
      const yOf = (v: number) => T + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

      // Vodorovná mřížka + popisky osy Y.
      ctx.font = `12px ${FONT}`;
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const v = yMin + ((yMax - yMin) * i) / steps;
        const y = yOf(v);
        ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(CW - R, y); ctx.stroke();
        ctx.fillStyle = "#6b7280";
        ctx.fillText(fmtNum(v), L - 8, y);
      }
      // Osy.
      ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, T - 6); ctx.lineTo(L, T + plotH); ctx.lineTo(CW - R, T + plotH); ctx.stroke();
      if (yMin < 0) { // zvýrazněná nulová linka pro záporné hodnoty
        ctx.strokeStyle = "#9ca3af";
        ctx.beginPath(); ctx.moveTo(L, yOf(0)); ctx.lineTo(CW - R, yOf(0)); ctx.stroke();
      }

      const groupW = plotW / n;
      const drawXLabels = () => {
        ctx.fillStyle = "#374151";
        ctx.font = `12px ${FONT}`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        data.labels.forEach((lb, i) => ctx.fillText(truncate(lb, 12), L + groupW * (i + 0.5), T + plotH + 8));
      };

      if (type === "bar") {
        const sc = data.series.length;
        const gap = 4;
        const barW = Math.min(48, (groupW * 0.6 - gap * (sc - 1)) / sc);
        data.series.forEach((vals, s) => {
          vals.forEach((v, i) => {
            const gx = L + groupW * (i + 0.5);
            const x = gx - (barW * sc + gap * (sc - 1)) / 2 + s * (barW + gap);
            const y0 = yOf(0), y1 = yOf(v);
            const top = Math.min(y0, y1), hgt = Math.max(1, Math.abs(y0 - y1));
            ctx.fillStyle = sc === 1 ? PALETTE[i % PALETTE.length] : PALETTE[s % PALETTE.length];
            ctx.fillRect(x, top, barW, hgt);
            // Popiska hodnoty nad sloupcem (pod nulovou čarou u záporných).
            ctx.fillStyle = "#374151";
            ctx.font = `11px ${FONT}`;
            ctx.textAlign = "center"; ctx.textBaseline = v >= 0 ? "bottom" : "top";
            ctx.fillText(fmtNum(v), x + barW / 2, v >= 0 ? top - 3 : top + hgt + 3);
          });
        });
        drawXLabels();
      } else {
        data.series.forEach((vals, s) => {
          const color = data.series.length === 1 ? PALETTE[1] : PALETTE[s % PALETTE.length];
          ctx.strokeStyle = color; ctx.lineWidth = 2.5;
          ctx.beginPath();
          vals.forEach((v, i) => {
            const x = L + groupW * (i + 0.5), y = yOf(v);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.stroke();
          vals.forEach((v, i) => {
            const x = L + groupW * (i + 0.5), y = yOf(v);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color; ctx.fill();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = "#374151";
            ctx.font = `11px ${FONT}`;
            ctx.textAlign = "center"; ctx.textBaseline = "bottom";
            ctx.fillText(fmtNum(v), x, y - 7);
          });
        });
        drawXLabels();
      }

      // Legenda pro 2 řady (vpravo nahoře).
      if (data.series.length > 1) {
        ctx.font = `13px ${FONT}`;
        ctx.textAlign = "left"; ctx.textBaseline = "middle";
        const lx = CW - R - 150;
        seriesNames.forEach((nm, s) => {
          const y = T - 22 + s * 20;
          ctx.fillStyle = PALETTE[s % PALETTE.length];
          ctx.fillRect(lx, y - 6, 12, 12);
          ctx.fillStyle = "#374151";
          ctx.fillText(nm, lx + 18, y);
        });
      }
      setInfo(`${n} hodnot${data.series.length > 1 ? ` · ${data.series.length} řady` : ""}`);
    }
    setState("success");
  }, [csv, type, title, setState]);

  useEffect(() => { void Promise.resolve().then(render); }, [render]);

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.toBlob((b) => { if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "graf.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); } }, "image/png");
  };

  return (
    <div className="stack" style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <div className="two-col" style={{ gap: "1rem", alignItems: "start" }}>
        <div className="stack-sm">
          <div className="stack-sm"><label className="field-label" htmlFor="ch-csv">Data (popisek,hodnota na řádek — 3. sloupec = 2. řada)</label>
            <textarea className="input" id="ch-csv" rows={8} value={csv} style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem" }}
              onChange={(e) => setCsv(e.target.value)} spellCheck={false} /></div>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="ch-type">Typ grafu</label>
              <select className="select" id="ch-type" value={type} onChange={(e) => setType(e.target.value as "bar" | "line" | "pie")}>
                <option value="bar">Sloupcový</option>
                <option value="line">Čárový</option>
                <option value="pie">Koláčový</option>
              </select></div>
            <div className="stack-sm"><label className="field-label" htmlFor="ch-title">Titulek</label>
              <input className="input" id="ch-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          </div>
        </div>
        <div className="stack-sm">
          <span className="field-label">Náhled (800×500)</span>
          <canvas ref={canvasRef} id="ch-canvas" width={CW} height={CH} style={{ width: "100%", height: "auto", borderRadius: "0.5rem", border: "1px solid rgba(128,128,128,0.25)" }} aria-label="Náhled grafu" role="img" />
          <p className="muted" id="ch-info" style={{ fontSize: "0.8rem" }}>{info}</p>
          <button className="btn btn-primary" id="ch-dl" type="button" onClick={download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg> Stáhnout graf.png
          </button>
        </div>
      </div>

      {error ? <p className="error-text" id="ch-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Graf se kreslí na canvas přímo v prohlížeči, běží lokálně.</p>
    </div>
  );
}
