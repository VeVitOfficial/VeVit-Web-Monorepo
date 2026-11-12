// Export faktury do PDF přímo v prohlížeči (pdf-lib + fontkit + Liberation Sans s plnou českou diakritikou).
// Žádná data se neodesílají; knihovny a písma se načtou až při prvním exportu.
import { loadScript } from "@/components/tools/tool-runtime";
import {
  L, addressLines, calcLine, contactLines, dueDate, fmtDate, hexToRgb, inkColor, invoiceNumber, money, onColor, plainNumber, softColor, variableSymbol,
  type Invoice, type Totals,
} from "@/components/tools/invoice/model";

interface PdfFont { widthOfTextAtSize(text: string, size: number): number }
interface PdfPage {
  drawText(text: string, o: { x: number; y: number; size: number; font: PdfFont; color: unknown }): void;
  drawRectangle(o: { x: number; y: number; width: number; height: number; color?: unknown; borderColor?: unknown; borderWidth?: number }): void;
  drawLine(o: { start: { x: number; y: number }; end: { x: number; y: number }; thickness: number; color: unknown }): void;
  drawImage(img: unknown, o: { x: number; y: number; width: number; height: number }): void;
}
interface PdfDoc {
  registerFontkit(f: unknown): void;
  embedFont(data: ArrayBuffer | Uint8Array, o?: { subset?: boolean }): Promise<PdfFont>;
  embedPng(data: Uint8Array): Promise<unknown>;
  addPage(size: [number, number]): PdfPage;
  getPages(): PdfPage[];
  setTitle(s: string): void; setProducer(s: string): void; setCreator(s: string): void; setCreationDate(d: Date): void;
  save(): Promise<Uint8Array>;
}
interface PdfLib { PDFDocument: { create(): Promise<PdfDoc> }; rgb(r: number, g: number, b: number): unknown }

