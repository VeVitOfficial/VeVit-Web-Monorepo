"use client";

// Cron výraz builder — port legacy cron-builder.js.
// Obousměrný, český popis. Čistě client-side.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

const MONTHS = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const DAYS = ["v neděli", "v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu"];
const RANGES: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
const FIELD_LABELS = ["Minuta", "Hodina", "Den v měsíci", "Měsíc", "Den v týdnu"];
const PRESETS: [string, string][] = [
  ["Každý den 0:00", "0 0 * * *"],
  ["Každou hodinu", "0 * * * *"],
  ["Každou minutu", "* * * * *"],
  ["Každý den 12:00", "0 12 * * *"],
  ["Každé pondělí 9:00", "0 9 * * 1"],
  ["1. den v měsíci 0:00", "0 0 1 * *"],
  ["Každých 15 minut", "*/15 * * * *"],
  ["Každý den v 0:30 a 12:30", "30 0,12 * * *"],
];

function validate(v: string, lo: number, hi: number): void {
  const items = v.split(",");
  for (const part of items) {
    const m = part.match(/^(\*|\d+|\*\/\d+|\d+-\d+|\d+\/\d+)$/);
    if (!m) throw new Error('Neplatná hodnota: "' + part + '".');
    if (part === "*") continue;
    if (/^\*\/\d+$/.test(part)) { const n = +part.slice(2); if (n < 1) throw new Error('Krok musí být ≥1: "' + part + '".'); continue; }
    if (/^\d+\/\d+$/.test(part)) { const a = +part.split("/")[0], st = +part.split("/")[1]; if (a < lo || a > hi || st < 1) throw new Error('Mimo rozsah: "' + part + '".'); continue; }
    if (/^\d+-\d+$/.test(part)) { const x = +part.split("-")[0], y = +part.split("-")[1]; if (x < lo || y > hi || x > y) throw new Error('Mimo rozsah: "' + part + '".'); continue; }
    const num = +part;
    if (hi === 7) { if (num !== 0 && num !== 7 && (num < 1 || num > 6)) throw new Error('Mimo rozsah: "' + part + '".'); }
    else if (num < lo || num > hi) throw new Error('Mimo rozsah: "' + part + '".');
  }
}

function nameVal(v: string, names: string[] | null, offset: number): string {
  const n = parseInt(v, 10);
  if (!isNaN(n) && names) { const idx = n - (offset || 0); if (idx >= 0 && idx < names.length) return names[idx]; }
  return v;
}

function phrase(v: string, everyWord: string, unitGen: string, names: string[] | null, offset: number): string {
  if (v === "*") return everyWord;
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^\*\/(\d+)$/))) return "každé " + m[1] + ". " + unitGen;
  if ((m = v.match(/^(\d+)-(\d+)$/))) return "od " + nameVal(m[1], names, offset) + " do " + nameVal(m[2], names, offset);
  if (v.indexOf(",") !== -1) return v.split(",").map((x) => nameVal(x.trim(), names, offset)).join(", ");
  return nameVal(v, names, offset);
}

function describe(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error("Výraz musí mít 5 polí oddělených mezerou.");
  for (let i = 0; i < 5; i++) validate(parts[i], RANGES[i][0], RANGES[i][1]);
  const minP = phrase(parts[0], "každou minutu", "minuta", null, 0);
  const hourP = phrase(parts[1], "každou hodinu", "hodina", null, 0);
  const domP = phrase(parts[2], "každý den", "den", null, 0);
  const monP = phrase(parts[3], "každý měsíc", "měsíc", MONTHS, 1);
  const dowRaw = parts[4] === "7" ? "0" : parts[4];
  const dowP = phrase(dowRaw, "každý den v týdnu", "den v týdnu", DAYS, 0);
  const bits: string[] = [];
  if (parts[0] === "*") bits.push(minP); else bits.push("v " + minP);
  if (parts[1] === "*") bits.push(hourP); else bits.push("v " + hourP);
  if (parts[4] !== "*" && parts[4] !== "7") bits.push(dowP);
  else if (parts[4] === "7") bits.push("v neděli");
  if (parts[2] !== "*") bits.push(domP + " v měsíci");
  if (parts[3] !== "*") bits.push("v " + monP);
  if (parts[2] === "*") bits.push(domP);
  if (parts[3] === "*") bits.push(monP);
  return "Spouští se " + bits.join(", ") + ".";
}

export default function CronBuilder({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [fields, setFields] = useState(["*", "*", "*", "*", "*"]);
  const [expr, setExpr] = useState("* * * * *");
  const [err, setErr] = useState<string | null>(null);

  const { desc, errVal } = useMemo(() => {
    try {
      return { desc: describe(expr), errVal: null as string | null };
    } catch (e) {
      return { desc: "—", errVal: (e as Error).message };
    }
  }, [expr]);

  useEffect(() => { Promise.resolve().then(() => setErr(errVal)); }, [errVal]);

  const refreshFromFields = useCallback(() => {
    setErr(null);
    const e = fields.map((f) => f.trim() || "*").join(" ");
    setExpr(e);
  }, [fields]);

  const refreshFromExpr = useCallback(() => {
    setErr(null);
    const parts = expr.trim().split(/\s+/);
    if (parts.length === 5) setFields((prev) => parts.map((p, i) => p !== prev[i] ? p : prev[i]));
  }, [expr]);

  const onPreset = (cron: string) => { setExpr(cron); refreshFromExpr(); };
  const onCopy = async () => { if (expr) { const ok = await copy(expr); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="cb-expr">Cron výraz</label>
        <input className="input mono" id="cb-expr" value={expr} onChange={(e) => { setExpr(e.target.value); Promise.resolve().then(refreshFromExpr); }} />
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
        <div className="kv"><span className="k">Popis</span><span className="v" id="cb-desc">{desc}</span></div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}

      <div className="stack-sm">
        <span className="field-label">Jednotlivá pole</span>
        {FIELD_LABELS.map((label, i) => (
          <div key={i} className="row" style={{ gap: "0.75rem", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "0.875rem", width: "9rem" }}>{label}</span>
            <input className="input mono" id={`cb-${["min", "hour", "dom", "mon", "dow"][i]}`}
              value={fields[i]} onChange={(e) => {
                const next = [...fields]; next[i] = e.target.value; setFields(next);
                Promise.resolve().then(refreshFromFields);
              }} />
          </div>
        ))}
      </div>

      <div className="stack-sm">
        <span className="field-label">Presety</span>
        <div id="cb-presets" className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          {PRESETS.map(([label, cron]) => (
            <button key={cron} className="btn btn-ghost btn-sm" data-cron={cron} onClick={() => onPreset(cron)}>{label}</button>
          ))}
        </div>
      </div>

      <button className="btn btn-secondary" id="cb-copy" type="button" onClick={onCopy}>
        {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat výraz
      </button>
    </div>
  );
}