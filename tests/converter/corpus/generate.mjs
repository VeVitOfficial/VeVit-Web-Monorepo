#!/usr/bin/env node
// Generates the DOCX part of the converter corpus (deterministic).
// Run: node tests/converter/corpus/generate.mjs
// The PDF part (LibreOffice desktop exports, scan) comes from make-pdfs.sh.
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { PNG } from "pngjs";
import { buildDocx, p, r, br, field, table, image, hyperlink } from "../lib/ooxml.mjs";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "docx");
mkdirSync(out, { recursive: true });
const save = (name, bytes) => { writeFileSync(path.join(out, name), bytes); console.log("wrote", name, bytes.length); };

const PANGRAM = "Příliš žluťoučký kůň úpěl ďábelské ódy. PŘÍLIŠ ŽLUŤOUČKÝ KŮŇ ÚPĚL ĎÁBELSKÉ ÓDY.";
const LOREM = [
  "Převodník běží celý v prohlížeči. Dokument se nikam neodesílá a zpracování probíhá ve web workeru, takže stránka zůstává plynulá i u delších souborů.",
  "Sazba musí respektovat zalamování řádků, dělení slov, mezery mezi odstavci a řádkování. Každý odstavec má v originále přesné odsazení prvního řádku.",
  "Tabulky zachovávají šířky sloupců, sloučené buňky, ohraničení a stínování. Čísla v tabulkách se zarovnávají vpravo, aby se daly snadno sčítat.",
  "Záhlaví a zápatí se opakují na každé stránce. Číslo stránky je pole, které se vyplní při stránkování, ne pevný text.",
];

