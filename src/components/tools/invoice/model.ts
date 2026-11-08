// Datový model generátoru faktur: typy, výchozí hodnoty, výpočty, číslování, SPD QR a lokální úložiště.
// Vše běží v prohlížeči; do localStorage se ukládá jen na tomto zařízení.

export type Lang = "cs" | "en";
export const CURRENCIES = ["CZK", "EUR", "USD", "GBP", "PLN", "CHF", "HUF"] as const;
export type Currency = (typeof CURRENCIES)[number];
export type DiscountType = "pct" | "abs";
export type PayMethod = "transfer" | "cash" | "card" | "cod";

export interface Party {
  name: string; street: string; zip: string; city: string; country: string;
  ico: string; dic: string; email: string; phone: string; web: string; note: string;
}
export interface Item {
  id: string; desc: string; qty: number; unit: string; price: number;
  discType: DiscountType; discount: number; vat: number;
}
export interface Payment {
  method: PayMethod; bank: string; account: string; iban: string; bic: string; vs: string; ks: string; ss: string;
}
export interface Series { prefix: string; year: boolean; pad: number; next: number }
export interface Invoice {
  lang: Lang; currency: Currency; vatPayer: boolean;
  series: Series; numberAuto: boolean; number: string;
  issue: string; taxDate: string; dueDays: number;
  supplier: Party; customer: Party; payment: Payment;
  items: Item[]; roundTotal: boolean; note: string; showQr: boolean;
}

// ── Pomocné ────────────────────────────────────────────────────────────────
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
export const uid = (): string => Math.random().toString(36).slice(2, 10);

export const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + Math.round(days));
  return isoDate(d);
}
export function fmtDate(iso: string, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return lang === "cs" ? `${Number(m[3])}. ${Number(m[2])}. ${m[1]}` : `${m[3]}/${m[2]}/${m[1]}`;
}

