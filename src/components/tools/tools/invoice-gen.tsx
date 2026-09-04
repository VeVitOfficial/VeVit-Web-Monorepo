"use client";

// Generátor faktury — React port legacy tools/assets/js/tools/invoice-gen.js.
// pdf-lib + qrcode-generator (SPD QR platba). Dynamické řádky, wrapText, cs formátování.
import { useCallback, useEffect, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import {
  useToolUi, loadScript, toastSuccess, Icon, useToolState,
} from "@/components/tools/tool-runtime";

interface PdfImg { width(): number; height(): number; }
interface PdfPageMod { getWidth(): number; getHeight(): number; drawText(text: string, opts: unknown): void; drawImage(img: PdfImg, opts: unknown): void; moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; line(opts: unknown): void; }
interface PdfDoc {
  create(): Promise<PdfDoc>;
  addPage(size: [number, number]): PdfPageMod;
  embedFont(f: unknown): Promise<unknown>;
  embedPng(data: Uint8Array | ArrayBuffer): Promise<PdfImg>;
  save(): Promise<Uint8Array>;
}
interface PdfLib { PDFDocument: PdfDocCtor; rgb: (r: number, g: number, b: number) => unknown; StandardFonts: { Helvetica: unknown; HelveticaBold: unknown }; }
interface PdfDocCtor { create(): Promise<PdfDoc>; }
interface QrCtor { new (typeNumber: number, errorCorrectionLevel: string): { addData(text: string): void; make(): void; getModuleCount(): number; isDark(r: number, c: number): boolean; }; }

function pdfLib(): PdfLib { return (window as unknown as { PDFLib: PdfLib }).PDFLib; }
function qrCtor(): QrCtor { return (window as unknown as { qrcode: QrCtor }).qrcode; }

interface Row { qty: number; desc: string; price: number; }

const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${d.getFullYear()}`; };
const dueDate = () => { const d = new Date(); d.setDate(d.getDate() + 14); return `${String(d.getDate()).padStart(2, "0")}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${d.getFullYear()}`; };
const fmtN = (n: number) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtC = (n: number) => `${n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč`;
const csDateISO = (s: string) => { const m = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/.exec(s.trim()); if (!m) return ""; return `${m[3]}${m[2].padStart(2, "0")}${m[1].padStart(2, "0")}`; };

// Zalomení textu na šířku (px) pro font dané velikosti (heuristika 0.5× size na znak).
function wrapText(text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length * size * 0.5 <= maxWidth) cur = test;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Vykreslí QR kód do PNG byteArray (černobílé moduly, scale=1px) a vrátí PNG Uint8Array.
function qrToPng(text: string, scale = 4): Uint8Array | null {
  try {
    const qr = qrCtor();
    const inst = new qr(0, "M");
    inst.addData(text); inst.make();
    const count = inst.getModuleCount();
    const size = count * scale;
    // Vytvoříme canvas a vykreslíme moduly.
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < count; r++) for (let cc = 0; cc < count; cc++) if (inst.isDark(r, cc)) ctx.fillRect(cc * scale, r * scale, scale, scale);
    const dataUrl = c.toDataURL("image/png").split(",")[1];
    return Uint8Array.from(atob(dataUrl), (ch) => ch.charCodeAt(0));
  } catch { return null; }
}

export default function InvoiceGen({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [sup, setSup] = useState({ name: "Moje s.r.o.", addr: "Ulice 123, 110 00 Praha", ico: "12345678", dic: "CZ12345678" });
  const [cus, setCus] = useState({ name: "", addr: "", ico: "" });
  const [num, setNum] = useState("2026001");
  const [date, setDate] = useState(today());
  const [taxDate, setTaxDate] = useState(today());
  const [due, setDue] = useState(dueDate());
  const [iban, setIban] = useState("CZ0708000000001234567");
  const [vs, setVs] = useState("2026001");
  const [ks, setKs] = useState("");
  const [vat, setVat] = useState(21);
  const [rows, setRows] = useState<Row[]>([{ qty: 1, desc: "Položka", price: 1000 }]);
  const [qr, setQr] = useState(true);
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }; }, [rootRef, blobUrl]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((s: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(s); announce(msg ?? t(`state_${s}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  const addRow = () => setRows((r) => [...r, { qty: 1, desc: "", price: 0 }]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, key: keyof Row, val: string | number) => setRows((r) => r.map((row, i) => i === idx ? { ...row, [key]: key === "desc" ? String(val) : Number(val) || 0 } : row));

  const subtotal = () => rows.reduce((s, r) => s + r.qty * r.price, 0);
  const vatAmount = () => (subtotal() * vat) / 100;
  const total = () => subtotal() + vatAmount();

  const run = async () => {
    setError(""); setDone(false); setState("processing"); setProgress({ pct: 5, label: "Načítám pdf-lib…" });
    try {
      await loadScript("/tools/assets/js/lib/pdf-lib.min.js");
      if (qr) await loadScript("/tools/assets/js/lib/qrcode-generator.min.js");
      const P = pdfLib();
      const doc = await P.PDFDocument.create();
      const font = await doc.embedFont(P.StandardFonts.Helvetica);
      const bold = await doc.embedFont(P.StandardFonts.HelveticaBold);
      const page = doc.addPage([595.28, 841.89]);
      const W = page.getWidth();
      const black = P.rgb(0, 0, 0);
      const gray = P.rgb(0.4, 0.4, 0.4);
      let y = 800;
      // Hlavička
      page.drawText("FAKTURA", { x: 40, y, size: 24, font: bold, color: black });
      page.drawText(`č. ${num}`, { x: 200, y: y + 4, size: 14, font, color: gray });
      y -= 40;
      page.drawText(`Datum vystavení: ${date}`, { x: 40, y, size: 11, font, color: black });
      page.drawText(`Datum zdanitelného plnění: ${taxDate}`, { x: 300, y, size: 11, font, color: black });
      y -= 18;
      page.drawText(`Splatnost: ${due}`, { x: 40, y, size: 11, font, color: black });
      y -= 30;
      // Dodavatel / Odběratel
      page.drawText("Dodavatel", { x: 40, y, size: 12, font: bold, color: black });
      page.drawText("Odběratel", { x: 320, y, size: 12, font: bold, color: black });
      y -= 16;
      const drawBlock = (lines: string[], x: number) => { for (const ln of lines) { page.drawText(ln, { x, y, size: 10, font, color: black }); y -= 13; } };
      drawBlock([sup.name, sup.addr, `IČO: ${sup.ico}`, sup.dic ? `DIČ: ${sup.dic}` : ""], 40);
      const yCus = y;
      y = yCus;
      drawBlock([cus.name || "—", cus.addr || "—", cus.ico ? `IČO: ${cus.ico}` : ""], 320);
      y -= 20;
      // Položky — tabulka
      const tableY = y;
      const colX = [40, 90, 320, 430, 510];
      page.drawText("ks", { x: colX[0], y: tableY, size: 10, font: bold, color: black });
      page.drawText("Popis", { x: colX[1], y: tableY, size: 10, font: bold, color: black });
      page.drawText("Cena/ks", { x: colX[2], y: tableY, size: 10, font: bold, color: black });
      page.drawText("Celkem", { x: colX[3], y: tableY, size: 10, font: bold, color: black });
      y -= 6;
      (page as unknown as { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; line(opts: unknown): void }).moveTo(40, y); (page as unknown as { lineTo(x: number, y: number): void }).lineTo(W - 40, y); (page as unknown as { line(opts: unknown): void }).line({ color: gray, thickness: 0.5 });
      y -= 16;
      rows.forEach((r) => {
        const rowTotal = r.qty * r.price;
        page.drawText(String(r.qty), { x: colX[0], y, size: 10, font, color: black });
        const descLines = wrapText(r.desc || "—", colX[2] - colX[1] - 10, 10);
        descLines.slice(0, 2).forEach((ln, i) => page.drawText(ln, { x: colX[1], y: y - i * 12, size: 10, font, color: black }));
        page.drawText(fmtN(r.price), { x: colX[2], y, size: 10, font, color: black });
        page.drawText(fmtN(rowTotal), { x: colX[3], y, size: 10, font, color: black });
        y -= Math.max(20, descLines.slice(0, 2).length * 12 + 8);
      });
      y -= 10;
      // Součty
      const sx = W - 200;
      page.drawText(`Základ:`, { x: sx, y, size: 11, font, color: black });
      page.drawText(fmtC(subtotal()), { x: W - 40 - 80, y, size: 11, font, color: black });
      y -= 16;
      page.drawText(`DPH ${vat}%:`, { x: sx, y, size: 11, font, color: black });
      page.drawText(fmtC(vatAmount()), { x: W - 40 - 80, y, size: 11, font, color: black });
      y -= 18;
      page.drawText(`Celkem k úhradě:`, { x: sx, y, size: 13, font: bold, color: black });
      page.drawText(fmtC(total()), { x: W - 40 - 80, y, size: 13, font: bold, color: black });
      y -= 30;
      // Platební údaje + QR
      page.drawText("Platební údaje", { x: 40, y, size: 12, font: bold, color: black });
      y -= 16;
      page.drawText(`IBAN: ${iban}`, { x: 40, y, size: 10, font, color: black });
      y -= 13;
      page.drawText(`VS: ${vs}${ks ? ` · KS: ${ks}` : ""}`, { x: 40, y, size: 10, font, color: black });
      y -= 13;
      page.drawText(`Částka: ${fmtC(total())}`, { x: 40, y, size: 10, font, color: black });

      if (qr) {
        const spd = `SPD*1.0*ACC:${iban}*AM:${total().toFixed(2)}*CC:CZK*X-VS:${vs}${ks ? `*X-KS:${ks}` : ""}*DT:${csDateISO(due)}*MSG:FAKTURA ${num}`;
        const png = qrToPng(spd, 6);
        if (png) {
          const img = await doc.embedPng(png);
          page.drawImage(img, { x: W - 180, y: y - 40, width: 140, height: 140 });
        }
      }

      setProgress({ pct: 95, label: "Ukládám PDF…" });
      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));
      setProgress({ pct: 100, label: "Hotovo" }); setProgress(null);
      setDone(true); setState("success");
      toastSuccess("Faktura byla vygenerována");
    } catch (e) {
      setProgress(null);
      const m = (e as Error).message || "Generování faktury selhalo.";
      setError(m); setState("error", m);
    }
  };

  const download = () => { if (blobUrl) { const a = document.createElement("a"); a.href = blobUrl; a.download = `faktura-${num}.pdf`; document.body.appendChild(a); a.click(); a.remove(); } };

  const input = (id: string, label: string, val: string, set: (v: string) => void, placeholder?: string) => (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <input id={id} className="input" type="text" value={val} placeholder={placeholder} onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <div className="stack" style={{ maxWidth: "48rem", margin: "0 auto" }}>
      <div className="stack-sm" id="iv-sup">
        <span className="field-label">Dodavatel</span>
        <div className="grid-2">
          {input("iv-sup-name", "Název", sup.name, (v) => setSup({ ...sup, name: v }))}
          {input("iv-sup-addr", "Adresa", sup.addr, (v) => setSup({ ...sup, addr: v }))}
          {input("iv-sup-ico", "IČO", sup.ico, (v) => setSup({ ...sup, ico: v }))}
          {input("iv-sup-dic", "DIČ", sup.dic, (v) => setSup({ ...sup, dic: v }))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="field-label">Odběratel</span>
        <div className="grid-2">
          {input("iv-cus-name", "Název", cus.name, (v) => setCus({ ...cus, name: v }), "Zadejte název")}
          {input("iv-cus-addr", "Adresa", cus.addr, (v) => setCus({ ...cus, addr: v }), "Zadejte adresu")}
          {input("iv-cus-ico", "IČO", cus.ico, (v) => setCus({ ...cus, ico: v }))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="field-label">Faktura</span>
        <div className="grid-3">
          {input("iv-num", "Číslo faktury", num, setNum)}
          {input("iv-date", "Datum vystavení", date, setDate)}
          {input("iv-tax", "Datum zdan. plnění", taxDate, setTaxDate)}
          {input("iv-due", "Splatnost", due, setDue)}
          {input("iv-iban", "IBAN", iban, setIban)}
          {input("iv-vs", "Variabilní symbol", vs, setVs)}
          {input("iv-ks", "Konstantní symbol", ks, setKs)}
          <div>
            <label className="field-label" htmlFor="iv-vat">DPH (%)</label>
            <input id="iv-vat" className="input" type="number" min={0} max={100} value={vat} onChange={(e) => setVat(Math.max(0, Math.min(100, +e.target.value || 0)))} />
          </div>
        </div>
      </div>

      <div className="stack-sm">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <span className="field-label">Položky</span>
          <button className="btn btn-ghost btn-sm" id="iv-add-row" type="button" onClick={addRow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Přidat řádek</button>
        </div>
        <div className="iv-rows" id="iv-rows">
          {rows.map((r, idx) => (
            <div className="iv-row" key={idx}>
              <input className="input iv-col-qty" type="number" min={0} value={r.qty} aria-label="Množství" onChange={(e) => updateRow(idx, "qty", e.target.value)} />
              <input className="input iv-col-desc" type="text" value={r.desc} placeholder="Popis položky" aria-label="Popis" onChange={(e) => updateRow(idx, "desc", e.target.value)} />
              <input className="input iv-col-price" type="number" min={0} value={r.price} aria-label="Cena za ks" onChange={(e) => updateRow(idx, "price", e.target.value)} />
              <span className="iv-col-total mono">{fmtN(r.qty * r.price)}</span>
              <button type="button" className="btn btn-ghost btn-icon-sm" aria-label={t("remove_file", { name: `řádek ${idx + 1}` })} onClick={() => removeRow(idx)}><Icon name="X" size={16} /></button>
            </div>
          ))}
        </div>
        <div className="iv-totals">
          <div><span>Základ:</span> <span className="mono">{fmtC(subtotal())}</span></div>
          <div><span>DPH {vat}%:</span> <span className="mono">{fmtC(vatAmount())}</span></div>
          <div className="iv-total"><span>Celkem k úhradě:</span> <span className="mono">{fmtC(total())}</span></div>
        </div>
      </div>

      <label className="checkbox-row"><input id="iv-qr" type="checkbox" checked={qr} onChange={(e) => setQr(e.target.checked)} /> <span>Vygenerovat QR kód pro platbu (SPD)</span></label>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="iv-run" type="button" onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v6h6" /><path d="M4 4h10l6 6v10H4z" /></svg> Vygenerovat fakturu
        </button>
      </div>

      {progress && (<><div className="progress-track" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${progress.pct}%` }} /></div><p className="progress-label">{progress.label}</p></>)}
      {error && <p className="error-text" role="alert">{error}</p>}

      {done && blobUrl && (
        <div className="result-card">
          <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /></svg></span>
          <div className="rc-meta"><span className="rc-title">faktura-{num}.pdf</span><span className="rc-sub">{fmtC(total())} · {qr ? "s QR" : "bez QR"}</span></div>
          <button className="btn btn-primary" type="button" onClick={download}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout</button>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> Faktura se generuje lokálně přes pdf-lib. Údaje se neodesílají na server.</div>
    </div>
  );
}

// Malý helper — csDateISO převádí dd. mm. rrrr na rrrrmmdd pro SPD QR.