// --- 1. Faktura (DOCX replika vzorové faktury) -----------------------------
async function faktura() {
  const qr = await QRCode.toBuffer("SPD*1.0*ACC:CZ6508000000192000145399*AM:19800.00*CC:CZK*X-VS:2026001*MSG:FAKTURA 2026001", { type: "png", margin: 0, scale: 8, errorCorrectionLevel: "M" });
  const F = "Arial";
  const label = (t) => r(t.toUpperCase(), { font: F, size: 8.5, color: "5F6B6A", spacing: 30 });
  const grey = "D9DDDC";
  const hdr = (t, align) => ({ content: p(r(t, { font: F, size: 9, b: true, color: "5F6B6A" }), { align, after: 0 }), borders: { bottom: { side: "bottom", sz: 6, color: grey } } });
  const cell = (t, align) => ({ content: p(r(t, { font: F, size: 10.5 }), { align, after: 0, before: 60 }), borders: { bottom: { side: "bottom", sz: 6, color: grey } } });
  const body = [
    table([
      { cells: [
        { content: p(r("Faktura", { font: F, size: 24, b: true, color: "111827" }), { after: 0 }) + p(r("č. 2026001", { font: F, size: 10.5 }), { after: 0 }) },
        { content: p(r("Vystaveno: 4. 11. 2026", { font: F, size: 10.5 }), { align: "right", after: 0 }) + p([r("Splatnost: ", { font: F, size: 10.5 }), r("18. 11. 2026", { font: F, size: 10.5, b: true })], { align: "right", after: 0 }) + p(r("Var. symbol: 2026001", { font: F, size: 10.5 }), { align: "right", after: 0 }) },
      ] },
    ], { widths: [4819, 4819] }),
    p("", { after: 120, border: { bottom: { sz: 18, color: "0F7B5A", space: 1 } } }),
    table([
      { cells: [
        { content: p(label("Dodavatel"), { after: 40, before: 160 }) + ["Jan Novák|b", "Ulice 1", "110 00 Praha", "IČO: 12345678", "Neplátce DPH"].map((l) => { const [t, f] = l.split("|"); return p(r(t, { font: F, size: 10.5, b: f === "b" }), { after: 0 }); }).join("") },
        { content: p(label("Odběratel"), { after: 40, before: 160 }) + ["Odběratel s.r.o.|b", "Náměstí 5", "602 00 Brno", "IČO: 87654321"].map((l) => { const [t, f] = l.split("|"); return p(r(t, { font: F, size: 10.5, b: f === "b" }), { after: 0 }); }).join("") },
      ] },
    ], { widths: [4819, 4819] }),
    p(label("Platba převodem na účet"), { before: 240, after: 40 }),
    p(r("CZ6508000000192000145399", { font: F, size: 10.5, b: true }), { after: 200 }),
    table([
      { header: true, cells: [hdr("POPIS"), hdr("MNOŽSTVÍ", "right"), hdr("CENA/KS", "right"), hdr("CELKEM", "right")] },
      { cells: [cell("Webová stránka"), cell("1", "right"), cell("15 000,00 Kč", "right"), cell("15 000,00 Kč", "right")] },
      { cells: [cell("Správa obsahu (hodiny)"), cell("6", "right"), cell("800,00 Kč", "right"), cell("4 800,00 Kč", "right")] },
    ], { widths: [3800, 1700, 2069, 2069] }),
    table([
      { cells: [
        { content: p(image("rIdImg1", 2.6, 2.6, 1, "QR platba"), { before: 200, after: 0 }) + p(label("QR platba"), { after: 0 }), valign: "bottom" },
        { content: p(label("K úhradě"), { align: "right", after: 0 }) + p(r("19 800,00 Kč", { font: F, size: 17, b: true, color: "0F7B5A" }), { align: "right", after: 0 }), valign: "bottom" },
      ] },
    ], { widths: [4819, 4819] }),
  ].join("");
  save("faktura.docx", buildDocx({ body, font: F, title: "Faktura 2026001", media: [{ name: "qr.png", data: qr }], sect: { margins: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }));
}

// --- 2. Vícestránková tabulka s opakovaným záhlavím ------------------------
function tabulka() {
  const rows = [{ header: true, cells: ["Č.", "Položka", "Kategorie", "Množství", "Cena za kus", "Celkem"].map((t, i) => ({ content: p(r(t, { b: true, color: "FFFFFF" }), { align: i >= 3 ? "right" : "left", after: 0 }), shd: "1F3864" })) }];
  const cats = ["Hardware", "Software", "Služby", "Školení"];
  for (let i = 1; i <= 90; i++) {
    const q = (i * 7) % 13 + 1, price = ((i * 3571) % 9000) + 150;
    const fmt = (n) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/ /g, " ");
    rows.push({ cells: [
      { content: String(i), align: "right" }, `Položka číslo ${i} – žluťoučký kůň`, cats[i % 4],
      { content: String(q), align: "right" }, { content: `${fmt(price)} Kč`, align: "right" }, { content: `${fmt(price * q)} Kč`, align: "right" },
    ].map((c) => (typeof c === "string" ? { content: c } : c)).map((c) => ({ ...c, shd: i % 2 ? undefined : "EEF2F8" })) });
  }
  const body = p("Ceník položek", { style: "Heading1" }) + p(LOREM[2]) + table(rows, { widths: [600, 3000, 1400, 1100, 1500, 1472], borders: "all", borderColor: "8EA0BF" }) + p("Konec tabulky.");
  save("tabulka-vicestrankova.docx", buildDocx({ body, title: "Vícestránková tabulka" }));
}

// --- 3. Sloučené buňky ----------------------------------------------------
function sloucene() {
  const c = (t, o = {}) => ({ content: p(r(t, o.run ?? {}), { align: o.align ?? "center", after: 0 }), ...o });
  const rows = [
    { header: true, cells: [c("Region", { vMerge: "restart", shd: "D9E2F3", valign: "center", run: { b: true } }), c("2025", { span: 2, shd: "D9E2F3", run: { b: true } }), c("2026", { span: 2, shd: "D9E2F3", run: { b: true } })] },
    { header: true, cells: [c("", { vMerge: "continue", shd: "D9E2F3" }), c("H1", { shd: "E9EEF8" }), c("H2", { shd: "E9EEF8" }), c("H1", { shd: "E9EEF8" }), c("H2", { shd: "E9EEF8" })] },
    { cells: [c("Čechy", { vMerge: "restart", valign: "center", align: "left" }), c("1 200", { align: "right" }), c("1 350", { align: "right" }), c("1 410", { align: "right" }), c("1 520", { align: "right" })] },
    { cells: [c("", { vMerge: "continue" }), c("980", { align: "right" }), c("1 010", { align: "right" }), c("1 100", { align: "right" }), c("1 090", { align: "right" })] },
    { cells: [c("Morava", { align: "left" }), c("760", { align: "right" }), c("820", { align: "right" }), c("905", { align: "right", shd: "FFF2CC" }), c("940", { align: "right", shd: "FFF2CC" })] },
    { cells: [c("Celkem", { align: "left", run: { b: true }, borders: { top: { side: "top", sz: 12 } } }), c("Součet za celé období: 13 085", { span: 4, run: { b: true }, borders: { top: { side: "top", sz: 12 } } })] },
  ];
  const body = p("Sloučené buňky a ohraničení", { style: "Heading1" }) + p(LOREM[2]) + table(rows, { widths: [2200, 1700, 1700, 1700, 1772], borders: "all" }) +
    p("") + p("Tabulka bez svislých čar:", { style: "Heading2" }) +
    table([{ cells: ["Kód", "Název", "Stav"].map((t) => ({ content: p(r(t, { b: true }), { after: 0 }) })) }, ...["A1|Žádost o změnu|Schváleno", "B7|Úprava smlouvy|Čeká", "C3|Ďábelská ódy|Zamítnuto"].map((l) => ({ cells: l.split("|") }))], { widths: [1500, 5000, 2572], borders: "rows", borderColor: "999999" });
  save("sloucene-bunky.docx", buildDocx({ body, title: "Sloučené buňky" }));
}

