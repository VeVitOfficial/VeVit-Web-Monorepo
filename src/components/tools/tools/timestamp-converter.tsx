"use client";

// Konverze Unix timestamp ↔ datum — port legacy timestamp-converter.js.
// Intl DateTimeFormat pro časové zóny. Režim t2d | d2t. Čistě client-side.
import { useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess, toastError } from "@/components/tools/tool-runtime";

const TZS = ["UTC", "Europe/Prague", "Europe/London", "Europe/Berlin", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"];

function isValidUnix(s: string): boolean { return /^\d{1,10}(\.\d+)?$/.test(s.trim()); }

export default function TimestampConverter({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<"t2d" | "d2t">("t2d");
  const [tz, setTz] = useState("Europe/Prague");
  const [ts, setTs] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));

  const result = useMemo(() => {
    try {
      if (mode === "t2d") {
        const n = Number(ts);
        if (!isFinite(n) || !isValidUnix(ts)) return { ok: false, msg: "Neplatný timestamp", val: "" };
        const d = new Date(n * 1000);
        if (isNaN(d.getTime())) return { ok: false, msg: "Neplatný timestamp", val: "" };
        const fmt = new Intl.DateTimeFormat("cs-CZ", {
          timeZone: tz, dateStyle: "full", timeStyle: "long",
        });
        return { ok: true, msg: "", val: fmt.format(d) + "\nISO: " + d.toISOString() };
      }
      const d = new Date(date);
      if (isNaN(d.getTime())) return { ok: false, msg: "Neplatné datum", val: "" };
      return { ok: true, msg: "", val: "Unix: " + Math.floor(d.getTime() / 1000) + "\nUnix ms: " + d.getTime() };
    } catch (e) {
      return { ok: false, msg: (e as Error).message, val: "" };
    }
  }, [mode, ts, date, tz]);

  const onNow = () => {
    const n = Math.floor(Date.now() / 1000);
    if (mode === "t2d") {
      setTs(String(n));
    } else {
      setDate(new Date().toISOString().slice(0, 16));
    }
    toastSuccess("Nastaveno na nyní");
  };

  const onSwap = () => {
    if (mode === "t2d") {
      if (!result.ok) { toastError("Nejdřív vyplň platný timestamp"); return; }
      const d = new Date(Number(ts) * 1000);
      setDate(d.toISOString().slice(0, 16));
    } else {
      const d = new Date(date);
      if (isNaN(d.getTime())) { toastError("Nejdřív vyplň platné datum"); return; }
      setTs(String(Math.floor(d.getTime() / 1000)));
    }
    setMode(mode === "t2d" ? "d2t" : "t2d");
  };

  const onCopy = async () => { if (result.val) { const ok = await copy(result.val); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="seg" role="tablist" aria-label="Režim konverze">
        <button type="button" role="tab" aria-selected={mode === "t2d"} className={mode === "t2d" ? "active" : ""} onClick={() => setMode("t2d")}>Timestamp → Datum</button>
        <button type="button" role="tab" aria-selected={mode === "d2t"} className={mode === "d2t" ? "active" : ""} onClick={() => setMode("d2t")}>Datum → Timestamp</button>
      </div>

      <div className="row" style={{ gap: "0.75rem", alignItems: "end" }}>
        {mode === "t2d" ? (
          <div className="stack-sm" style={{ flex: "1" }}>
            <label className="field-label" htmlFor="ts-in">Unix timestamp (sekundy)</label>
            <input className="input mono" id="ts-in" value={ts} onChange={(e) => setTs(e.target.value)} inputMode="numeric" />
          </div>
        ) : (
          <div className="stack-sm" style={{ flex: "1" }}>
            <label className="field-label" htmlFor="ts-date">Datum a čas</label>
            <input className="input mono" id="ts-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}
        <div className="stack-sm">
          <label className="field-label" htmlFor="ts-tz">Časová zóna</label>
          <select className="select" id="ts-tz" value={tz} onChange={(e) => setTz(e.target.value)}>
            {TZS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div className="row" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" type="button" onClick={onNow}>Nyní</button>
        <button className="btn btn-secondary" type="button" onClick={onSwap}>Prohodit</button>
      </div>

      {result.ok ? (
        <div className="result-card">
          <pre className="mono" id="ts-out" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{result.val}</pre>
        </div>
      ) : (
        <p className="error-text" role="alert">{result.msg}</p>
      )}

      {result.ok ? (
        <button className="btn btn-secondary" id="ts-copy" type="button" onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      ) : null}
    </div>
  );
}