export function money(n: number, currency: Currency, lang: Lang): string {
  try {
    return new Intl.NumberFormat(lang === "cs" ? "cs-CZ" : "en-GB", { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}
export function plainNumber(n: number, lang: Lang, digits = 2): string {
  return new Intl.NumberFormat(lang === "cs" ? "cs-CZ" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

// ── Výchozí hodnoty ────────────────────────────────────────────────────────
export const emptyParty = (): Party => ({
  name: "", street: "", zip: "", city: "", country: "", ico: "", dic: "", email: "", phone: "", web: "", note: "",
});
export const emptyItem = (): Item => ({ id: uid(), desc: "", qty: 1, unit: "ks", price: 0, discType: "pct", discount: 0, vat: 21 });
export const emptyPayment = (): Payment => ({ method: "transfer", bank: "", account: "", iban: "", bic: "", vs: "", ks: "", ss: "" });

export function defaultInvoice(now = new Date()): Invoice {
  return {
    lang: "cs", currency: "CZK", vatPayer: true,
    series: { prefix: "", year: true, pad: 3, next: 1 }, numberAuto: true, number: "",
    issue: isoDate(now), taxDate: isoDate(now), dueDays: 14,
    supplier: emptyParty(), customer: emptyParty(), payment: emptyPayment(),
    items: [emptyItem()], roundTotal: false, note: "", showQr: true,
  };
}

// ── Číslování ──────────────────────────────────────────────────────────────
export function formatSeriesNumber(s: Series, issue: string): string {
  const year = /^(\d{4})/.exec(issue)?.[1] ?? String(new Date().getFullYear());
  return `${s.prefix}${s.year ? year : ""}${String(Math.max(1, Math.round(s.next))).padStart(Math.max(1, Math.round(s.pad)), "0")}`;
}
export const invoiceNumber = (inv: Invoice): string => (inv.numberAuto ? formatSeriesNumber(inv.series, inv.issue) : inv.number);
export const dueDate = (inv: Invoice): string => addDays(inv.issue, inv.dueDays);
/** Variabilní symbol: zadaný, jinak číslice z čísla faktury (max. 10). */
export function variableSymbol(inv: Invoice): string {
  const own = inv.payment.vs.replace(/\D/g, "");
  return (own || invoiceNumber(inv).replace(/\D/g, "")).slice(0, 10);
}

// ── Výpočty ────────────────────────────────────────────────────────────────
export interface LineCalc { gross: number; discountAmt: number; net: number; rate: number; vat: number; total: number }
export function calcLine(it: Item, vatPayer: boolean): LineCalc {
  const gross = round2(Math.max(0, it.qty) * Math.max(0, it.price));
  const raw = it.discType === "pct" ? (gross * Math.min(100, Math.max(0, it.discount))) / 100 : Math.max(0, it.discount);
  const discountAmt = round2(Math.min(gross, raw));
  const net = round2(gross - discountAmt);
  const rate = vatPayer ? Math.max(0, it.vat) : 0;
  const vat = round2((net * rate) / 100);
  return { gross, discountAmt, net, rate, vat, total: round2(net + vat) };
}
export interface VatGroup { rate: number; base: number; vat: number; total: number }
export interface Totals {
  lines: LineCalc[]; groups: VatGroup[]; base: number; vat: number; discount: number; total: number; rounding: number; payable: number;
}
export function calcTotals(inv: Invoice): Totals {
  const lines = inv.items.map((it) => calcLine(it, inv.vatPayer));
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.rate, round2((byRate.get(l.rate) ?? 0) + l.net));
  const groups: VatGroup[] = [...byRate.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, base]) => {
      const vat = round2((base * rate) / 100);
      return { rate, base, vat, total: round2(base + vat) };
    });
  const base = round2(groups.reduce((s, g) => s + g.base, 0));
  const vat = round2(groups.reduce((s, g) => s + g.vat, 0));
  const total = round2(base + vat);
  const payable = inv.roundTotal ? Math.round(total) : total;
  return { lines, groups, base, vat, discount: round2(lines.reduce((s, l) => s + l.discountAmt, 0)), total, rounding: round2(payable - total), payable };
}

// ── QR platba (SPD 1.0) ────────────────────────────────────────────────────
const ascii = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "").replace(/\*/g, " ").toUpperCase();
export const cleanIban = (s: string): string => s.replace(/\s+/g, "").toUpperCase();
export const validIban = (s: string): boolean => /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(cleanIban(s));

/** Řetězec pro QR platbu; null, pokud chybí platný IBAN nebo platba není převodem. */
export function spdString(inv: Invoice, totals: Totals): string | null {
  const p = inv.payment;
  if (p.method !== "transfer" || !validIban(p.iban) || totals.payable <= 0) return null;
  const parts = [`SPD*1.0`, `ACC:${cleanIban(p.iban)}${p.bic.trim() ? `+${ascii(p.bic).replace(/\s/g, "")}` : ""}`, `AM:${totals.payable.toFixed(2)}`, `CC:${inv.currency}`];
  const vs = variableSymbol(inv);
  if (vs) parts.push(`X-VS:${vs}`);
  const ks = p.ks.replace(/\D/g, "").slice(0, 10);
  if (ks) parts.push(`X-KS:${ks}`);
  const ss = p.ss.replace(/\D/g, "").slice(0, 10);
  if (ss) parts.push(`X-SS:${ss}`);
  const dt = dueDate(inv).replace(/-/g, "");
  if (/^\d{8}$/.test(dt)) parts.push(`DT:${dt}`);
  if (inv.supplier.name.trim()) parts.push(`RN:${ascii(inv.supplier.name).slice(0, 35).trim()}`);
  parts.push(`MSG:${ascii(`FAKTURA ${invoiceNumber(inv)}`).slice(0, 60).trim()}`);
  return parts.join("*");
}

// ── Lokální úložiště ───────────────────────────────────────────────────────
const DRAFT_KEY = "vv.invoice.draft.v1";
const TPL_KEY = "vv.invoice.templates.v1";

export function mergeParty(raw: unknown): Party {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const e = emptyParty();
  return Object.fromEntries(Object.keys(e).map((k) => [k, str(o[k])])) as unknown as Party;
}
function mergePayment(raw: unknown): Payment {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const e = emptyPayment();
  const method = (["transfer", "cash", "card", "cod"] as const).find((m) => m === o.method) ?? e.method;
  return { ...(Object.fromEntries(Object.keys(e).map((k) => [k, str(o[k])])) as unknown as Payment), method };
}
/** Bezpečně doplní chybějící pole (starý koncept, import JSON, ruční úpravy). */
export function mergeInvoice(raw: unknown): Invoice {
  const d = defaultInvoice();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;
  const s = (o.series && typeof o.series === "object" ? o.series : {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? o.items : [];
  return {
    lang: o.lang === "en" ? "en" : "cs",
    currency: (CURRENCIES as readonly string[]).includes(o.currency as string) ? (o.currency as Currency) : d.currency,
    vatPayer: o.vatPayer !== false,
    series: { prefix: str(s.prefix).slice(0, 12), year: s.year !== false, pad: Math.min(8, Math.max(1, num(s.pad, d.series.pad))), next: Math.max(1, Math.round(num(s.next, 1))) },
    numberAuto: o.numberAuto !== false,
    number: str(o.number),
    issue: /^\d{4}-\d{2}-\d{2}$/.test(str(o.issue)) ? str(o.issue) : d.issue,
    taxDate: /^\d{4}-\d{2}-\d{2}$/.test(str(o.taxDate)) ? str(o.taxDate) : d.taxDate,
    dueDays: Math.min(365, Math.max(0, Math.round(num(o.dueDays, 14)))),
    supplier: mergeParty(o.supplier), customer: mergeParty(o.customer), payment: mergePayment(o.payment),
    items: items.length
      ? items.slice(0, 200).map((r) => {
          const i = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
          return {
            id: str(i.id) || uid(), desc: str(i.desc), qty: Math.max(0, num(i.qty, 1)), unit: str(i.unit, "ks"), price: Math.max(0, num(i.price)),
            discType: i.discType === "abs" ? "abs" : "pct", discount: Math.max(0, num(i.discount)), vat: Math.min(100, Math.max(0, num(i.vat, 21))),
          } satisfies Item;
        })
      : d.items,
    roundTotal: o.roundTotal === true, note: str(o.note), showQr: o.showQr !== false,
  };
}

export function loadDraft(): Invoice | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? mergeInvoice(JSON.parse(raw)) : null;
  } catch { return null; }
}
export function saveDraft(inv: Invoice): void {
  try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(inv)); } catch { /* plné úložiště / soukromé okno */ }
}
export function clearDraft(): void {
  try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* nic */ }
}