// --- 4. Dvousloupcová sazba ------------------------------------------------
function dvaSloupce() {
  const paras = [];
  for (let i = 0; i < 14; i++) paras.push(p(LOREM[i % 4] + " " + PANGRAM, { align: "both", ind: { firstLine: 284 }, after: 120 }));
  const body = p("Dvousloupcová sazba", { style: "Title", align: "center", sectPr: '<w:sectPr><w:type w:val="continuous"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/></w:sectPr>' }) +
    paras.join("");
  save("dva-sloupce.docx", buildDocx({ body, font: "Cambria", headFont: "Cambria", sect: { cols: 2, colSpace: 567, type: "continuous" }, title: "Dva sloupce" }));
}

// --- 5. Odrážky a číslované seznamy ---------------------------------------
function seznamy() {
  const b = (t, lvl = 0) => p(t, { style: "ListParagraph", num: { id: 1, lvl }, after: 40 });
  const n = (t, lvl = 0) => p(t, { style: "ListParagraph", num: { id: 2, lvl }, after: 40 });
  const body = [
    p("Odrážky a číslování", { style: "Heading1" }),
    p("Nečíslovaný seznam:", { style: "Heading2" }),
    b("První úroveň – žluťoučký kůň"), b("Druhá úroveň", 1), b("Třetí úroveň s delším textem, který se musí zalomit na další řádek a zachovat odsazení visící odrážky.", 2), b("Zpět na první úroveň"),
    p("Číslovaný seznam:", { style: "Heading2" }),
    n("Úvod"), n("Podkapitola", 1), n("Další podkapitola", 1), n("Římské číslování", 2), n("Druhá položka", 2), n("Závěr"), n("Přílohy"),
    p(LOREM[0]),
  ].join("");
  save("seznamy.docx", buildDocx({ body, title: "Seznamy" }));
}

// --- 6. Záhlaví a zápatí ---------------------------------------------------
function zahlavi() {
  const header = p([r("VeVit s.r.o. – interní dokument"), r("\t\tDůvěrné", { b: true, color: "C00000" })], { style: "Header", border: { bottom: { sz: 4, color: "808080" } } });
  const footer = p([r("\tStrana "), field("PAGE", "1"), r(" z "), field("NUMPAGES", "3")], { style: "Footer" });
  const paras = [p("Záhlaví, zápatí a číslování stran", { style: "Heading1" })];
  for (let i = 0; i < 30; i++) paras.push(p(LOREM[i % 4], { align: "both" }));
  save("zahlavi-zapati.docx", buildDocx({ body: paras.join(""), headers: [header], footers: [footer], sect: { header: "rIdH1", footer: "rIdF1" }, title: "Záhlaví a zápatí" }));
}

// --- 7. Diakritika ve všech fontech ---------------------------------------
function diakritika() {
  const fonts = ["Calibri", "Cambria", "Arial", "Times New Roman", "Courier New", "Carlito", "Caladea", "Liberation Sans", "Liberation Serif", "Liberation Mono"];
  const body = [p("Česká diakritika ve fontech", { style: "Heading1" })];
  for (const f of fonts) {
    body.push(p(r(f, { font: f, b: true, size: 12 }), { after: 0, keepNext: true }));
    body.push(p([r(PANGRAM, { font: f }), br(), r("Tučně: " + PANGRAM.slice(0, 40), { font: f, b: true }), br(), r("Kurzíva: " + PANGRAM.slice(0, 40), { font: f, i: true }), br(), r("„Uvozovky“ – pomlčka, € 1 234,50; §12 odst. 3", { font: f })], { after: 160 }));
  }
  save("diakritika-fonty.docx", buildDocx({ body: body.join(""), title: "Diakritika" }));
}

