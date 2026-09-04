"use client";

// Konverze číselných soustav — bin/oct/dec/hex.
// Portuje legacy-public/tools/number-base-converter.html + public/tools/assets/js/tools/number-base-converter.js.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon, copyText } from "@/components/tools/tool-runtime";

const S = {
  local: "Lokální",
  placeholder: "Zadejte číslo...",
  labels: { 2: "Binární", 8: "Oktálová", 10: "Decimální", 16: "Hexadecimální" } as Record<number, string>,
};

const RADIXES = [2, 8, 10, 16];

interface OutState { value: string; ok: boolean }

export default function NumberBaseConverter({ locale }: ToolComponentProps) {
  const [value, setValue] = useState("255");
  const [from, setFrom] = useState(10);
  const [outs, setOuts] = useState<Record<number, OutState>>(() => convertAll("255", 10));
  const [copiedR, setCopiedR] = useState<number | null>(null);

  function convertAll(val: string, fromR: number): Record<number, OutState> {
    const clean = val.replace(/\s/g, "");
    if (!clean) {
      const empty: Record<number, OutState> = {};
      for (const r of RADIXES) empty[r] = { value: "", ok: false };
      return empty;
    }
    const n = parseInt(clean, fromR);
    if (isNaN(n) || n < 0) {
      const empty: Record<number, OutState> = {};
      for (const r of RADIXES) empty[r] = { value: "", ok: false };
      return empty;
    }
    const res: Record<number, OutState> = {};
    for (const r of RADIXES) res[r] = { value: n.toString(r).toUpperCase(), ok: true };
    return res;
  }

  const onValue = (val: string) => {
    setValue(val);
    setOuts(convertAll(val, from));
  };
  const onFrom = (f: number) => {
    setFrom(f);
    setOuts(convertAll(value, f));
  };

  const doCopy = (r: number, v: string) => {
    if (!v) return;
    copyText(v, locale).then((ok) => {
      if (ok) { setCopiedR(r); setTimeout(() => setCopiedR(null), 2000); }
    });
  };

  return (
    <div className="stack" style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <div className="row" style={{ gap: "0.5rem", marginBottom: "0.25rem" }}>
        <span className="badge badge-loc-local">{S.local}</span>
      </div>

      <div className="row" style={{ gap: "0.75rem" }}>
        <input
          className="input input-mono"
          id="nb-value"
          value={value}
          placeholder={S.placeholder}
          style={{ fontSize: "1.125rem", background: "rgba(19,19,22,0.5)" }}
          onChange={(e) => onValue(e.target.value)}
        />
        <select className="select" id="nb-from" value={from} onChange={(e) => onFrom(parseInt(e.target.value, 10))}>
          {RADIXES.map((r) => <option key={r} value={r}>{S.labels[r]}</option>)}
        </select>
      </div>

      <div className="stack-sm" id="nb-rows">
        {RADIXES.map((r) => (
          <div className="nb-row" key={r}>
            <span className="label">{S.labels[r]}</span>
            <input className="input input-mono nb-out" data-radix={r} readOnly value={outs[r]?.value ?? ""} />
            <button
              className="btn btn-ghost btn-icon nb-copy"
              type="button"
              data-radix={r}
              disabled={!outs[r]?.ok}
              onClick={() => doCopy(r, outs[r]?.value ?? "")}
              aria-label={`Kopírovat ${S.labels[r]}`}
            >
              <Icon name={copiedR === r ? "Check" : "Copy"} size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}