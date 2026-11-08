import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcTotals, DEFAULT_COLOR, defaultInvoice, inkColor, normalizeColor, onColor, emptyItem, formatSeriesNumber, invoiceNumber, mergeInvoice, spdString, validIban, variableSymbol,
} from "../../src/components/tools/invoice/model.ts";

const item = (o) => ({ ...emptyItem(), ...o });
const base = () => ({ ...defaultInvoice(new Date("2026-03-05T10:00:00")), items: [] });

test("DPH se počítá po sazbách a sleva v % i pevná částka se odečte před DPH", () => {
  const inv = base();
  inv.items = [
    item({ qty: 4, price: 2500, discType: "pct", discount: 10, vat: 21 }),
    item({ qty: 1, price: 1200, discType: "abs", discount: 200, vat: 12 }),
    item({ qty: 2, price: 100, vat: 21 }),
  ];
  const t = calcTotals(inv);
  assert.deepEqual(t.groups.map((g) => [g.rate, g.base, g.vat]), [[21, 9200, 1932], [12, 1000, 120]]);
  assert.equal(t.discount, 1200);
  assert.equal(t.total, 12252);
});

test("neplátce DPH: sazby se ignorují", () => {
  const inv = { ...base(), vatPayer: false, items: [item({ qty: 3, price: 99.5, vat: 21 })] };
  const t = calcTotals(inv);
  assert.equal(t.vat, 0);
  assert.equal(t.total, 298.5);
});

test("sleva nikdy nepřesáhne cenu položky", () => {
  const inv = { ...base(), items: [item({ qty: 1, price: 50, discType: "abs", discount: 500 })] };
  assert.equal(calcTotals(inv).total, 0);
});

test("zaokrouhlení celkové částky", () => {
  const inv = { ...base(), roundTotal: true, vatPayer: false, items: [item({ qty: 1, price: 100.4 })] };
  const t = calcTotals(inv);
  assert.equal(t.payable, 100);
  assert.equal(t.rounding, -0.4);
});

test("automatické číslování řady s rokem a dopočtem VS", () => {
  const inv = base();
  inv.series = { prefix: "FV", year: true, pad: 3, next: 7 };
  assert.equal(invoiceNumber(inv), "FV2026007");
  assert.equal(formatSeriesNumber({ prefix: "", year: false, pad: 4, next: 12 }, "2026-01-01"), "0012");
  assert.equal(variableSymbol(inv), "2026007");
  inv.numberAuto = false; inv.number = "A-55";
  assert.equal(invoiceNumber(inv), "A-55");
});

test("SPD řetězec: platný IBAN, bez diakritiky, částka s tečkou", () => {
  const inv = base();
  inv.supplier.name = "Příliš žluťoučký s.r.o.";
  inv.payment.iban = "CZ65 0800 0000 1920 0014 5399";
  inv.items = [item({ qty: 1, price: 1234.5, vat: 21 })];
  const spd = spdString(inv, calcTotals(inv));
  assert.match(spd, /^SPD\*1\.0\*ACC:CZ6508000000192000145399\*AM:1493\.75\*CC:CZK\*X-VS:2026001\*DT:20260319\*RN:PRILIS ZLUTOUCKY S\.R\.O\.\*MSG:FAKTURA 2026001$/);
  assert.equal(validIban("CZ65 0800 0000 1920 0014 5399"), true);
  inv.payment.iban = "neplatný";
  assert.equal(spdString(inv, calcTotals(inv)), null);
});

test("mergeInvoice doplní chybějící pole a odmítne nesmysly", () => {
  const m = mergeInvoice({ currency: "XXX", items: [{ qty: -5, price: "abc", vat: 500 }], dueDays: 99999, issue: "špatně" });
  assert.equal(m.currency, "CZK");
  assert.equal(m.dueDays, 365);
  assert.equal(m.items[0].qty, 0);
  assert.equal(m.items[0].price, 0);
  assert.equal(m.items[0].vat, 100);
  assert.match(m.issue, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(mergeInvoice(null).items.length, 1);
});

test("hlavní barva: neplatná hodnota spadne na výchozí, světlá barva dostane tmavý text a ztmavený nadpis", () => {
  assert.equal(mergeInvoice({ color: "#2563EB" }).color, "#2563eb");
  assert.equal(mergeInvoice({ color: "red" }).color, DEFAULT_COLOR);
  assert.equal(normalizeColor(undefined), DEFAULT_COLOR);
  assert.deepEqual(onColor("#ffff00"), [0.09, 0.1, 0.12]);
  assert.deepEqual(onColor("#1f2937"), [1, 1, 1]);
  const ink = inkColor("#ffff00");
  assert.ok(ink[0] < 1 && ink[2] < 0.5);
});
