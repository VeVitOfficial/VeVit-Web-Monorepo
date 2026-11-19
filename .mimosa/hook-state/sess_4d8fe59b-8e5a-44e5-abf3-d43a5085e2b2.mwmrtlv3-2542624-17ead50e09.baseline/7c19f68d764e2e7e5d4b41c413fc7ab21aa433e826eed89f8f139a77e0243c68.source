"use client";

// Generátor faktur: vlevo formulář, vpravo živý náhled A4. Vše se počítá a ukládá lokálně v prohlížeči
// (koncept v localStorage, export PDF přes pdf-lib, QR platba SPD). Na server se nic neodesílá.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { Icon, toastSuccess, useToolState } from "@/components/tools/tool-runtime";
import {
  COLOR_PRESETS, CURRENCIES, calcLine, calcTotals, clearDraft, defaultInvoice, dueDate, emptyItem, fmtDate, formatSeriesNumber, invoiceNumber, loadDraft, loadTemplates,
  mergeInvoice, mergeParty, money, saveDraft, saveTemplates, spdString, uid, validIban, variableSymbol,
  type DiscountType, type Invoice, type Item, type Party, type PartyTemplate, type PayMethod, type Templates,
} from "@/components/tools/invoice/model";
import { InvoiceSheet, SheetViewport } from "@/components/tools/invoice/sheet";
import { buildInvoicePdf } from "@/components/tools/invoice/pdf";
import { dataUrlToBytes, qrPngDataUrl } from "@/components/tools/invoice/qr";

// ── Drobné vstupy ──────────────────────────────────────────────────────────
function Field({ id, label, children, hint, wide }: { id: string; label: string; children: React.ReactNode; hint?: string; wide?: boolean }) {
  return (
    <div className={`iv-field${wide ? " iv-wide" : ""}`}>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {hint ? <span className="iv-hint">{hint}</span> : null}
    </div>
  );
}
function Text({ id, label, value, onChange, placeholder, wide, hint, inputMode }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; wide?: boolean; hint?: string; inputMode?: "numeric" | "email" | "tel" | "url" | "text";
}) {
  return (
    <Field id={id} label={label} wide={wide} hint={hint}>
      <input id={id} className="input" type="text" inputMode={inputMode} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
    </Field>
  );
}
function Num({ id, label, value, onChange, min = 0, max, step = "any", wide }: {
  id: string; label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number | "any"; wide?: boolean;
}) {
  return (
    <Field id={id} label={label} wide={wide}>
      <input id={id} className="input" type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0}
        onChange={(e) => { const n = parseFloat(e.target.value); onChange(Number.isFinite(n) ? Math.min(max ?? Infinity, Math.max(min, n)) : 0); }} />
    </Field>
  );
}
function Card({ title, tone, children, actions }: { title: string; tone: "inv" | "sup" | "cus" | "items" | "pay" | "misc"; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className={`iv-card iv-card--${tone}`} aria-label={title}>
      <header className="iv-card-head"><h3>{title}</h3>{actions}</header>
      <div className="iv-card-body">{children}</div>
    </section>
  );
}

// ── Sekce dodavatel / odběratel (s uloženými šablonami) ────────────────────
function PartyForm({ prefix, party, onChange, templates, onSaveTemplate, onLoadTemplate, onDeleteTemplate, showDic }: {
  prefix: string; party: Party; onChange: (p: Party) => void; templates: PartyTemplate[];
  onSaveTemplate: () => void; onLoadTemplate: (t: PartyTemplate) => void; onDeleteTemplate: (id: string) => void; showDic: boolean;
}) {
  const set = (k: keyof Party) => (v: string) => onChange({ ...party, [k]: v });
  const [pick, setPick] = useState("");
  return (
    <>
      <div className="iv-tpl">
        <select className="select" aria-label="Načíst uloženou šablonu" value={pick}
          onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); setPick(e.target.value); if (t) onLoadTemplate(t); }}>
          <option value="">Načíst uloženou šablonu…</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSaveTemplate} title="Uloží údaje jen v tomto prohlížeči">Uložit jako šablonu</button>
        {pick ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => { onDeleteTemplate(pick); setPick(""); }} aria-label="Smazat vybranou šablonu"><Icon name="X" size={14} /></button> : null}
      </div>
      <div className="iv-grid">
        <Text id={`${prefix}-name`} label="Název / jméno" value={party.name} onChange={set("name")} wide />
        <Text id={`${prefix}-street`} label="Ulice a č.p." value={party.street} onChange={set("street")} wide />
        <Text id={`${prefix}-zip`} label="PSČ" value={party.zip} onChange={set("zip")} />
        <Text id={`${prefix}-city`} label="Město" value={party.city} onChange={set("city")} />
        <Text id={`${prefix}-country`} label="Země" value={party.country} onChange={set("country")} wide />
        <Text id={`${prefix}-ico`} label="IČO" value={party.ico} onChange={set("ico")} inputMode="numeric" />
        {showDic ? <Text id={`${prefix}-dic`} label="DIČ" value={party.dic} onChange={set("dic")} /> : null}
        <Text id={`${prefix}-email`} label="E-mail" value={party.email} onChange={set("email")} inputMode="email" />
        <Text id={`${prefix}-phone`} label="Telefon" value={party.phone} onChange={set("phone")} inputMode="tel" />
        <Text id={`${prefix}-web`} label="Web" value={party.web} onChange={set("web")} inputMode="url" wide />
        <Field id={`${prefix}-note`} label="Doplňující údaje (např. zápis v rejstříku)" wide>
          <textarea id={`${prefix}-note`} className="textarea" rows={2} value={party.note} onChange={(e) => set("note")(e.target.value)} />
        </Field>
      </div>
    </>
  );
}