export interface PartyTemplate { id: string; label: string; party: Party; vatPayer?: boolean; payment?: Payment }
export interface Templates { suppliers: PartyTemplate[]; customers: PartyTemplate[] }
export function loadTemplates(): Templates {
  try {
    const o = JSON.parse(window.localStorage.getItem(TPL_KEY) ?? "null") as Partial<Record<keyof Templates, unknown[]>> | null;
    const list = (v: unknown[] | undefined): PartyTemplate[] =>
      (Array.isArray(v) ? v : []).slice(0, 100).map((r) => {
        const t = (r && typeof r === "object" ? r : {}) as Record<string, unknown>;
        return { id: str(t.id) || uid(), label: str(t.label) || "Šablona", party: mergeParty(t.party), vatPayer: t.vatPayer === undefined ? undefined : t.vatPayer !== false, payment: t.payment ? mergePayment(t.payment) : undefined };
      });
    return { suppliers: list(o?.suppliers), customers: list(o?.customers) };
  } catch { return { suppliers: [], customers: [] }; }
}
export function saveTemplates(t: Templates): void {
  try { window.localStorage.setItem(TPL_KEY, JSON.stringify(t)); } catch { /* nic */ }
}

// ── Popisky dokladu ────────────────────────────────────────────────────────
export const L = {
  cs: {
    invoice: "Faktura", taxInvoice: "Faktura – daňový doklad", number: "Číslo", issue: "Datum vystavení", taxDate: "Datum zdan. plnění", due: "Splatnost",
    supplier: "Dodavatel", customer: "Odběratel", ico: "IČO", dic: "DIČ", nonPayer: "Nejsem plátce DPH.",
    desc: "Popis", qty: "Množství", unitPrice: "Cena/j.", discount: "Sleva", vat: "DPH", base: "Základ", total: "Celkem", totalVat: "S DPH",
    recap: "Rekapitulace DPH", rate: "Sazba", rounding: "Zaokrouhlení", subtotalDiscount: "Slevy celkem", payable: "Celkem k úhradě",
    payment: "Platební údaje", method: "Způsob úhrady", bank: "Banka", account: "Číslo účtu", iban: "IBAN", bic: "BIC/SWIFT", vs: "Variabilní symbol", ks: "Konstantní symbol", ss: "Specifický symbol",
    qr: "QR platba", note: "Poznámka", page: "Strana", of: "z",
    methods: { transfer: "Bankovní převod", cash: "Hotově", card: "Kartou", cod: "Dobírka" },
    placeholders: { supplier: "Název dodavatele", customer: "Název odběratele", item: "Popis položky" },
  },
  en: {
    invoice: "Invoice", taxInvoice: "Invoice – tax document", number: "No.", issue: "Issue date", taxDate: "Taxable supply date", due: "Due date",
    supplier: "Supplier", customer: "Customer", ico: "Company ID", dic: "VAT ID", nonPayer: "Not a VAT payer.",
    desc: "Description", qty: "Qty", unitPrice: "Unit price", discount: "Discount", vat: "VAT", base: "Net", total: "Total", totalVat: "Gross",
    recap: "VAT summary", rate: "Rate", rounding: "Rounding", subtotalDiscount: "Total discounts", payable: "Amount due",
    payment: "Payment details", method: "Payment method", bank: "Bank", account: "Account no.", iban: "IBAN", bic: "BIC/SWIFT", vs: "Variable symbol", ks: "Constant symbol", ss: "Specific symbol",
    qr: "QR payment", note: "Note", page: "Page", of: "of",
    methods: { transfer: "Bank transfer", cash: "Cash", card: "Card", cod: "Cash on delivery" },
    placeholders: { supplier: "Supplier name", customer: "Customer name", item: "Item description" },
  },
} as const;
export type Labels = (typeof L)[Lang];

/** Řádky adresy bez prázdných hodnot. */
export function addressLines(p: Party): string[] {
  const cityLine = [p.zip, p.city].filter(Boolean).join(" ");
  return [p.street, cityLine, p.country].map((s) => s.trim()).filter(Boolean);
}
export function contactLines(p: Party): string[] {
  return [p.email, p.phone, p.web].map((s) => s.trim()).filter(Boolean);
}