const LIB = "/tools/assets/js/lib/";
async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nepodařilo se načíst písmo (${res.status}).`);
  return res.arrayBuffer();
}

/** Mezery z Intl (NBSP, úzká NBSP) převede na obyčejné, aby je písmo mělo. */
const clean = (s: string): string => s.replace(/[   ]/g, " ");

export async function buildInvoicePdf(inv: Invoice, totals: Totals, qrPng: Uint8Array | null): Promise<Uint8Array> {
  await Promise.all([loadScript(`${LIB}pdf-lib.min.js`), loadScript(`${LIB}invoice/fontkit.umd.min.js`)]);
  const w = window as unknown as { PDFLib: PdfLib; fontkit: unknown };
  const { PDFDocument, rgb } = w.PDFLib;
  const doc = await PDFDocument.create();
  doc.registerFontkit(w.fontkit);
  const [regBytes, boldBytes] = await Promise.all([fetchBytes(`${LIB}invoice/LiberationSans-Regular.ttf`), fetchBytes(`${LIB}invoice/LiberationSans-Bold.ttf`)]);
  const font = await doc.embedFont(regBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });
  const qrImg = qrPng ? await doc.embedPng(qrPng) : null;

  const t = L[inv.lang];
  const cur = (n: number) => clean(money(n, inv.currency, inv.lang));
  const PW = 595.28, PH = 841.89, M = 40, CW = PW - 2 * M, BOTTOM = PH - 56;
  const ink = rgb(0.09, 0.1, 0.12), grey = rgb(0.4, 0.42, 0.45), line = rgb(0.85, 0.87, 0.89), soft = rgb(0.955, 0.965, 0.96);
  const accentBg = rgb(...hexToRgb(inv.color)), accentOn = rgb(...onColor(inv.color));
  const accent = rgb(...inkColor(inv.color)), accentSoft = rgb(...softColor(inv.color));

  let page = doc.addPage([PW, PH]);
  let y = M; // vzdálenost od horního okraje

  const widthOf = (s: string, size: number, f: PdfFont = font) => f.widthOfTextAtSize(s, size);
  const text = (s: string, x: number, top: number, size: number, f: PdfFont = font, color: unknown = ink, align: "l" | "r" = "l") => {
    const c = clean(s);
    if (!c) return;
    page.drawText(c, { x: align === "r" ? x - widthOf(c, size, f) : x, y: PH - top - size * 0.8, size, font: f, color });
  };
  const rect = (x: number, top: number, wd: number, h: number, color: unknown) => page.drawRectangle({ x, y: PH - top - h, width: wd, height: h, color });
  const hline = (top: number, x1 = M, x2 = PW - M, color: unknown = line) => page.drawLine({ start: { x: x1, y: PH - top }, end: { x: x2, y: PH - top }, thickness: 0.6, color });

  /** Zalomí text na šířku podle skutečných metrik písma. */
  const wrap = (s: string, maxW: number, size: number, f: PdfFont = font): string[] => {
    const out: string[] = [];
    for (const para of clean(s).split("\n")) {
      let cur = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = cur ? `${cur} ${word}` : word;
        if (widthOf(test, size, f) <= maxW) { cur = test; continue; }
        if (cur) out.push(cur);
        cur = word;
        while (widthOf(cur, size, f) > maxW && cur.length > 1) { // příliš dlouhé slovo
          let n = cur.length - 1;
          while (n > 1 && widthOf(cur.slice(0, n), size, f) > maxW) n--;
          out.push(cur.slice(0, n));
          cur = cur.slice(n);
        }
      }
      out.push(cur);
    }
    return out;
  };
  const newPage = () => { page = doc.addPage([PW, PH]); y = M; };
  const ensure = (h: number, redraw?: () => void) => { if (y + h > BOTTOM) { newPage(); redraw?.(); } };

  // ── Hlavička ──
  text(inv.vatPayer ? t.taxInvoice : t.invoice, M, y, 20, bold, accent);
  text(`${t.number} ${invoiceNumber(inv)}`, M, y + 28, 12, font, grey);
  const dateRows: [string, string, boolean][] = [[t.issue, fmtDate(inv.issue, inv.lang), false]];
  if (inv.vatPayer) dateRows.push([t.taxDate, fmtDate(inv.taxDate, inv.lang), false]);
  dateRows.push([t.due, fmtDate(dueDate(inv), inv.lang), true]);
  dateRows.forEach(([k, v, strong], i) => {
    text(k, PW - M - 175, y + i * 15, 9, font, grey);
    text(v, PW - M, y + i * 15, 9.5, strong ? bold : font, ink, "r");
  });
  y += Math.max(46, dateRows.length * 15) + 18;

  // ── Dodavatel / odběratel ──
  const colW = (CW - 16) / 2;
  const partyLines = (p: Invoice["supplier"], extra?: string): { s: string; f: PdfFont; size: number; color: unknown }[] => {
    const out: { s: string; f: PdfFont; size: number; color: unknown }[] = [];
    const name = p.name.trim();
    if (name) for (const l of wrap(name, colW - 20, 11, bold)) out.push({ s: l, f: bold, size: 11, color: ink });
    for (const l of addressLines(p)) out.push({ s: l, f: font, size: 9.5, color: ink });
    if (p.ico.trim()) out.push({ s: `${t.ico}: ${p.ico}`, f: font, size: 9.5, color: ink });
    if (p.dic.trim()) out.push({ s: `${t.dic}: ${p.dic}`, f: font, size: 9.5, color: ink });
    for (const l of contactLines(p)) out.push({ s: l, f: font, size: 9, color: grey });
    if (p.note.trim()) for (const l of wrap(p.note, colW - 20, 9)) out.push({ s: l, f: font, size: 9, color: grey });
    if (extra) out.push({ s: extra, f: font, size: 9, color: grey });
    return out;
  };
  const sup = partyLines(inv.supplier, inv.vatPayer ? undefined : t.nonPayer);
  const cus = partyLines(inv.customer);
  const boxH = 30 + Math.max(sup.length, cus.length, 1) * 13.5 + 8;
  ensure(boxH);
  [[t.supplier, sup, M], [t.customer, cus, M + colW + 16]].forEach(([title, lines, x]) => {
    rect(x as number, y, colW, boxH, soft);
    text((title as string).toUpperCase(), (x as number) + 10, y + 9, 8, bold, grey);
    (lines as typeof sup).forEach((l, i) => text(l.s, (x as number) + 10, y + 26 + i * 13.5, l.size, l.f, l.color));
  });
  y += boxH + 20;

  // ── Položky ──
  const cols = inv.vatPayer
    ? [{ k: "desc", w: 158 }, { k: "qty", w: 52 }, { k: "price", w: 66 }, { k: "disc", w: 52 }, { k: "vat", w: 32 }, { k: "net", w: 75 }, { k: "gross", w: CW - 435 }]
    : [{ k: "desc", w: 212 }, { k: "qty", w: 66 }, { k: "price", w: 86 }, { k: "disc", w: 66 }, { k: "net", w: CW - 430 }];
  const heads: Record<string, string> = { desc: t.desc, qty: t.qty, price: t.unitPrice, disc: t.discount, vat: t.vat, net: inv.vatPayer ? t.base : t.total, gross: t.totalVat };
  const xs: number[] = [];
  cols.reduce((acc, c) => { xs.push(acc); return acc + c.w; }, M);
  const cell = (i: number, s: string, top: number, size: number, f: PdfFont = font, color: unknown = ink) => {
    const c = cols[i];
    if (c.k === "desc") text(s, xs[i] + 4, top, size, f, color);
    else text(s, xs[i] + c.w - 4, top, size, f, color, "r");
  };
  const header = () => {
    rect(M, y, CW, 20, accentSoft);
    cols.forEach((c, i) => cell(i, heads[c.k], y + 6, 8.5, bold, accent));
    y += 20;
  };
  header();
  inv.items.forEach((it) => {
    const c = calcLine(it, inv.vatPayer);
    const descLines = wrap(it.desc.trim() || t.placeholders.item, cols[0].w - 8, 9.5);
    const rowH = Math.max(24, descLines.length * 12 + 12);
    ensure(rowH, header);
    descLines.forEach((l, i) => text(l, xs[0] + 4, y + 7 + i * 12, 9.5, font, it.desc.trim() ? ink : grey));
    const qty = `${plainNumber(it.qty, inv.lang, Number.isInteger(it.qty) ? 0 : 2)} ${it.unit}`.trim();
    const disc = it.discount > 0 ? (it.discType === "pct" ? `${plainNumber(it.discount, inv.lang, Number.isInteger(it.discount) ? 0 : 2)} %` : cur(c.discountAmt)) : "—";
    const vals: Record<string, string> = { qty, price: cur(it.price), disc, vat: `${plainNumber(c.rate, inv.lang, 0)} %`, net: cur(c.net), gross: cur(c.total) };
    cols.forEach((col, i) => { if (col.k !== "desc") cell(i, vals[col.k], y + 7, 9, col.k === "gross" ? bold : font); });
    y += rowH;
    hline(y);
  });
  y += 16;

  // ── Rekapitulace DPH a součty ──
  const totalsRows: [string, string][] = [];
  if (totals.discount > 0) totalsRows.push([t.subtotalDiscount, `−${cur(totals.discount)}`]);
  if (totals.rounding !== 0) totalsRows.push([t.rounding, cur(totals.rounding)]);
  const recapH = inv.vatPayer ? 36 + totals.groups.length * 15 : 0;
  const totalsH = totalsRows.length * 16 + 34;
  ensure(Math.max(recapH, totalsH));
  const top0 = y;
  if (inv.vatPayer) {
    const right = [M + 112, M + 192, M + 280]; // pravé okraje sloupců Základ / DPH / S DPH
    text(t.recap.toUpperCase(), M, y, 8, bold, grey);
    y += 14;
    text(t.rate, M, y, 8.5, bold, grey);
    [t.base, t.vat, t.totalVat].forEach((h, i) => text(h, right[i], y, 8.5, bold, grey, "r"));
    hline(y + 13, M, M + 284);
    y += 18;
    totals.groups.forEach((g) => {
      text(`${plainNumber(g.rate, inv.lang, 0)} %`, M, y, 9);
      [g.base, g.vat, g.total].forEach((v, i) => text(cur(v), right[i], y, 9, font, ink, "r"));
      y += 15;
    });
  }
  let ty = top0;
  const tx = PW - M - 200;
  totalsRows.forEach(([k, v]) => { text(k, tx, ty, 9.5, font, grey); text(v, PW - M, ty, 9.5, font, ink, "r"); ty += 16; });
  rect(tx - 8, ty - 2, 208, 28, accentBg);
  text(t.payable, tx, ty + 8, 10, bold, accentOn);
  text(cur(totals.payable), PW - M - 6, ty + 7, 12, bold, accentOn, "r");
  y = Math.max(y, ty + 28) + 24;

  // ── Platební údaje + QR ──
  const p = inv.payment;
  const vs = variableSymbol(inv);
  const rows: [string, string][] = [[t.method, t.methods[p.method]]];
  if (p.method === "transfer") {
    for (const r of [[t.bank, p.bank], [t.account, p.account], [t.iban, p.iban], [t.bic, p.bic], [t.vs, vs], [t.ks, p.ks], [t.ss, p.ss]] as [string, string][]) if (r[1].trim()) rows.push(r);
  } else if (vs) rows.push([t.vs, vs]);
  const qrSize = qrImg ? 96 : 0;
  const payH = Math.max(18 + rows.length * 15, qrSize ? qrSize + 30 : 0);
  ensure(payH);
  text(t.payment.toUpperCase(), M, y, 8, bold, grey);
  rows.forEach(([k, v], i) => { text(k, M, y + 16 + i * 15, 9, font, grey); text(v, M + 120, y + 16 + i * 15, 9.5, bold); });
  if (qrImg) {
    page.drawImage(qrImg, { x: PW - M - qrSize, y: PH - y - 12 - qrSize, width: qrSize, height: qrSize });
    text(t.qr, PW - M - qrSize / 2 - widthOf(clean(t.qr), 8) / 2, y + 12 + qrSize + 2, 8, font, grey);
  }
  y += payH + 8;

  // ── Poznámka ──
  if (inv.note.trim()) {
    const lines = wrap(inv.note, CW, 9.5);
    ensure(16 + lines.length * 12.5);
    text(t.note.toUpperCase(), M, y, 8, bold, grey);
    lines.forEach((l, i) => text(l, M, y + 14 + i * 12.5, 9.5));
    y += 16 + lines.length * 12.5;
  }

  // ── Čísla stran ──
  const pages = doc.getPages();
  if (pages.length > 1) {
    pages.forEach((pg, i) => {
      const s = `${t.page} ${i + 1} ${t.of} ${pages.length}`;
      pg.drawText(s, { x: PW - M - widthOf(s, 8), y: 28, size: 8, font, color: grey });
    });
  }

  doc.setTitle(`${t.invoice} ${invoiceNumber(inv)}`);
  doc.setCreator("VeVit Tools");
  doc.setProducer("VeVit Tools (pdf-lib)");
  doc.setCreationDate(new Date());
  return doc.save();
}