// ── Položka ────────────────────────────────────────────────────────────────
function ItemEditor({ idx, item, inv, onChange, onRemove, canRemove }: {
  idx: number; item: Item; inv: Invoice; onChange: (patch: Partial<Item>) => void; onRemove: () => void; canRemove: boolean;
}) {
  const c = calcLine(item, inv.vatPayer);
  const cur = (n: number) => money(n, inv.currency, inv.lang);
  const id = `iv-it-${item.id}`;
  return (
    <div className="iv-item">
      <div className="iv-item-head">
        <span className="iv-item-no">{idx + 1}</span>
        <input id={`${id}-desc`} className="input" type="text" value={item.desc} placeholder="Popis položky" aria-label={`Popis položky ${idx + 1}`} onChange={(e) => onChange({ desc: e.target.value })} />
        <button type="button" className="btn btn-ghost btn-icon-sm" disabled={!canRemove} aria-label={`Odebrat položku ${idx + 1}`} onClick={onRemove}><Icon name="X" size={16} /></button>
      </div>
      <div className="iv-item-grid">
        <Num id={`${id}-qty`} label="Množství" value={item.qty} onChange={(n) => onChange({ qty: n })} />
        <Text id={`${id}-unit`} label="Jednotka" value={item.unit} onChange={(v) => onChange({ unit: v })} />
        <Num id={`${id}-price`} label={`Cena/j. (${inv.currency})`} value={item.price} onChange={(n) => onChange({ price: n })} />
        <div className="iv-field">
          <label className="field-label" htmlFor={`${id}-disc`}>Sleva</label>
          <div className="iv-disc">
            <input id={`${id}-disc`} className="input" type="number" inputMode="decimal" min={0} step="any" value={item.discount}
              onChange={(e) => { const n = parseFloat(e.target.value); onChange({ discount: Number.isFinite(n) ? Math.max(0, n) : 0 }); }} />
            <select className="select" aria-label="Typ slevy" value={item.discType} onChange={(e) => onChange({ discType: e.target.value as DiscountType })}>
              <option value="pct">%</option>
              <option value="abs">{inv.currency}</option>
            </select>
          </div>
        </div>
        {inv.vatPayer ? (
          <Field id={`${id}-vat`} label="DPH (%)">
            <input id={`${id}-vat`} className="input" type="number" inputMode="decimal" min={0} max={100} step="any" list="iv-vat-rates" value={item.vat}
              onChange={(e) => { const n = parseFloat(e.target.value); onChange({ vat: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0 }); }} />
          </Field>
        ) : null}
      </div>
      <div className="iv-item-sum" aria-live="polite">
        {c.discountAmt > 0 ? <span>Sleva −{cur(c.discountAmt)}</span> : null}
        <span>Základ {cur(c.net)}</span>
        {inv.vatPayer ? <span>DPH {cur(c.vat)}</span> : null}
        <strong>Celkem {cur(c.total)}</strong>
      </div>
    </div>
  );
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const safeName = (s: string) => s.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "faktura";

// ── Editor ─────────────────────────────────────────────────────────────────
function Editor({ initial, initialTemplates, restored }: { initial: Invoice; initialTemplates: Templates; restored: boolean }) {
  const { setState: setToolState, rootRef } = useToolState("ready");
  const [inv, setInv] = useState<Invoice>(initial);
  const [templates, setTemplates] = useState<Templates>(initialTemplates);
  const [busy, setBusy] = useState<"" | "pdf">("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [qr, setQr] = useState<{ text: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);

  const totals = useMemo(() => calcTotals(inv), [inv]);
  const number = invoiceNumber(inv);
  const spd = useMemo(() => spdString(inv, totals), [inv, totals]);

  // QR pro náhled (jen když je zapnutý a máme platný IBAN)
  useEffect(() => {
    if (!spd || !inv.showQr) return;
    let alive = true;
    void qrPngDataUrl(spd, 6, 2).then((url) => { if (alive && url) setQr({ text: spd, url }); });
    return () => { alive = false; };
  }, [spd, inv.showQr]);
  const qrUrl = spd && inv.showQr && qr?.text === spd ? qr.url : null;

  // Autosave konceptu
  useEffect(() => {
    const h = window.setTimeout(() => { saveDraft(inv); setSavedAt(new Date()); }, 400);
    return () => window.clearTimeout(h);
  }, [inv]);

  const patch = useCallback((p: Partial<Invoice>) => setInv((v) => ({ ...v, ...p })), []);
  const patchItem = (id: string, p: Partial<Item>) => setInv((v) => ({ ...v, items: v.items.map((it) => (it.id === id ? { ...it, ...p } : it)) }));
  const patchPay = (p: Partial<Invoice["payment"]>) => setInv((v) => ({ ...v, payment: { ...v.payment, ...p } }));
  const patchSeries = (p: Partial<Invoice["series"]>) => setInv((v) => ({ ...v, series: { ...v.series, ...p } }));

  // Šablony
  const updateTemplates = (next: Templates) => { setTemplates(next); saveTemplates(next); };
  const saveParty = (kind: "suppliers" | "customers") => {
    const party = kind === "suppliers" ? inv.supplier : inv.customer;
    const label = party.name.trim();
    if (!label) { setError("Před uložením šablony vyplňte název."); return; }
    setError("");
    const entry: PartyTemplate = { id: uid(), label, party, ...(kind === "suppliers" ? { vatPayer: inv.vatPayer, payment: inv.payment } : {}) };
    const rest = templates[kind].filter((t) => t.label.toLowerCase() !== label.toLowerCase());
    updateTemplates({ ...templates, [kind]: [...rest, entry].sort((a, b) => a.label.localeCompare(b.label, "cs")) });
    toastSuccess("Šablona uložena v tomto prohlížeči");
  };
  const deleteParty = (kind: "suppliers" | "customers", id: string) => updateTemplates({ ...templates, [kind]: templates[kind].filter((t) => t.id !== id) });

  // Akce
  const exportPdf = async () => {
    setError(""); setBusy("pdf"); setToolState("processing");
    try {
      const png = qrUrl ? dataUrlToBytes(qrUrl) : null;
      const bytes = await buildInvoicePdf(inv, totals, png);
      download(new Blob([bytes as BlobPart], { type: "application/pdf" }), `faktura-${safeName(number)}.pdf`);
      setToolState("success"); toastSuccess("PDF faktury staženo");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Export PDF se nepodařil.";
      setError(m); setToolState("error");
    } finally { setBusy(""); }
  };
  const printInvoice = () => {
    const sheet = sheetRef.current?.querySelector(".iv-sheet");
    if (!sheet) return;
    const root = document.createElement("div");
    root.id = "iv-print-root";
    root.appendChild(sheet.cloneNode(true));
    document.body.appendChild(root);
    document.body.classList.add("iv-printing");
    const cleanup = () => { document.body.classList.remove("iv-printing"); root.remove(); window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };
  const exportQr = async () => {
    setError("");
    if (!spd) { setError("QR platbu nelze vytvořit: vyplňte platný IBAN, způsob úhrady „Bankovní převod“ a nenulovou částku."); return; }
    const url = await qrPngDataUrl(spd, 10, 4);
    if (!url) { setError("QR kód se nepodařilo vytvořit."); return; }
    download(new Blob([dataUrlToBytes(url) as BlobPart], { type: "image/png" }), `qr-platba-${safeName(number)}.png`);
  };
  const exportJson = () => {
    const data = { app: "vevit-invoice", version: 1, invoice: inv };
    download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `faktura-${safeName(number)}.json`);
  };
  const importJson = async (file: File) => {
    setError("");
    try {
      const data = JSON.parse(await file.text()) as { invoice?: unknown };
      setInv(mergeInvoice(data.invoice ?? data));
      toastSuccess("Faktura načtena ze souboru");
    } catch { setError("Soubor se nepodařilo načíst, očekávám JSON exportovaný z tohoto nástroje."); }
  };
  const newInvoice = () => {
    if (!window.confirm("Založit novou fakturu s dalším číslem? Odběratel a položky se vymažou, údaje dodavatele a platby zůstanou.")) return;
    const fresh = defaultInvoice();
    setInv((v) => ({
      ...v, series: { ...v.series, next: v.numberAuto ? v.series.next + 1 : v.series.next }, number: "",
      issue: fresh.issue, taxDate: fresh.taxDate, customer: mergeParty(null), items: [emptyItem()], note: "",
      payment: { ...v.payment, vs: "" },
    }));
  };
  const resetAll = () => {
    if (!window.confirm("Smazat celý koncept i uložené šablony z tohoto prohlížeče?")) return;
    clearDraft(); updateTemplates({ suppliers: [], customers: [] }); setInv(defaultInvoice());
  };

  const addItem = () => setInv((v) => ({ ...v, items: [...v.items, { ...emptyItem(), vat: v.items[v.items.length - 1]?.vat ?? 21 }] }));
  const ibanBad = inv.payment.method === "transfer" && inv.payment.iban.trim() !== "" && !validIban(inv.payment.iban);
  const cur = (n: number) => money(n, inv.currency, inv.lang);

  return (
    <div className="iv-layout">
      <datalist id="iv-vat-rates"><option value="21" /><option value="12" /><option value="0" /></datalist>

      <div className="iv-form">
        {restored ? <p className="iv-restored" role="status">Obnoven rozpracovaný koncept z tohoto prohlížeče.</p> : null}

        <Card title="Faktura" tone="inv">
          <div className="iv-grid">
            <Field id="iv-lang" label="Jazyk dokladu">
              <select id="iv-lang" className="select" value={inv.lang} onChange={(e) => patch({ lang: e.target.value as Invoice["lang"] })}>
                <option value="cs">Česky</option><option value="en">English</option>
              </select>
            </Field>
            <Field id="iv-cur" label="Měna">
              <select id="iv-cur" className="select" value={inv.currency} onChange={(e) => patch({ currency: e.target.value as Invoice["currency"] })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id="iv-color" label="Hlavní barva dokladu" wide>
              <div className="iv-colors">
                {COLOR_PRESETS.map((c) => (
                  <button key={c.value} type="button" className="iv-swatch" style={{ background: c.value }} title={c.label} aria-label={c.label}
                    aria-pressed={inv.color === c.value} onClick={() => patch({ color: c.value })} />
                ))}
                <input id="iv-color" type="color" className="iv-color-input" value={inv.color} aria-label="Vlastní barva" onChange={(e) => patch({ color: e.target.value })} />
              </div>
            </Field>
            <label className="iv-check iv-wide">
              <input id="iv-vatpayer" type="checkbox" checked={inv.vatPayer} onChange={(e) => patch({ vatPayer: e.target.checked })} />
              <span>Dodavatel je plátce DPH</span>
            </label>
            {!inv.vatPayer ? <p className="iv-hint iv-wide">Na dokladu se uvede „Nejsem plátce DPH“ a DPH se nepočítá.</p> : null}

            <Text id="iv-prefix" label="Řada (předpona)" value={inv.series.prefix} onChange={(v) => patchSeries({ prefix: v.slice(0, 12) })} placeholder="např. FV" />
            <Num id="iv-next" label="Pořadové číslo" value={inv.series.next} min={1} step={1} onChange={(n) => patchSeries({ next: Math.max(1, Math.round(n)) })} />
            <Num id="iv-pad" label="Počet číslic" value={inv.series.pad} min={1} max={8} step={1} onChange={(n) => patchSeries({ pad: Math.min(8, Math.max(1, Math.round(n))) })} />
            <label className="iv-check">
              <input id="iv-year" type="checkbox" checked={inv.series.year} onChange={(e) => patchSeries({ year: e.target.checked })} />
              <span>Rok v čísle</span>
            </label>
            <label className="iv-check iv-wide">
              <input id="iv-auto" type="checkbox" checked={inv.numberAuto} onChange={(e) => patch({ numberAuto: e.target.checked, number: e.target.checked ? inv.number : number })} />
              <span>Číslovat automaticky ({formatSeriesNumber(inv.series, inv.issue)})</span>
            </label>
            {!inv.numberAuto ? <Text id="iv-number" label="Číslo faktury" value={inv.number} onChange={(v) => patch({ number: v })} wide /> : null}

            <Field id="iv-issue" label="Datum vystavení">
              <input id="iv-issue" className="input" type="date" value={inv.issue} onChange={(e) => patch({ issue: e.target.value || inv.issue })} />
            </Field>
            {inv.vatPayer ? (
              <Field id="iv-tax" label="Datum zdan. plnění">
                <input id="iv-tax" className="input" type="date" value={inv.taxDate} onChange={(e) => patch({ taxDate: e.target.value || inv.taxDate })} />
              </Field>
            ) : null}
            <Num id="iv-days" label="Splatnost (dnů)" value={inv.dueDays} min={0} max={365} step={1} onChange={(n) => patch({ dueDays: Math.round(n) })} />
            <Field id="iv-due" label="Datum splatnosti"><output id="iv-due" className="iv-output">{fmtDate(dueDate(inv), inv.lang)}</output></Field>
          </div>
        </Card>

        <Card title="Dodavatel" tone="sup">
          <PartyForm prefix="iv-sup" party={inv.supplier} onChange={(p) => patch({ supplier: p })} templates={templates.suppliers} showDic={inv.vatPayer}
            onSaveTemplate={() => saveParty("suppliers")} onDeleteTemplate={(id) => deleteParty("suppliers", id)}
            onLoadTemplate={(t) => setInv((v) => ({ ...v, supplier: t.party, vatPayer: t.vatPayer ?? v.vatPayer, payment: t.payment ?? v.payment }))} />
        </Card>

        <Card title="Odběratel" tone="cus">
          <PartyForm prefix="iv-cus" party={inv.customer} onChange={(p) => patch({ customer: p })} templates={templates.customers} showDic
            onSaveTemplate={() => saveParty("customers")} onDeleteTemplate={(id) => deleteParty("customers", id)}
            onLoadTemplate={(t) => patch({ customer: t.party })} />
        </Card>

        <Card title="Položky" tone="items" actions={<button className="btn btn-ghost btn-sm" id="iv-add-row" type="button" onClick={addItem}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /><path d="M12 5v14" /></svg> Přidat položku</button>}>
          <div className="iv-item-list" id="iv-rows">
            {inv.items.map((it, i) => (
              <ItemEditor key={it.id} idx={i} item={it} inv={inv} canRemove={inv.items.length > 1}
                onChange={(p) => patchItem(it.id, p)} onRemove={() => setInv((v) => ({ ...v, items: v.items.filter((x) => x.id !== it.id) }))} />
            ))}
          </div>
          <div className="iv-totals" aria-live="polite">
            {totals.discount > 0 ? <div><span>Slevy celkem</span><span>−{cur(totals.discount)}</span></div> : null}
            <div><span>{inv.vatPayer ? "Základ celkem" : "Mezisoučet"}</span><span>{cur(totals.base)}</span></div>
            {inv.vatPayer ? totals.groups.map((g) => <div key={g.rate}><span>DPH {g.rate} % ze {cur(g.base)}</span><span>{cur(g.vat)}</span></div>) : null}
            {totals.rounding !== 0 ? <div><span>Zaokrouhlení</span><span>{cur(totals.rounding)}</span></div> : null}
            <div className="iv-total"><span>Celkem k úhradě</span><span>{cur(totals.payable)}</span></div>
          </div>
          <label className="iv-check">
            <input id="iv-round" type="checkbox" checked={inv.roundTotal} onChange={(e) => patch({ roundTotal: e.target.checked })} />
            <span>Zaokrouhlit celkovou částku na celé jednotky</span>
          </label>
        </Card>

        <Card title="Platba" tone="pay">
          <div className="iv-grid">
            <Field id="iv-method" label="Způsob úhrady" wide>
              <select id="iv-method" className="select" value={inv.payment.method} onChange={(e) => patchPay({ method: e.target.value as PayMethod })}>
                <option value="transfer">Bankovní převod</option><option value="cash">Hotově</option><option value="card">Kartou</option><option value="cod">Dobírka</option>
              </select>
            </Field>
            {inv.payment.method === "transfer" ? (
              <>
                <Text id="iv-bank" label="Banka" value={inv.payment.bank} onChange={(v) => patchPay({ bank: v })} wide />
                <Text id="iv-account" label="Číslo účtu" value={inv.payment.account} onChange={(v) => patchPay({ account: v })} placeholder="123456789/0800" />
                <Text id="iv-bic" label="BIC / SWIFT" value={inv.payment.bic} onChange={(v) => patchPay({ bic: v })} />
                <Field id="iv-iban" label="IBAN" wide hint={ibanBad ? undefined : "Pro QR platbu je potřeba platný IBAN."}>
                  <input id="iv-iban" className="input" type="text" value={inv.payment.iban} placeholder="CZ65 0800 0000 1920 0014 5399" aria-invalid={ibanBad} onChange={(e) => patchPay({ iban: e.target.value })} autoComplete="off" />
                  {ibanBad ? <span className="iv-hint iv-hint--err">IBAN nemá platný tvar.</span> : null}
                </Field>
              </>
            ) : null}
            <Text id="iv-vs" label="Variabilní symbol" value={inv.payment.vs} onChange={(v) => patchPay({ vs: v.replace(/\D/g, "").slice(0, 10) })} placeholder={variableSymbol({ ...inv, payment: { ...inv.payment, vs: "" } })} inputMode="numeric" hint="Prázdný = číslo faktury" />
            {inv.payment.method === "transfer" ? (
              <>
                <Text id="iv-ks" label="Konstantní symbol" value={inv.payment.ks} onChange={(v) => patchPay({ ks: v.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" />
                <Text id="iv-ss" label="Specifický symbol" value={inv.payment.ss} onChange={(v) => patchPay({ ss: v.replace(/\D/g, "").slice(0, 10) })} inputMode="numeric" />
              </>
            ) : null}
            <label className="iv-check iv-wide">
              <input id="iv-qr" type="checkbox" checked={inv.showQr} onChange={(e) => patch({ showQr: e.target.checked })} />
              <span>Zobrazit QR platbu na faktuře</span>
            </label>
          </div>
        </Card>

        <Card title="Poznámka" tone="misc">
          <textarea id="iv-note" className="textarea" rows={3} value={inv.note} placeholder="Např. Děkujeme za spolupráci." onChange={(e) => patch({ note: e.target.value })} aria-label="Poznámka na faktuře" />
        </Card>

        <div className="iv-data-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={newInvoice}>Nová faktura (další číslo)</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Načíst z JSON</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetAll}>Smazat uložená data</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f); e.target.value = ""; }} />
        </div>
      </div>

      <aside className="iv-preview" aria-label="Náhled faktury">
        <div className="iv-actions">
          <button className="btn btn-primary btn-touch" id="iv-run" type="button" disabled={busy !== ""} onClick={exportPdf}>
            <Icon name="Download" size={16} /> {busy ? "Připravuji PDF…" : "Stáhnout PDF"}
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={printInvoice}>Tisk</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={exportQr} disabled={!spd} title={spd ? "" : "Vyplňte platný IBAN"}>QR (PNG)</button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={exportJson}>JSON</button>
        </div>
        {error ? <p className="error-text" role="alert">{error}</p> : null}
        <div ref={sheetRef}>
          <SheetViewport><InvoiceSheet inv={inv} totals={totals} qrUrl={qrUrl} /></SheetViewport>
        </div>
        <p className="iv-saved" role="status">{savedAt ? `Koncept uložen v tomto prohlížeči (${savedAt.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}).` : "Koncept se ukládá automaticky v tomto prohlížeči."}</p>
        <div className="privacy-note">Faktura se počítá a vykresluje lokálně v prohlížeči. Údaje se neodesílají na server, koncept i šablony zůstávají jen v úložišti tohoto zařízení.</div>
      </aside>
    </div>
  );
}

export default function InvoiceGen({ locale }: ToolComponentProps) {
  void locale;
  const [boot, setBoot] = useState<{ inv: Invoice; tpl: Templates; restored: boolean } | null>(null);
  useEffect(() => {
    // localStorage čteme až v prohlížeči (SSR nezná koncept ani dnešní datum)
    Promise.resolve().then(() => {
      const draft = loadDraft();
      setBoot({ inv: draft ?? defaultInvoice(), tpl: loadTemplates(), restored: draft !== null });
    });
  }, []);
  if (!boot) return <p className="muted" role="status">Načítám editor faktury…</p>;
  return <Editor initial={boot.inv} initialTemplates={boot.tpl} restored={boot.restored} />;
}
