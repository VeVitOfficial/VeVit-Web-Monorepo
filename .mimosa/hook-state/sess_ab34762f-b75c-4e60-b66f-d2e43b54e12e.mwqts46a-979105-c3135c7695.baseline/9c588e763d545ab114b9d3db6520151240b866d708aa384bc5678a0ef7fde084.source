"use client";

// Živý náhled faktury na formátu A4 (794 × 1123 px při 96 dpi). Stejná data používá i export do PDF.
/* eslint-disable @next/next/no-img-element -- QR je data: URL vygenerovaná lokálně, next/image tu nedává smysl */
import { useEffect, useRef, useState } from "react";
import {
  L, addressLines, calcLine, contactLines, cssRgb, dueDate, fmtDate, inkColor, invoiceNumber, money, onColor, plainNumber, softColor, variableSymbol,
  type Invoice, type Totals,
} from "@/components/tools/invoice/model";

export const SHEET_W = 794;
export const SHEET_H = 1123;

function Ph({ text, ph }: { text: string; ph: string }) {
  return text.trim() ? <>{text}</> : <span className="iv-ph">{ph}</span>;
}

function PartyBox({ title, p, extra, ph, lang }: { title: string; p: Invoice["supplier"]; extra?: string; ph: string; lang: Invoice["lang"] }) {
  const t = L[lang];
  const addr = addressLines(p);
  const contacts = contactLines(p);
  return (
    <div className="iv-party">
      <div className="iv-party-title">{title}</div>
      <div className="iv-party-name"><Ph text={p.name} ph={ph} /></div>
      {addr.map((l, i) => <div key={i}>{l}</div>)}
      {p.ico.trim() ? <div>{t.ico}: {p.ico}</div> : null}
      {p.dic.trim() ? <div>{t.dic}: {p.dic}</div> : null}
      {contacts.map((l, i) => <div key={`c${i}`} className="iv-muted">{l}</div>)}
      {p.note.trim() ? <div className="iv-muted iv-pre">{p.note}</div> : null}
      {extra ? <div className="iv-muted">{extra}</div> : null}
    </div>
  );
}

