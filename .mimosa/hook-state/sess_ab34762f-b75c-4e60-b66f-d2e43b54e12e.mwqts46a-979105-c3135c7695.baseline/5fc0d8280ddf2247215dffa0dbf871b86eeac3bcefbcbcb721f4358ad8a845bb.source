"use client";

// Převod XLSX → XML, čistě client-side přes SheetJS (xlsx.full.min.js).
// Vybere se list, data (AOA) se serializují do XML: kořen <data>, každý řádek
// <row>, buňky jako <colN>. Pokud první řádek vypadá jako hlavička (všechny
// buňky neprázdné a po sanitizaci jedinečné), použijí se názvy sloupců
// jako tagy. Pretty-print s 2-mezerovým odsazením, hodnoty XML-escapované.
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, loadScript, toastSuccess, Icon } from "@/components/tools/tool-runtime";
import { Dropzone, FileList, setToolState } from "@/components/tools/tools/audio-convert";

const ACCEPT = [".xlsx", ".xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
const MAX = 50 * 1024 * 1024;

// ── Typy UMD SheetJS (XLSX) ──────────────────────────────────────────────
interface XlsxWS { [key: string]: unknown; }
interface XlsxWB { SheetNames: string[]; Sheets: Record<string, XlsxWS>; }
interface XLSXLike {
  read(data: ArrayBuffer, opts?: { type?: string }): XlsxWB;
  utils: { sheet_to_json(ws: XlsxWS, opts?: { header?: number; raw?: boolean }): unknown[][]; };
}
function xlsxLib(): XLSXLike | undefined {
  return (window as unknown as { XLSX?: XLSXLike }).XLSX;
}
async function ensureXlsx(): Promise<XLSXLike> {
  if (!xlsxLib()) await loadScript("/tools/assets/js/lib/xlsx.full.min.js");
  const X = xlsxLib();
  if (!X) throw new Error("Knihovnu SheetJS (xlsx) se nepodařilo načíst. Zkontrolujte připojení a zkuste to znovu.");
  return X;
}

/** XML escape povinných znaků (& < > " '). */
function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** Sanitizace názvu tagu: jen [A-Za-z0-9_], nesmí začínat číslicí. */
function sanitizeTag(raw: string): string {
  let s = String(raw ?? "").replace(/[^A-Za-z0-9_]/g, "_");
  if (!s || /^[0-9]/.test(s)) s = "_" + s;
  return s;
}

/** Vypadá první řádek jako hlavička? (vše neprázdné + jedinečné sanitizované tagy) */
function looksLikeHeader(row: unknown[]): boolean {
  if (!row.length) return false;
  const seen = new Set<string>();
  for (const cell of row) {
    if (cell == null || String(cell).trim() === "") return false;
    const tag = sanitizeTag(String(cell));
    if (seen.has(tag)) return false;
    seen.add(tag);
  }
  return true;
}

/** Sestaví XML dokument z AOA dat. */
function aoaToXml(aoa: unknown[][]): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', "<data>"];
  const useHeader = aoa.length > 1 && looksLikeHeader(aoa[0]);
  const tags: string[] = [];
  if (useHeader) {
    for (const cell of aoa[0]) tags.push(sanitizeTag(String(cell)));
  } else {
    let max = 0;
    for (const row of aoa) if (row.length > max) max = row.length;
    for (let i = 0; i < max; i++) tags.push("col" + (i + 1));
  }
  const body = useHeader ? aoa.slice(1) : aoa;
  for (const row of body) {
    if (!row.length || row.every((c) => c == null || String(c).trim() === "")) continue; // prázdné řádky přeskočit
    lines.push("  <row>");
    for (let c = 0; c < tags.length; c++) {
      const v = row[c];
      const val = v == null ? "" : String(v);
      lines.push(`    <${tags[c]}>${escXml(val)}</${tags[c]}>`);
    }
    lines.push("  </row>");
  }
  lines.push("</data>");
  return lines.join("\n");
}

