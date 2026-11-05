// Generátor test fixtur pro funkční testy nástrojů.
// Používá vendored UMD pdf-lib (stejný jako v prohlížeči), takže fixtury
// odpovídají tomu, co reálně zpracovávají PDF nástroje. Text je v Liberation
// Sans (systémový TTF), ať jsou pokryty i české znaky — standardní Helvetica
// (WinAnsi) je neumí.
//
//   node scripts/test-fixtures.mjs [output-dir]
//
// Výchozí výstup: tests/fixtures/

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import url from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const PDF_LIB = path.join(repoRoot, "public/tools/assets/js/lib/pdf-lib.min.js");
const { PDFDocument, rgb } = require(PDF_LIB);
// pdf-lib vyžaduje fontkit pro vkládání vlastních (TTF) fontů
const fontkit = require("fontkit");

const SANS = "/usr/share/fonts/liberation/LiberationSans-Regular.ttf";
const SANS_BOLD = "/usr/share/fonts/liberation/LiberationSans-Bold.ttf";

const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(repoRoot, "tests/fixtures");
fs.mkdirSync(outDir, { recursive: true });

async function newDoc() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("VeVit Tools fixture");
  return doc;
}

async function invoiceWithTable() {
  const doc = await newDoc();
  const helv = await doc.embedFont(fs.readFileSync(SANS));
  const bold = await doc.embedFont(fs.readFileSync(SANS_BOLD));
  const page = doc.addPage([595.28, 841.89]); // A4 portrait
  const put = (font, size, x, y, text) => page.drawText(text, { x, y, size, font });

  // Hlavička faktury
  put(bold, 18, 50, 780, "Faktura č. 20250001");
  put(helv, 10, 50, 755, "Dodavatel: VeVit s.r.o.");
  put(helv, 10, 50, 741, "IČO: 12345678    DIČ: CZ12345678");
  put(helv, 10, 340, 755, "Odběratel: ACME a.s.");
  put(helv, 10, 340, 741, "IČO: 87654321");
  put(helv, 10, 400, 710, "Datum vystavení: 05. 11. 2026");
  put(helv, 10, 400, 696, "Splatnost: 20. 11. 2026");

  // Tabulka položek: 4 sloupce s pravidelnými x pozicemi
  const cols = [50, 330, 420, 500];
  const rowY = [650, 632, 614, 596, 578];
  put(bold, 10, cols[0], rowY[0], "Popis");
  put(bold, 10, cols[1], rowY[0], "Množství");
  put(bold, 10, cols[2], rowY[0], "Cena/j.");
  put(bold, 10, cols[3], rowY[0], "Celkem");
  const rows = [
    ["Vývoj webové aplikace", "1 ks", "45 000 Kč", "45 000 Kč"],
    ["Hosting a doména (rok)", "1 ks", "2 400 Kč", "2 400 Kč"],
    ["Podpora — hodinová sazba", "8 h", "1 200 Kč", "9 600 Kč"],
    ["SSL certifikát", "2 ks", "590 Kč", "1 180 Kč"],
  ];
  rows.forEach((r, i) => r.forEach((cell, c) => put(helv, 10, cols[c], rowY[i + 1], cell)));

  put(bold, 11, cols[3] - 40, 550, "Celkem: 58 180 Kč");
  put(helv, 9, 50, 60, "Vygenerováno pro testovací účely — VeVit Tools.");

  return { name: "invoice-with-table.pdf", bytes: await doc.save() };
}

async function multiColumn() {
  const doc = await newDoc();
  const helv = await doc.embedFont(fs.readFileSync(SANS));
  const page = doc.addPage([595.28, 841.89]);
  const put = (x, y, t) => page.drawText(t, { x, y, size: 10, font: helv });
  // Dva sloupce novinového typu; každý řádek je zvláštní drawText (pdf.js vrátí separátní itemy)
  const colA = 50, colB = 330;
  const lineA = [
    "První sloupec začíná zde a pokračuje",
    "na dalším řádku, který je vizuálně",
    "oddělený. Čtenář má dojem jednoho",
    "odstavce, který plyne přes řádky.",
    "",
    "Nový odstavec začíná mezerou nahoře.",
  ];
  const lineB = [
    "Druhý sloupec obsahuje jiný text,",
    "který nesmí být spojen se sloupcem",
    "prvním. Typická chyba konverze je",
    "prohození pořadí nebo slepení.",
  ];
  let y = 760;
  for (const t of lineA) {
    if (t) put(colA, y, t);
    y -= 15;
  }
  y = 760;
  for (const t of lineB) {
    if (t) put(colB, y, t);
    y -= 15;
  }
  return { name: "multi-column.pdf", bytes: await doc.save() };
}