export function InvoiceSheet({ inv, totals, qrUrl }: { inv: Invoice; totals: Totals; qrUrl: string | null }) {
  const t = L[inv.lang];
  const cur = (n: number) => money(n, inv.currency, inv.lang);
  const p = inv.payment;
  const vs = variableSymbol(inv);
  const payRows: [string, string][] = [
    [t.method, t.methods[p.method]],
    ...(p.method === "transfer"
      ? ([[t.bank, p.bank], [t.account, p.account], [t.iban, p.iban], [t.bic, p.bic], [t.vs, vs], [t.ks, p.ks], [t.ss, p.ss]] as [string, string][]).filter(([, v]) => v.trim())
      : vs ? ([[t.vs, vs]] as [string, string][]) : []),
  ];
  return (
    <div
      className="iv-sheet"
      style={{
        width: SHEET_W, minHeight: SHEET_H,
        "--iv-main": inv.color, "--iv-ink": cssRgb(inkColor(inv.color)), "--iv-soft": cssRgb(softColor(inv.color)), "--iv-on": cssRgb(onColor(inv.color)),
      } as React.CSSProperties}
    >
      <div className="iv-head">
        <div>
          <div className="iv-title">{inv.vatPayer ? t.taxInvoice : t.invoice}</div>
          <div className="iv-number">{t.number} {invoiceNumber(inv) || "—"}</div>
        </div>
        <table className="iv-dates">
          <tbody>
            <tr><td>{t.issue}</td><td>{fmtDate(inv.issue, inv.lang)}</td></tr>
            {inv.vatPayer ? <tr><td>{t.taxDate}</td><td>{fmtDate(inv.taxDate, inv.lang)}</td></tr> : null}
            <tr><td>{t.due}</td><td><strong>{fmtDate(dueDate(inv), inv.lang)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <div className="iv-parties">
        <PartyBox title={t.supplier} p={inv.supplier} ph={t.placeholders.supplier} lang={inv.lang} extra={inv.vatPayer ? undefined : t.nonPayer} />
        <PartyBox title={t.customer} p={inv.customer} ph={t.placeholders.customer} lang={inv.lang} />
      </div>

      <table className="iv-items">
        <thead>
          <tr>
            <th className="iv-l">{t.desc}</th>
            <th>{t.qty}</th>
            <th>{t.unitPrice}</th>
            <th>{t.discount}</th>
            {inv.vatPayer ? <th>{t.vat}</th> : null}
            <th>{inv.vatPayer ? t.base : t.total}</th>
            {inv.vatPayer ? <th>{t.totalVat}</th> : null}
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it) => {
            const c = calcLine(it, inv.vatPayer);
            return (
              <tr key={it.id}>
                <td className="iv-l iv-pre"><Ph text={it.desc} ph={t.placeholders.item} /></td>
                <td>{plainNumber(it.qty, inv.lang, Number.isInteger(it.qty) ? 0 : 2)} {it.unit}</td>
                <td>{cur(it.price)}</td>
                <td>{it.discount > 0 ? (it.discType === "pct" ? `${plainNumber(it.discount, inv.lang, Number.isInteger(it.discount) ? 0 : 2)} %` : cur(c.discountAmt)) : "—"}</td>
                {inv.vatPayer ? <td>{plainNumber(c.rate, inv.lang, 0)} %</td> : null}
                <td>{cur(c.net)}</td>
                {inv.vatPayer ? <td><strong>{cur(c.total)}</strong></td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="iv-sum-row">
        {inv.vatPayer ? (
          <table className="iv-recap">
            <thead><tr><th className="iv-l" colSpan={4}>{t.recap}</th></tr><tr><th className="iv-l">{t.rate}</th><th>{t.base}</th><th>{t.vat}</th><th>{t.totalVat}</th></tr></thead>
            <tbody>
              {totals.groups.map((g) => (
                <tr key={g.rate}><td className="iv-l">{plainNumber(g.rate, inv.lang, 0)} %</td><td>{cur(g.base)}</td><td>{cur(g.vat)}</td><td>{cur(g.total)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <div />}
        <div className="iv-totals-box">
          {totals.discount > 0 ? <div><span>{t.subtotalDiscount}</span><span>−{cur(totals.discount)}</span></div> : null}
          {totals.rounding !== 0 ? <div><span>{t.rounding}</span><span>{cur(totals.rounding)}</span></div> : null}
          <div className="iv-payable"><span>{t.payable}</span><span>{cur(totals.payable)}</span></div>
        </div>
      </div>

      <div className="iv-pay-row">
        <div className="iv-pay">
          <div className="iv-party-title">{t.payment}</div>
          <table>
            <tbody>{payRows.map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody>
          </table>
        </div>
        {qrUrl ? (
          <div className="iv-qr">
            <img src={qrUrl} alt="QR" width={118} height={118} />
            <span>{t.qr}</span>
          </div>
        ) : null}
      </div>

      {inv.note.trim() ? (
        <div className="iv-note"><div className="iv-party-title">{t.note}</div><div className="iv-pre">{inv.note}</div></div>
      ) : null}
    </div>
  );
}

/** Přizpůsobí A4 list šířce kontejneru (CSS transform), výška se přepočítá podle obsahu. */
export function SheetViewport({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [h, setH] = useState(SHEET_H);

  useEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const measure = () => {
      setScale(Math.min(1, b.clientWidth / SHEET_W));
      setH(i.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="iv-viewport" ref={box} style={{ height: h * scale }}>
      <div className="iv-viewport-inner" ref={inner} style={{ transform: `scale(${scale})`, width: SHEET_W }}>
        {children}
      </div>
    </div>
  );
}
