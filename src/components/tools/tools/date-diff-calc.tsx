"use client";

// Rozdíl datumů — živý výpočet v prohlížeči.
// Portuje legacy-public/tools/date-diff-calc.html + public/tools/assets/js/tools/date-diff-calc.js.
import { useMemo } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const S = {
  from: "Od (datum)",
  to: "Do (datum)",
  diff: "Rozdíl",
  weeks: "V týdnech",
  months: "V měsících",
  years: "V letech",
  hours: "V hodinách",
  note: "Počítá se rozdíl kalendářních dnů. Výpočet běží živě v prohlížeči.",
};

function pad(n: number) {
  return (n < 10 ? "0" : "") + n;
}

function fmt(n: number, u: string, locale: string) {
  return n.toLocaleString(locale, { maximumFractionDigits: 2 }) + (u ? " " + u : "");
}

function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() - a.getDate()) / 32;
}

function parse(id: string): Date | null {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el || !el.value) return null;
  const d = new Date(el.value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

// Výpočet 1:1 s legacy date-diff-calc.js.
function liveCompute(locale: string) {
  const f = parse("dd-from");
  const t = parse("dd-to");
  const ids = ["dd-days", "dd-weeks", "dd-months", "dd-years", "dd-hours"];
  if (!f || !t) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "—";
    });
    return;
  }
  const ms = t.getTime() - f.getTime();
  const d = Math.abs(Math.round(ms / 86400000));
  const set = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("dd-days", fmt(d, "dní", locale));
  set("dd-weeks", fmt(d / 7, "týdnů", locale));
  set("dd-months", fmt(Math.abs(monthsBetween(f, t)), "měsíců", locale));
  set("dd-years", fmt(d / 365.25, "roků", locale));
  set("dd-hours", fmt(Math.abs(Math.round(ms / 3600000)), "hodin", locale));
}

export default function DateDiffCalc({ locale }: ToolComponentProps) {
  // výchozí: dnes a za měsíc (jako v legacy)
  const defaults = useMemo(() => {
    const now = new Date();
    const nm = new Date(now.getTime() + 30 * 86400000);
    return {
      from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      to: `${nm.getFullYear()}-${pad(nm.getMonth() + 1)}-${pad(nm.getDate())}`,
    };
  }, []);

  // počáteční výsledek pro výchozí data
  const initial = useMemo(() => {
    const f = new Date(defaults.from + "T00:00:00");
    const t = new Date(defaults.to + "T00:00:00");
    const ms = t.getTime() - f.getTime();
    const d = Math.abs(Math.round(ms / 86400000));
    return {
      days: fmt(d, "dní", locale),
      weeks: fmt(d / 7, "týdnů", locale),
      months: fmt(Math.abs(monthsBetween(f, t)), "měsíců", locale),
      years: fmt(d / 365.25, "roků", locale),
      hours: fmt(Math.abs(Math.round(ms / 3600000)), "hodin", locale),
    };
  }, [defaults, locale]);

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="dd-from">{S.from}</label>
          <input className="input" type="date" id="dd-from" defaultValue={defaults.from} onInput={() => liveCompute(locale)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="dd-to">{S.to}</label>
          <input className="input" type="date" id="dd-to" defaultValue={defaults.to} onInput={() => liveCompute(locale)} />
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }} role="status" aria-live="polite">
        <div className="kv"><span className="k">{S.diff}</span><span className="v accent" id="dd-days">{initial.days}</span></div>
        <div className="kv"><span className="k">{S.weeks}</span><span className="v" id="dd-weeks">{initial.weeks}</span></div>
        <div className="kv"><span className="k">{S.months}</span><span className="v" id="dd-months">{initial.months}</span></div>
        <div className="kv"><span className="k">{S.years}</span><span className="v" id="dd-years">{initial.years}</span></div>
        <div className="kv"><span className="k">{S.hours}</span><span className="v" id="dd-hours">{initial.hours}</span></div>
      </div>

      <p className="muted" style={{ fontSize: "0.8rem" }}>{S.note}</p>
    </div>
  );
}