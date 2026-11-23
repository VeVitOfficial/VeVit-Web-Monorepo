"use client";

// Práce s řádky textu (sort/unique/trim/reverse/...), čistě client-side. Port legacy text-lines-tool.js.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, Icon } from "@/components/tools/tool-runtime";

// Fisher–Yates shuffle (jako legacy shuffle()).
function shuffle(a: string[]): string[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

type Op = "sort" | "sortdesc" | "unique" | "trim" | "nonempty" | "reverse" | "shuffle" | "number" | "dedup-blank";

const OPS: Record<Op, (l: string[]) => string[]> = {
  sort: (l) => l.slice().sort((a, b) => a.localeCompare(b, "cs")),
  sortdesc: (l) => l.slice().sort((a, b) => b.localeCompare(a, "cs")),
  unique: (l) => { const s: string[] = []; l.forEach((x) => { if (s.indexOf(x) === -1) s.push(x); }); return s; },
  trim: (l) => l.map((x) => x.trim()),
  nonempty: (l) => l.filter((x) => x.trim() !== ""),
  reverse: (l) => l.slice().reverse(),
  shuffle: (l) => shuffle(l.slice()),
  number: (l) => l.map((x, i) => i + 1 + ". " + x),
  "dedup-blank": (l) => {
    const r: string[] = []; let prevBlank = false;
    l.forEach((x) => { const b = x.trim() === ""; if (b && prevBlank) return; r.push(x); prevBlank = b; });
    return r;
  },
};

const BUTTONS: { op: Op; label: string }[] = [
  { op: "sort", label: "Seřadit A→Z" },
  { op: "sortdesc", label: "Seřadit Z→A" },
  { op: "unique", label: "Odstranit duplicity" },
  { op: "trim", label: "Oříznout mezery" },
  { op: "nonempty", label: "Smazat prázdné" },
  { op: "reverse", label: "Obrátit pořadí" },
  { op: "shuffle", label: "Náhodně" },
  { op: "number", label: "Očíslovat" },
  { op: "dedup-blank", label: "Sbalit prázdné" },
];

export default function TextLinesTool({ locale }: ToolComponentProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const apply = useCallback((op: Op) => {
    const lines = input.split("\n");
    setOutput(OPS[op](lines).join("\n"));
  }, [input]);

  const onCopy = useCallback(() => {
    if (output) void copyText(output, locale);
  }, [output, locale]);

  const useAsInput = useCallback(() => {
    setInput(output);
    setOutput("");
  }, [output]);

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="lt-in">Vstup (řádek = jeden záznam)</label>
        <textarea className="textarea mono" id="lt-in" rows={8} placeholder="řádek 1\nřádek 2…" value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      <div className="row" id="lt-btns" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        {BUTTONS.map((b) => (
          <button key={b.op} className="btn btn-ghost" type="button" data-op={b.op} onClick={() => apply(b.op)}>{b.label}</button>
        ))}
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="lt-out">Výstup</label>
        <textarea className="textarea mono" id="lt-out" rows={8} readOnly value={output} />
        <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button className="btn btn-secondary" id="lt-copy" type="button" disabled={!output} onClick={onCopy}>
            <Icon name="Copy" size={16} /> Kopírovat
          </button>
          <button className="btn btn-ghost" id="lt-back" type="button" onClick={useAsInput}>⇅ Použít výstup jako vstup</button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>Vše běží lokálně.</p>
    </div>
  );
}