// --- 8. Obrázky, odkazy, záložky, osnova -----------------------------------
function photoPng(w, h) {
  const png = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const cx = x - w * 0.6, cy = y - h * 0.4, d = Math.sqrt(cx * cx + cy * cy);
    png.data[i] = Math.min(255, 40 + (x * 180) / w + (d < h * 0.2 ? 60 : 0));
    png.data[i + 1] = Math.min(255, 90 + (y * 120) / h);
    png.data[i + 2] = Math.min(255, 160 + 60 * Math.sin(x / 23) * Math.cos(y / 17));
    png.data[i + 3] = 255;
  }
  // fine checkerboard detail: exposes any resampling
  for (let y = 20; y < 80; y++) for (let x = 20; x < 80; x++) { const i = (y * w + x) * 4; const v = (x + y) % 2 ? 0 : 255; png.data[i] = png.data[i + 1] = png.data[i + 2] = v; }
  return PNG.sync.write(png);
}
function obrazky() {
  const body = [
    p("Obrázky a odkazy", { style: "Heading1", bookmark: { id: 1, name: "_Toc_obrazky" } }),
    p(LOREM[0]),
    p(image("rIdImg1", 12, 8, 1, "Fotografie"), { align: "center" }),
    p(r("Obrázek 1: syntetická fotografie 1200 × 800 px se šachovnicí 1 px", { i: true, size: 9 }), { align: "center" }),
    p("Odkazy", { style: "Heading2" }),
    p([r("Více na "), hyperlink("rIdL1", "vevit.cz/cs/tools"), r(".")]),
    p("Druhá kapitola", { style: "Heading1", pageBreakBefore: true }),
    p("Podkapitola 2.1", { style: "Heading2" }),
    p(LOREM[1]),
    p("Podkapitola 2.2", { style: "Heading2" }),
    p(LOREM[3]),
  ].join("");
  save("obrazky.docx", buildDocx({ body, media: [{ name: "foto.png", data: photoPng(1200, 800) }], links: ["https://vevit.cz/cs/tools"], title: "Obrázky a odkazy", author: "VeVit" }));
}

// --- 9. Landscape ----------------------------------------------------------
function landscape() {
  const months = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"];
  const rows = [{ header: true, cells: ["Ukazatel", ...months].map((t) => ({ content: p(r(t, { b: true }), { align: "center", after: 0 }), shd: "E2EFD9" })) }];
  for (const k of ["Tržby", "Náklady", "Zisk", "Zákazníci", "Objednávky"]) rows.push({ cells: [k, ...months.map((_, i) => ({ content: String((k.length * 137 + i * 61) % 900 + 100), align: "right" }))] });
  const body = p("Roční přehled (na šířku)", { style: "Heading1" }) + p(LOREM[2]) + table(rows, { widths: [1800, ...months.map(() => 1000)], borders: "all", borderColor: "70AD47" });
  save("landscape.docx", buildDocx({ body, sect: { landscape: true }, title: "Na šířku" }));
}

// --- 10. Vložený font (obfuskovaný .odttf) ---------------------------------
function vlozenyFont() {
  const ttf = readFileSync(path.join(here, "../fonts-embed/NotoSerif-Regular.ttf"));
  const body = [p(r("Vložený font Noto Serif", { font: "Noto Serif", size: 20 }), { after: 120 }), ...LOREM.map((t) => p(r(t + " " + PANGRAM, { font: "Noto Serif" }), { align: "both" }))].join("");
  save("vlozeny-font.docx", buildDocx({ body, embedFonts: [{ name: "Noto Serif", data: ttf, guid: "{6C1A4D2E-8B3F-4A51-9E07-2D5C8F0B1A63}", family: "roman" }], title: "Vložený font" }));
}

await faktura();
tabulka(); sloucene(); dvaSloupce(); seznamy(); zahlavi(); diakritika(); obrazky(); landscape(); vlozenyFont();
