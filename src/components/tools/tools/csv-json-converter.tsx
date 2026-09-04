"use client";

// CSV ↔ JSON převodník — port legacy csv-json-converter.js.
// Vlastní parser/emiter, bez knihoven. Čistě client-side.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

type Mode = "c2j" | "j2c";

function parseCSV(text: string, d: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; continue; }
        inQ = false; continue;
      }
      field += c; continue;
    }
    if (c === '"') { inQ = true; continue; }
    if (c === d) { row.push(field); field = ""; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvToJSON(text: string, d: string): string {
  const rows = parseCSV(text, d);
  if (!rows.length) return "[]";
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") rows.pop();
  if (!rows.length) return "[]";
  const headers = rows[0];
  const arr: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].length === 1 && rows[r][0] === "") continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c]] = rows[r][c] != null ? rows[r][c] : "";
    arr.push(obj);
  }
  return JSON.stringify(arr, null, 2);
}

function esc(v: unknown, d: string): string {
  if (v == null) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  const dEsc = d === "\t" ? "\\t" : d;
  if (new RegExp(`["${dEsc}\\n]`).test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function jsonToCSV(text: string, d: string): string {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON musí být pole (objektů nebo polí).");
  if (!data.length) return "";
  let headers: string[];
  const isArr = Array.isArray(data[0]);
  if (isArr) {
    let max = 0; for (const r of data) if (r.length > max) max = r.length;
    headers = []; for (let i = 0; i < max; i++) headers.push("col" + (i + 1));
  } else {
    const set: string[] = [];
    for (const o of data) for (const k in o) if (set.indexOf(k) === -1) set.push(k);
    headers = set;
  }
  const lines = [headers.map((h) => esc(h, d)).join(d)];
  for (const row of data) {
    if (isArr) lines.push(headers.map((_, i) => esc(row[i], d)).join(d));
    else lines.push(headers.map((h) => esc(row[h], d)).join(d));
  }
  return lines.join("\n");
}

export default function CsvJsonConverter({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [mode, setMode] = useState<Mode>("c2j");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delim, setDelim] = useState(",");
  const [err, setErr] = useState<string | null>(null);

  const convert = useCallback(() => {
    setErr(null);
    if (!input.trim()) { setOutput(""); return; }
    try {
      setOutput(mode === "c2j" ? csvToJSON(input, delim) : jsonToCSV(input, delim));
    } catch (e) {
      setOutput("");
      setErr(mode === "c2j" ? "Neplatný CSV: " + (e as Error).message : "Neplatný JSON: " + (e as Error).message);
    }
  }, [input, mode, delim]);

  const onSwap = () => {
    setInput(output);
    const other: Mode = mode === "c2j" ? "j2c" : "c2j";
    setMode(other);
  };

  const onCopy = async () => { if (output) { const ok = await copy(output); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", alignItems: "end" }}>
        <div className="seg" id="cj-mode" role="tablist" aria-label="Režim">
          {(["c2j", "j2c"] as Mode[]).map((m) => (
            <button key={m} type="button" role="tab" data-mode={m} aria-selected={mode === m}
              className={mode === m ? "active" : ""} onClick={() => setMode(m)}>
              {m === "c2j" ? "CSV → JSON" : "JSON → CSV"}
            </button>
          ))}
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cj-delim">Oddělovač</label>
          <select className="select" id="cj-delim" value={delim} onChange={(e) => setDelim(e.target.value)}>
            <option value=",">Čárka (,)</option>
            <option value=";">Středník (;)</option>
            <option value={"\t"}>Tabulátor</option>
          </select>
        </div>
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="cj-in">Vstup</label>
          <textarea className="textarea mono" id="cj-in" rows={12} value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="cj-out">Výstup</label>
          <textarea className="textarea mono" id="cj-out" rows={12} readOnly value={output} />
        </div>
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="row">
        <button className="btn btn-primary" id="cj-run" type="button" onClick={convert}>Převést</button>
        <button className="btn btn-ghost" id="cj-swap" type="button" title="Použít výstup jako vstup" onClick={onSwap}>⇅ Prohodit</button>
        <button className="btn btn-secondary" id="cj-copy" type="button" disabled={!output} onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
    </div>
  );
}