async function wrappedText() {
  const doc = await newDoc();
  const helv = await doc.embedFont(fs.readFileSync(SANS));
  const page = doc.addPage([595.28, 841.89]);
  const put = (x, y, t) => page.drawText(t, { x, y, size: 11, font: helv });
  // Dlouhý odstavec zalomený ručně na řádky; bez prázdných řádků uvnitř
  const para1 = [
    "Toto je dlouhý odstavec, který byl v PDF zalomen na několik vizuálních řádků.",
    "Konvertor by měl tyto řádky spojit do jednoho odstavce, protože řádek končí",
    "uprostřed věty a další řádek začíná malým písmenem. Přesně tohle je hlavní",
    "scénář, který dřívější konverze rozbíjela na samostatné odstavce pro každý",
    "vizuální řádek, což ve Wordu vypadalo rozbitě.",
  ];
  const para2 = [
    "Druhý odstavec demonstruje situaci, kdy odstavec končí tečkou a další začíná",
    "velkým písmenem. I ten by měl zůstat samostatný.",
  ];
  let y = 770;
  for (const t of para1) { put(50, y, t); y -= 16; }
  y -= 10;
  for (const t of para2) { put(50, y, t); y -= 16; }
  return { name: "wrapped-text.pdf", bytes: await doc.save() };
}

async function spacedOut() {
  const doc = await newDoc();
  const helv = await doc.embedFont(fs.readFileSync(SANS));
  const page = doc.addPage([595.28, 841.89]);
  // Slova roztažená širokými mezerami (typické pro zarovnaný text)
  const words = ["Tento", "text", "má", "slova", "roztažená", "širokými", "mezerami"];
  let x = 50;
  for (const w of words) {
    page.drawText(w, { x, y: 760, size: 12, font: helv });
    x += helv.widthOfTextAtSize(w, 12) + 18; // 18pt mezera — mnohem širší než normální
  }
  // Naopak: slova bez žádné mezery (slepěná) — pdf.js často takové itemy vrací
  page.drawText("Tatořada nemážádnémezerymeziitemy", { x: 50, y: 720, size: 12, font: helv });
  return { name: "spaced-out.pdf", bytes: await doc.save() };
}

async function multiPage() {
  const doc = await newDoc();
  const helv = await doc.embedFont(fs.readFileSync(SANS));
  for (let i = 1; i <= 5; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Strana ${i} z 5`, { x: 50, y: 780, size: 14, font: helv });
    page.drawText("Testovací fixtura pro merge/split/rotate/page-numbers/watermark.", { x: 50, y: 750, size: 10, font: helv });
  }
  return { name: "multi-page.pdf", bytes: await doc.save() };
}

async function smallSampleFiles() {
  const files = [];
  // 2×2 PNG (červený čtverec) — minimální validní soubor
  const pngB64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGP8z8Dwn4GBgQEACyoCAdlkB/gAAAAASUVORK5CYII=";
  files.push({ name: "sample.png", data: Buffer.from(pngB64, "base64") });
  files.push({ name: "sample.csv", data: Buffer.from("jmeno,castka,pocet\nNovak,1200,3\nSvobodova,950,1\n", "utf8") });
  files.push({
    name: "sample.json",
    data: Buffer.from(JSON.stringify({ name: "vevit", tools: 108, nested: { ok: true } }, null, 2), "utf8"),
  });
  files.push({ name: "sample.txt", data: Buffer.from("Dobrý den,\n\ntoto je ukázkový textový soubor s diakritikou.\n", "utf8") });
  files.push({ name: "sample.wav", data: makeWav(1.5, 440) });
  // Minimální validní MP4 pro video/audio nástroje se ffmpeg.wasm vygeneruje samostatně v browser testu.
  return files;
}

// Minimální 16-bit PCM WAV (sine), mono — stačí pro ořez/konverzi přes ffmpeg.wasm
function makeWav(seconds, freq) {
  const rate = 8000;
  const n = Math.floor(seconds * rate);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.round(Math.sin((2 * Math.PI * freq * i) / rate) * 12000);
    buf.writeInt16LE(v, 44 + i * 2);
  }
  return buf;
}

const fixtures = [];
fixtures.push(await invoiceWithTable());
fixtures.push(await multiColumn());
fixtures.push(await wrappedText());
fixtures.push(await spacedOut());
fixtures.push(await multiPage());
fixtures.push(...(await smallSampleFiles()));

for (const f of fixtures) {
  const p = path.join(outDir, f.name);
  const buf = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.bytes);
  fs.writeFileSync(p, buf);
  console.log("✓", p, `${buf.length} B`);
}
console.log(`\nHotovo: ${fixtures.length} fixtur v ${outDir}`);