export default function ExcelToXml({ locale }: ToolComponentProps) {
  const { copied, copy } = useCopy(locale);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheet, setSheet] = useState("");
  const [xml, setXml] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wbRef = useRef<XlsxWB | null>(null);
  const xlsxRef = useRef<XLSXLike | null>(null);

  const reset = () => {
    setFile(null); setSheetNames([]); setSheet(""); setXml(""); setInfo(null); setError(null); setBusy(false);
    wbRef.current = null;
    setToolState("idle");
  };

  const buildXml = (sheetName: string): { xml: string; info: string } => {
    const X = xlsxRef.current;
    const wb = wbRef.current;
    if (!X || !wb || !sheetName) return { xml: "", info: "" };
    const aoa = X.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: false });
    return {
      xml: aoaToXml(aoa),
      info: aoa.length
        ? `${aoa.length} ${aoa.length === 1 ? "řádek" : aoa.length < 5 ? "řádky" : "řádků"} (včetně hlavičky) · ${looksLikeHeader(aoa[0]) ? "hlavička použita jako názvy tagů" : "sloupce jako col1..colN"}`
        : "List je prázdný.",
    };
  };

  const onFiles = async (arr: File[]) => {
    const f = arr[0];
    setError(null); setXml(""); setInfo(null); setBusy(true);
    try {
      const X = await ensureXlsx();
      xlsxRef.current = X;
      const buf = await f.arrayBuffer();
      const wb = X.read(buf, { type: "array" });
      if (!wb.SheetNames.length) throw new Error("Sešit neobsahuje žádný list.");
      wbRef.current = wb;
      setSheetNames(wb.SheetNames);
      const first = wb.SheetNames[0];
      setSheet(first);
      const out = buildXml(first);
      setXml(out.xml); setInfo(out.info);
      setFile(f);
      setToolState("ready");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Soubor se nepodařilo načíst (není to platný Excel?).";
      setFile(null); wbRef.current = null;
      setError(msg);
      setToolState("error");
    } finally {
      setBusy(false);
    }
  };

  const onSheet = (name: string) => {
    setSheet(name);
    const out = buildXml(name);
    setXml(out.xml); setInfo(out.info);
  };

  const onCopy = async () => { if (xml) { await copy(xml); } };

  const download = () => {
    if (!xml) return;
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data.xml";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toastSuccess("XML staženo");
  };

  return (
    <div className="stack" style={{ maxWidth: "52rem", margin: "0 auto" }}>
      <Dropzone
        accept={ACCEPT} multiple={false} maxSize={MAX}
        onFiles={onFiles} onError={(m) => setError(m)}
        ariaLabel="Přetáhněte Excel soubor" locale={locale}
      >
        <span className="dz-ico">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="m8 13 3 3 5-5" />
          </svg>
        </span>
        <span className="dz-title">Přetáhněte Excel soubor</span>
        <span className="dz-hint">XLSX / XLS → XML, volba listu</span>
      </Dropzone>

      {file ? <FileList files={[{ name: file.name, size: file.size }]} onRemove={() => reset()} locale={locale} /> : null}

      {file ? (
        <div className="stack-sm" id="ex-sheet-grp">
          <label className="field-label" htmlFor="ex-sheet">List</label>
          <select className="select" id="ex-sheet" value={sheet} onChange={(e) => onSheet(e.target.value)}>
            {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      ) : null}

      {busy ? <p className="muted">Načítám sešit…</p> : null}

      {file && !busy ? (
        <div className="stack-sm">
          <label className="field-label" htmlFor="ex-out">XML výstup</label>
          <textarea className="textarea mono" id="ex-out" rows={14} readOnly value={xml} />
        </div>
      ) : null}

      {info ? <p className="muted" style={{ fontSize: "0.85rem" }}>{info}</p> : null}
      {error ? <p className="error-text" role="alert">{error}</p> : null}

      {file && !busy ? (
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn btn-primary" id="ex-dl" type="button" disabled={!xml} onClick={download}>
            <Icon name="Download" size={16} /> Stáhnout data.xml
          </button>
          <button className="btn btn-secondary" id="ex-copy" type="button" disabled={!xml} onClick={onCopy}>
            {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
          </button>
        </div>
      ) : null}

      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Názvy tagů z hlavičky se sanitizují na [A-Za-z0-9_] (diakritika a speciální znaky → _). Hodnoty se XML-escapují. Běží lokálně.
      </p>
    </div>
  );
}
