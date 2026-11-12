#!/usr/bin/env node
// VeVit Store — import sourcing master xlsx → SQL seed migrace
//
// Použití:
//   npm run store:import [-- cesta/k/master.xlsx] [--write]
//
// Výchozí režim je dry-run (report na stdout, nic nezapisuje).
// --write vygeneruje supabase/sql/store/migrations/20261112NNNN_sourcing_catalog_{up,down}.sql
//
// Řádek xlsx = sourcing kandidát (značka + model + varianta). Import:
//  - balicí režimy (standard / office pack / bulk / …) se sloučí,
//    reálné spec-varianty (délka, wattáž, barva) zůstávají jako samostatná SKU,
//  - produkty jdou do DB jako is_active=true, is_sellable=false, stock=0
//    (prohlédnutelné v katalogu, checkout je odmítne),
//  - cena je orientaní odhad: mid(USD benchmark) × FX × LANDED × MARGIN,
//    bez benchmarku se doplní medián odhadů dané kategorie.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_XLSX = join(process.env.HOME ?? ".", "Downloads/VeVit_sourcing_master_1260_2026-08-20.xlsx");

// Obrázek značky (placeholder v public/store/img/brand/) — použije se pro
// všechny produkty dané značky, dokud nebudou reálné produktové fotky.
const BRAND_IMAGES = {
  UGREEN: "/store/img/brand/ugreen.jpg",
  Baseus: "/store/img/brand/baseus.jpg",
  Deli: "/store/img/brand/deli.jpg",
  ORICO: "/store/img/brand/orico.jpg",
  "M&G": "/store/img/brand/mg.jpg",
  JIECANG: "/store/img/brand/jiecang.jpg",
  Vention: "/store/img/brand/vention.jpg",
  Comix: "/store/img/brand/comix.jpg",
  SIHOO: "/store/img/brand/sihoo.png",
  Tenda: "/store/img/brand/tenda.jpg",
  LDNIO: "/store/img/brand/ldnio.jpg",
  "70mai": "/store/img/brand/70mai.jpg",
  PETKIT: "/store/img/brand/petkit.jpg",
  SINOART: "/store/img/brand/sinoart.jpg",
};

// ── Konstanty cenového odhadu ────────────────────────────────────────────────
const FX = 23;        // USD → CZK
const LANDED = 1.3;   // doprava + clo + pojištění
const MARGIN = 1.4;   // marže
const MIN_PRICE = 49; // Kč

// Varianta, která je čistě balicí/prodejní režim, není samostatný produkt.
const PACK_VARIANTS = new Set([
  "standard", "office pack", "school pack", "bulk", "eu retail", "b2b bulk",
  "basic", "business", "international", "retail", "standard pack", "bulk pack",
]);

// ── Cílová taxonomie ─────────────────────────────────────────────────────────
// Nové top kategorie (sort 90+, demo kategorie mají 1–8).
const NEW_TOPS = [
  { name: "Škola a kancelář", slug: "skola-a-kancelar", icon: "school", sort: 90 },
  { name: "Kancelářský nábytek", slug: "kancelarsky-nabytek", icon: "chair", sort: 91 },
  { name: "Auto-moto", slug: "auto-moto", icon: "directions_car", sort: 92 },
  { name: "Síťové prvky a úložiště", slug: "sitove-prvky-a-uloziste", icon: "router", sort: 93 },
];

const TOP_ELEKTRONIKA = "elektronika-a-prislusenstvi"; // existující demo top
const TOP_PET = "chovatelske-potreby-pet-products";    // existující demo top
const SUB_VYTVARNE = "vytvarne-potreby";               // existující demo sub pod Umění

// Klíč `${segment}|${kategorie}` → cíl. Cíl = nová subkategorie {name,slug,parent,sort}
// nebo existující {existing: slug}. Sloučené kategorie (Huby + Huby a docking
// stanice, Power strips + smart socket) míří na stejný slug.
const CATEGORY_MAP = {
  // Škola a kancelář
  "Škola a kancelář|Archivace": { name: "Archivace", slug: "archivace", parent: "skola-a-kancelar", sort: 900 },
  "Škola a kancelář|Korekce": { name: "Korekce", slug: "korekce", parent: "skola-a-kancelar", sort: 901 },
  "Škola a kancelář|Laminátory": { name: "Laminátory", slug: "laminatory", parent: "skola-a-kancelar", sort: 902 },
  "Škola a kancelář|Markery": { name: "Markery", slug: "markery", parent: "skola-a-kancelar", sort: 903 },
  "Škola a kancelář|Náplně": { name: "Náplně do per", slug: "naplne-do-per", parent: "skola-a-kancelar", sort: 904 },
  "Škola a kancelář|Pera": { name: "Pera", slug: "pera", parent: "skola-a-kancelar", sort: 905 },
  "Škola a kancelář|Pera a gelová pera": { name: "Pera a gelová pera", slug: "pera-a-gelova-pera", parent: "skola-a-kancelar", sort: 906 },
  "Škola a kancelář|Psací potřeby": { name: "Psací potřeby", slug: "psaci-potreby", parent: "skola-a-kancelar", sort: 907 },
  "Škola a kancelář|Sešity": { name: "Sešity", slug: "sesity", parent: "skola-a-kancelar", sort: 908 },
  "Škola a kancelář|Sešity a bloky": { name: "Sešity a bloky", slug: "sesity-a-bloky", parent: "skola-a-kancelar", sort: 909 },
  "Škola a kancelář|Skartovačky": { name: "Skartovačky", slug: "skartovacky", parent: "skola-a-kancelar", sort: 910 },
  "Škola a kancelář|Stapling": { name: "Sponkovače", slug: "sponkovace", parent: "skola-a-kancelar", sort: 911 },
  "Škola a kancelář|Stolní potřeby": { name: "Stolní potřeby", slug: "stolni-potreby", parent: "skola-a-kancelar", sort: 912 },
  "Škola a kancelář|Tužky": { name: "Tužky", slug: "tuzky", parent: "skola-a-kancelar", sort: 913 },
  // Kancelářský nábytek
  "Kancelářský nábytek|Desk frames a lifting columns": { name: "Rámy stolu a zdvihové sloupky", slug: "ramy-stolu-a-zdvihove-sloupky", parent: "kancelarsky-nabytek", sort: 920 },
  "Kancelářský nábytek|Ergonomické židle": { name: "Ergonomické židle", slug: "ergonomicke-zidle", parent: "kancelarsky-nabytek", sort: 921 },
  "Kancelářský nábytek|Příslušenství ke stolům": { name: "Příslušenství ke stolům", slug: "prislusenstvi-ke-stolum", parent: "kancelarsky-nabytek", sort: 922 },
  "Kancelářský nábytek|Výškově nastavitelné stoly": { name: "Výškově nastavitelné stoly", slug: "vyskove-nastavitelne-stoly", parent: "kancelarsky-nabytek", sort: 923 },
  // Auto-moto (segment Auto + „IT a elektronika|Auto elektronika")
  "Auto|Auto elektronika": { name: "Auto elektronika", slug: "auto-elektronika", parent: "auto-moto", sort: 930 },
  "Auto|Dash kamery": { name: "Dash kamery", slug: "dash-kamery", parent: "auto-moto", sort: 931 },
  "Auto|Příslušenství k dashcam": { name: "Příslušenství k dashcam", slug: "prislusenstvi-k-dashcam", parent: "auto-moto", sort: 932 },
  "IT a elektronika|Auto elektronika": { name: "Auto elektronika", slug: "auto-elektronika", parent: "auto-moto", sort: 930 },
  // Síťové prvky a úložiště
  "IT a síť|Routery a síťové prvky": { name: "Routery a síťové prvky", slug: "routery-a-sitove-prvky", parent: "sitove-prvky-a-uloziste", sort: 940 },
  "IT a síť|Síťové prvky": { name: "Síťové prvky", slug: "sitove-prvky", parent: "sitove-prvky-a-uloziste", sort: 941 },
  "IT a elektronika|Docking / storage": { name: "Doky a úložné stanice", slug: "doky-a-ulozne-stanice", parent: "sitove-prvky-a-uloziste", sort: 942 },
  "IT a elektronika|HDD/SSD enclosure": { name: "Skříňky na disky (HDD/SSD)", slug: "skrinky-na-disky-hdd-ssd", parent: "sitove-prvky-a-uloziste", sort: 943 },
  "IT a elektronika|NAS": { name: "NAS úložiště", slug: "nas-uloziste", parent: "sitove-prvky-a-uloziste", sort: 944 },
  "IT a elektronika|SSD a úložiště": { name: "SSD a úložiště", slug: "ssd-a-uloziste", parent: "sitove-prvky-a-uloziste", sort: 945 },
  // Elektronika (existující demo top, nové suby sort 150+)
  "IT a elektronika|Adaptéry": { name: "Adaptéry", slug: "adaptery", parent: TOP_ELEKTRONIKA, sort: 150 },
  "IT a elektronika|Audio": { existing: "audio-and-sluchatka" },
  "IT a elektronika|Audio kabely": { name: "Audio kabely", slug: "audio-kabely", parent: TOP_ELEKTRONIKA, sort: 151 },
  "IT a elektronika|Bezpečnostní kamery": { existing: "bezpecnostni-wi-fi-kamery" },
  "IT a elektronika|Datové kabely": { name: "Datové kabely", slug: "datove-kabely", parent: TOP_ELEKTRONIKA, sort: 152 },
  "IT a elektronika|Huby": { name: "Huby a docking stanice", slug: "huby-a-docking-stanice", parent: TOP_ELEKTRONIKA, sort: 153 },
  "IT a elektronika|Huby a docking stanice": { name: "Huby a docking stanice", slug: "huby-a-docking-stanice", parent: TOP_ELEKTRONIKA, sort: 153 },
  "IT a elektronika|Kabely": { name: "Kabely", slug: "kabely", parent: TOP_ELEKTRONIKA, sort: 154 },
  "IT a elektronika|Mini PC": { name: "Mini PC", slug: "mini-pc", parent: TOP_ELEKTRONIKA, sort: 155 },
  "IT a elektronika|Nabíječky": { name: "Nabíječky", slug: "nabijecky", parent: TOP_ELEKTRONIKA, sort: 156 },
  "IT a elektronika|Power banky": { name: "Power banky", slug: "power-banky", parent: TOP_ELEKTRONIKA, sort: 157 },
  "IT a elektronika|Power strips": { name: "Prodlužovače a smart zásuvky", slug: "power-strips-a-smart-zasuvky", parent: TOP_ELEKTRONIKA, sort: 158 },
  "IT a elektronika|Power strips / smart socket": { name: "Prodlužovače a smart zásuvky", slug: "power-strips-a-smart-zasuvky", parent: TOP_ELEKTRONIKA, sort: 158 },
  "IT a elektronika|Smart plug": { name: "Prodlužovače a smart zásuvky", slug: "power-strips-a-smart-zasuvky", parent: TOP_ELEKTRONIKA, sort: 158 },
  "IT a elektronika|Příslušenství": { name: "Příslušenství", slug: "prislusenstvi", parent: TOP_ELEKTRONIKA, sort: 159 },
  "IT a elektronika|Stojany": { name: "Stojany a držáky", slug: "stojany-a-drzaky", parent: TOP_ELEKTRONIKA, sort: 160 },
  "IT a elektronika|Síťové kabely": { name: "Síťové kabely", slug: "sitove-kabely", parent: TOP_ELEKTRONIKA, sort: 161 },
  "IT a elektronika|Video kabely": { name: "Video kabely", slug: "video-kabely", parent: TOP_ELEKTRONIKA, sort: 162 },
  // Škola a vzdělávání (SINOART) → pod existující Výtvarné potřeby
  "Škola a vzdělávání|Malířské sady": { name: "Malířské sady", slug: "malirske-sady", parent: SUB_VYTVARNE, sort: 210 },
  "Škola a vzdělávání|Plátna": { name: "Plátna", slug: "platna", parent: SUB_VYTVARNE, sort: 211 },
  "Škola a vzdělávání|Stojany": { name: "Stojany na plátna", slug: "stojany-na-platna", parent: SUB_VYTVARNE, sort: 212 },
  "Škola a vzdělávání|Štětce": { name: "Štětce", slug: "stetce", parent: SUB_VYTVARNE, sort: 213 },
  // Pet (PETKIT) → pod existující Chovatelské potřeby
  "Pet|Smart pet / pet accessories": { name: "Chytré vybavení pro mazlíčky", slug: "chytre-pet-vybaveni", parent: TOP_PET, sort: 75 },
};

// Klíčová slova pro výběr správné cenové položky ze skupinového benchmarku
// (benchmark řetězce obsahují více rozsahů: „$4.63–5.31 kabel; $18.90–19.99 charger; …").
const PRICE_KEYWORDS = [
  { test: /kabel|cable/i, categories: ["Kabely", "Datové kabely", "Audio kabely", "Video kabely", "Síťové kabely"] },
  { test: /charger|gan|adapt/i, categories: ["Nabíječky", "Adaptéry"] },
  { test: /powerbank|power bank/i, categories: ["Power banky"] },
  { test: /pen|gel|ink/i, categories: ["Pera", "Pera a gelová pera", "Psací potřeby", "Náplně"] },
  { test: /staple|sponk/i, categories: ["Stapling"] },
  { test: /eraser|korek|gum/i, categories: ["Korekce"] },
  { test: /cutter|rezak|řez/i, categories: ["Stolní potřeby"] },
  { test: /enclosure|orico|rgb|ssd|hdd|nas|storage|dock/i, categories: ["HDD/SSD enclosure", "NAS", "SSD a úložiště", "Docking / storage", "Routery a síťové prvky", "Síťové prvky"] },
  { test: /chair|zhidle|židle/i, categories: ["Ergonomické židle"] },
  { test: /desk|frame|motor|lifting|stol/i, categories: ["Výškově nastavitelné stoly", "Desk frames a lifting columns", "Příslušenství ke stolům"] },
  { test: /paint|malir|malíř|brush|stetc|štětc|canvas|platn/i, categories: ["Malířské sady", "Štětce", "Plátna", "Stojany"] },
  { test: /power strip|socket|plug|zasuv/i, categories: ["Power strips", "Power strips / smart socket", "Smart plug"] },
  { test: /marker|fix|tuz|tuž|pencil|sesit|sešit|notebook|paper|archiv|marker/i, categories: ["Markery", "Tužky", "Sešity", "Sešity a bloky", "Archivace"] },
];

// ── Utility ──────────────────────────────────────────────────────────────────
function slugify(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Rozparsuje benchmark „$2.80–6.21 kabel; $18.90–19.99 charger" na položky {min,max,text}. */
function parseBenchmark(raw) {
  if (!raw) return [];
  const items = [];
  const re = /\$([0-9]+(?:\.[0-9]+)?)(?:\s*[–—-]\s*\$?([0-9]+(?:\.[0-9]+)?))?([^$]*)/gi;
  let match;
  while ((match = re.exec(String(raw))) !== null) {
    const min = Number(match[1]);
    const max = match[2] !== undefined ? Number(match[2]) : min;
    if (Number.isFinite(min) && min > 0) items.push({ min, max: Math.max(min, max), text: match[3] ?? "" });
  }
  return items;
}

/** Vybere USD odhad pro danou kategorii ze skupinového benchmarku. */
function benchmarkEstimateUsd(raw, kategorie) {
  const items = parseBenchmark(raw);
  if (!items.length) return null;
  const keyword = PRICE_KEYWORDS.find((entry) => entry.categories.includes(kategorie));
  if (keyword) {
    const hit = items.find((item) => keyword.test.test(item.text));
    if (hit) return (hit.min + hit.max) / 2;
  }
  const min = Math.min(...items.map((item) => item.min));
  const max = Math.max(...items.map((item) => item.max));
  return (min + max) / 2;
}

function psychologicalPrice(value) {
  const rounded = Math.round(value / 10) * 10 - 1;
  return Math.max(MIN_PRICE, rounded);
}

// ── Načtení xlsx ─────────────────────────────────────────────────────────────
//exceljs i read-excel-file selhávají na souborech s nestandardními namespace
//prefixy (např. <x:sheet> + r:id místo rId), které openpyxl toleruje; proto
//vlastní minimální čtečka přes adm-zip, prefixům-neutralní.

function decodeXml(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Odstraní namespace prefixy z názvů tagů (<x:sheet> → <sheet>), atributy nechá. */
function stripTagPrefixes(xml) {
  return xml.replace(/<(\/?)[A-Za-z0-9]+:/g, "<$1");
}

function attribute(tagSource, name) {
  const match = tagSource.match(new RegExp(`(?:^|\\s)(?:[A-Za-z0-9]+:)?${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function columnToIndex(letters) {
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index; // A = 1
}

function readZipText(zip, entry) {
  const e = zip.getEntry(entry);
  return e ? zip.readAsText(e) : null;
}

function loadSheetRows(zip, sheetName) {
  const workbookXml = stripTagPrefixes(readZipText(zip, "xl/workbook.xml") ?? "");
  const sheetTag = [...workbookXml.matchAll(/<sheet\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => attribute(tag, "name") === sheetName);
  if (!sheetTag) throw new Error(`List „${sheetName}" nenalezen`);

  const relId = attribute(sheetTag, "r:id") ?? attribute(sheetTag, "id");
  const relsXml = stripTagPrefixes(readZipText(zip, "xl/_rels/workbook.xml.rels") ?? "");
  const rel = [...relsXml.matchAll(/<Relationship\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => attribute(tag, "Id") === relId && attribute(tag, "Target")?.includes("worksheet"));
  if (!rel) throw new Error(`Relace ${relId} pro list „${sheetName}" nenalezena`);

  const target = attribute(rel, "Target").replace(/^\/?(xl\/)?/, "");
  const sheetXml = readZipText(zip, `xl/${target}`);
  if (!sheetXml) throw new Error(`Entry xl/${target} nenalezen v xlsx`);

  const shared = [];
  const sharedXml = readZipText(zip, "xl/sharedStrings.xml");
  if (sharedXml) {
    for (const item of stripTagPrefixes(sharedXml).matchAll(/<si>(.*?)<\/si>/gs)) {
      shared.push([...item[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((t) => decodeXml(t[1])).join(""));
    }
  }

  const rows = [];
  for (const rowMatch of stripTagPrefixes(sheetXml).matchAll(/<row\b[^>]*>(.*?)<\/row>/gs)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] ?? "";
      const ref = attribute(attrs, "r") ?? "";
      const letters = ref.replace(/\d+/g, "");
      if (!letters) continue;
      const type = attribute(attrs, "t");
      let value = "";
      if (type === "inlineStr") {
        value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => decodeXml(t[1])).join("");
      } else {
        const v = body.match(/<v[^>]*>([\s\S]*?)<\/v>/);
        if (v) value = type === "s" ? (shared[Number(decodeXml(v[1]))] ?? "") : decodeXml(v[1]);
      }
      cells[columnToIndex(letters) - 1] = value;
    }
    rows.push(cells);
  }
  return rows;
}

async function loadRows(xlsxPath) {
  const zip = new AdmZip(xlsxPath);
  const grid = loadSheetRows(zip, "Katalog_1260");
  if (grid.length < 2) throw new Error("List Katalog_1260 je prázdný");

  const headerCells = grid[0].map((cell) => String(cell ?? "").trim());
  const column = (name) => headerCells.findIndex((cell) => cell === name || cell.startsWith(name));
  const cols = {
    brand: column("Značka"),
    segment: column("Segment"),
    category: column("Kategorie"),
    model: column("Produktová řada / model"),
    variant: column("Varianta / specifikace"),
    benchmark: column("Benchmark nákupní ceny"),
    priceTier: column("Cenová hladina"),
  };
  for (const [key, index] of Object.entries(cols)) {
    if (index < 0) throw new Error(`Sloupec „${key}" nenalezen v hlavičce listu Katalog_1260`);
  }

  const rows = [];
  for (const cells of grid.slice(1)) {
    const value = (index) => String(cells[index] ?? "").trim();
    const brand = value(cols.brand);
    const model = value(cols.model);
    if (!brand || !model) continue;
    rows.push({
      brand,
      segment: value(cols.segment),
      category: value(cols.category),
      model,
      variant: value(cols.variant),
      benchmark: value(cols.benchmark),
      priceTier: value(cols.priceTier),
    });
  }
  return rows;
}

// ── Čištění: sloučení balicích režimů ────────────────────────────────────────
function collapsePackVariants(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.brand}||${row.model}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const products = [];
  let droppedPackRows = 0;
  for (const groupRows of groups.values()) {
    const real = groupRows.filter((row) => !PACK_VARIANTS.has(row.variant.toLowerCase()));
    const pack = groupRows.filter((row) => PACK_VARIANTS.has(row.variant.toLowerCase()));
    if (real.length) {
      droppedPackRows += pack.length;
      products.push(...real);
    } else {
      droppedPackRows += pack.length - 1;
      products.push({ ...groupRows[0], variant: "" }); // base model bez balicího režimu
    }
  }
  return { products, droppedPackRows };
}

// ── Sestavení produktů ───────────────────────────────────────────────────────
function buildProducts(rows) {
  const warnings = [];
  const seenPairs = new Map();

  const mapped = rows.map((row) => {
    const pairKey = `${row.segment}|${row.category}`;
    if (!seenPairs.has(pairKey)) seenPairs.set(pairKey, (seenPairs.get(pairKey) ?? 0) + 1);
    const target = CATEGORY_MAP[pairKey];
    if (!target) {
      if (!warnings.includes(`Nenamapovaná kategorie: ${pairKey}`)) warnings.push(`Nenamapovaná kategorie: ${pairKey}`);
      return null;
    }
    const categorySlug = target.existing ?? target.slug;
    const estimateUsd = benchmarkEstimateUsd(row.benchmark, row.category);
    return { ...row, categorySlug, categoryLabel: target.name ?? row.category, estimateUsd };
  }).filter(Boolean);

  // Mediánová imputace chybějících odhadů: kategorie → cenová hladina → globální medián.
  const globalMedian = median(mapped.filter((p) => p.estimateUsd !== null).map((p) => p.estimateUsd));
  const categoryMedians = new Map();
  const tierMedians = new Map();
  for (const product of mapped) {
    if (product.estimateUsd === null) continue;
    const categoryKey = `${product.segment}|${product.category}`;
    if (!categoryMedians.has(categoryKey)) categoryMedians.set(categoryKey, []);
    categoryMedians.get(categoryKey).push(product.estimateUsd);
    if (!tierMedians.has(product.priceTier)) tierMedians.set(product.priceTier, []);
    tierMedians.get(product.priceTier).push(product.estimateUsd);
  }
  let imputed = 0;
  for (const product of mapped) {
    if (product.estimateUsd !== null) {
      product.price = psychologicalPrice(product.estimateUsd * FX * LANDED * MARGIN);
      continue;
    }
    const categoryKey = `${product.segment}|${product.category}`;
    const fallback =
      median(categoryMedians.get(categoryKey) ?? []) ??
      median(tierMedians.get(product.priceTier) ?? []) ??
      globalMedian ?? 5;
    product.price = psychologicalPrice(fallback * FX * LANDED * MARGIN);
    product.priceImputed = true;
    imputed += 1;
  }

  // Jména, slugy, popisy, variantní skupiny (Alza-style: 1 model = 1 karta).
  const slugCounts = new Map();
  for (const product of mapped) {
    product.name = `${product.brand} ${product.model}${product.variant ? ` (${product.variant})` : ""}`.slice(0, 255);
    product.variantGroup = slugify(`${product.brand} ${product.model}`);
    product.variantLabel = product.variant || null;
    let slug = slugify([product.brand, product.model, product.variant].filter(Boolean).join(" "));
    const count = (slugCounts.get(slug) ?? 0) + 1;
    slugCounts.set(slug, count);
    if (count > 1) slug = `${slug}-${count}`;
    product.slug = slug;
    product.shortDesc = [product.brand, product.categoryLabel, product.variant].filter(Boolean).join(" · ").slice(0, 255);
    product.description =
      `${product.name} — ${product.categoryLabel.toLowerCase()} ve sortimentu VeVit Store. ` +
      `Uvedená cena je orientační odhad z nákupního průzkumu; produkt zatím není skladem, ` +
      `po ověření dodavatele a naskladnění bude cena upřesněna.`;
  }
  return { products: mapped, warnings, imputed };
}

// ── SQL generování ───────────────────────────────────────────────────────────
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function generateSql(products, sourceName) {
  const newSubs = new Map();
  for (const target of Object.values(CATEGORY_MAP)) {
    if (!target.existing) newSubs.set(target.slug, target);
  }
  const usedSlugs = new Set(products.map((p) => p.categorySlug));
  const usedSubs = [...newSubs.values()].filter((sub) => usedSlugs.has(sub.slug));

  const lines = [];
  lines.push(`-- VeVit Store — sourcing catalog seed (generováno, neupravovat ručně)`);
  lines.push(`-- Zdroj: ${sourceName} (list Katalog_1260, ${sourceDate()})`);
  lines.push(`-- Produkty: ${products.length} (is_active=true, is_sellable=false, stock=0)`);
  lines.push(`-- Nové kategorie: ${NEW_TOPS.length + usedSubs.length}; idempotentní: ON CONFLICT (slug) DO NOTHING`);
  lines.push("");

  for (const top of NEW_TOPS) {
    lines.push(
      `INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ` +
      `(${sqlString(top.name)}, ${sqlString(top.slug)}, ${sqlString(top.icon)}, ${top.sort}, NULL) ON CONFLICT (slug) DO NOTHING;`
    );
  }
  for (const sub of usedSubs) {
    lines.push(
      `INSERT INTO store_categories (name, slug, icon, sort_order, parent_id) VALUES ` +
      `(${sqlString(sub.name)}, ${sqlString(sub.slug)}, NULL, ${sub.sort}, (SELECT id FROM store_categories WHERE slug=${sqlString(sub.parent)})) ON CONFLICT (slug) DO NOTHING;`
    );
  }
  lines.push("");

  const productRow = (p) => {
    const image = BRAND_IMAGES[p.brand];
    return `((SELECT id FROM store_categories WHERE slug=${sqlString(p.categorySlug)}), ${sqlString(p.name)}, ${sqlString(p.slug)}, ` +
      `${sqlString(p.description)}, ${sqlString(p.shortDesc)}, ${p.price.toFixed(2)}, NULL, 'physical', 0, ` +
      `${image ? `'["${image}"]'::jsonb` : "NULL"}, ` +
      `${p.variantGroup ? sqlString(p.variantGroup) : "NULL"}, ${p.variantLabel ? sqlString(p.variantLabel) : "NULL"}, ` +
      `${sqlString(p.brand)}, TRUE, FALSE, FALSE, FALSE)`;
  };

  for (const batch of chunk(products, 50)) {
    lines.push(
      `INSERT INTO store_products (category_id, name, slug, description, short_desc, price, sale_price, type, stock, images, variant_group, variant_label, brand, is_active, is_sellable, allow_backorder, featured) VALUES\n` +
      batch.map(productRow).join(",\n") +
      `\nON CONFLICT (slug) DO NOTHING;`
    );
  }
  return { up: lines.join("\n") + "\n", usedSubs };
}

function generateDownSql(products, usedSubs) {
  const lines = [`-- Down: sourcing catalog seed (smazán celý import)`];
  for (const batch of chunk(products, 100)) {
    lines.push(`DELETE FROM store_products WHERE slug IN (${batch.map((p) => sqlString(p.slug)).join(", ")});`);
  }
  const categorySlugs = [...usedSubs.map((s) => s.slug), ...NEW_TOPS.map((t) => t.slug)];
  lines.push(`DELETE FROM store_categories WHERE slug IN (${categorySlugs.map(sqlString).join(", ")});`);
  return lines.join("\n") + "\n";
}

function sourceDate() {
  return new Date().toISOString().slice(0, 10);
}

// ── Report ───────────────────────────────────────────────────────────────────
function printReport(rows, products, droppedPackRows, warnings, imputed) {
  const by = (key) => {
    const counts = new Map();
    for (const product of products) counts.set(product[key], (counts.get(product[key]) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };
  const prices = products.map((p) => p.price);
  console.log(`Řádků ve vstupu:            ${rows.length}`);
  console.log(`Sloučených balicích řádků:  ${droppedPackRows}`);
  console.log(`Produktů k importu:         ${products.length}`);
  console.log(`Cen doplněných mediánem:    ${imputed}`);
  console.log(`Cena min/medián/max (Kč):   ${Math.min(...prices)} / ${median(prices).toFixed(0)} / ${Math.max(...prices)}`);
  console.log(`\nPodle značky:`);
  for (const [brand, count] of by("brand")) console.log(`  ${String(count).padStart(4)}  ${brand}`);
  const topOf = new Map();
  for (const product of products) {
    const target = Object.values(CATEGORY_MAP).find((t) => (t.existing ?? t.slug) === product.categorySlug);
    const parent = target?.existing ? "(existující)" : NEW_TOPS.find((t) => t.slug === target?.parent)?.name ?? target?.parent ?? "?";
    topOf.set(parent, (topOf.get(parent) ?? 0) + 1);
  }
  console.log(`\nPodle top kategorie:`);
  const existingLabels = {
    [TOP_ELEKTRONIKA]: "Elektronika a Příslušenství (existující)",
    [TOP_PET]: "Chovatelské potřeby (existující)",
    [SUB_VYTVARNE]: "Umění → Výtvarné potřeby (existující)",
    "(existující)": "Existující podkategorie (audio, Wi-Fi kamery)",
  };
  for (const [name, count] of [...topOf.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${existingLabels[name] ?? name}`);
  }
  if (warnings.length) {
    console.log(`\n⚠ Varování:`);
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
  console.log(`\nUkázka (prvních 10):`);
  for (const product of products.slice(0, 10)) {
    console.log(`  ${product.price.toFixed(0).padStart(6)} Kč  ${product.name}  [${product.categorySlug}]${product.priceImputed ? " (cena medián)" : ""}`);
  }
}

// ── Aplikace přes PostgREST (Supabase Data API) ─────────────────────────────
// Vkládá kategorie (tops → subs s parent_id) a produkty; idempotentní díky
// Prefer: resolution=ignore-duplicates nad UNIQUE(slug).
async function applyToDb(products, usedSubs) {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Chybí SUPABASE_URL nebo SUPABASE_SECRET_KEY (spusť přes: node --env-file=.env.local … --apply)");
  }
  const api = async (table, params, method, body, prefer) => {
    const response = await fetch(`${url}/rest/v1/${table}?${params}`, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) throw new Error(`${table} ${method} → ${response.status}: ${(await response.text()).slice(0, 400)}`);
    return response;
  };

  // 1) Existující kategorie (pro napojení parent_id a category_id).
  const existing = await (await api("store_categories", "select=id,slug", "GET")).json();

  // 2) Nové top kategorie, pak subkategorie s parent_id.
  for (const top of NEW_TOPS) {
    if (existing.some((category) => category.slug === top.slug)) continue;
    await api("store_categories", "on_conflict=slug", "POST", { name: top.name, slug: top.slug, icon: top.icon, sort_order: top.sort }, "resolution=merge-duplicates,return=minimal");
  }
  const categoriesAfterTops = await (await api("store_categories", "select=id,slug", "GET")).json();
  for (const sub of usedSubs) {
    if (existing.some((category) => category.slug === sub.slug)) continue;
    const parent = categoriesAfterTops.find((category) => category.slug === sub.parent);
    if (!parent) throw new Error(`Parent kategorie „${sub.parent}" pro „${sub.slug}" nenalezen`);
    await api("store_categories", "on_conflict=slug", "POST", { name: sub.name, slug: sub.slug, sort_order: sub.sort, parent_id: parent.id }, "resolution=merge-duplicates,return=minimal");
  }

  // 3) Produkty ve várkách po 200; category_id dle aktuální mapy slug→id.
  const categoryIds = new Map(
    (await (await api("store_categories", "select=id,slug", "GET")).json()).map((category) => [category.slug, category.id])
  );
  let applied = 0;
  for (const batch of chunk(products, 200)) {
    const payload = batch.map((product) => ({
      category_id: categoryIds.get(product.categorySlug) ?? null,
      name: product.name,
      slug: product.slug,
      description: product.description,
      short_desc: product.shortDesc,
      price: product.price.toFixed(2),
      type: "physical",
      stock: 0,
      images: BRAND_IMAGES[product.brand] ? [BRAND_IMAGES[product.brand]] : null,
      variant_group: product.variantGroup,
      variant_label: product.variantLabel,
      brand: product.brand,
      is_active: true,
      is_sellable: false,
      allow_backorder: false,
      featured: false
    }));
    await api("store_products", "on_conflict=slug", "POST", payload, "resolution=merge-duplicates,return=minimal");
    applied += batch.length;
    console.log(`  vloženo ${applied}/${products.length}`);
  }

  const [{ count }] = await (await api("store_products", "select=count", "GET", undefined, "count=exact")).json();
  console.log(`\nHotovo — store_products nyní obsahuje ${count} řádků.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const apply = args.includes("--apply");
  const xlsxPath = resolve(args.find((arg) => !arg.startsWith("--")) ?? DEFAULT_XLSX);

  console.log(`Zdroj: ${xlsxPath}`);
  const rows = await loadRows(xlsxPath);
  const { products: cleaned, droppedPackRows } = collapsePackVariants(rows);
  const { products, warnings, imputed } = buildProducts(cleaned);

  printReport(rows, products, droppedPackRows, warnings, imputed);

  if (write) {
    const { up, usedSubs } = generateSql(products, xlsxPath.split("/").pop());
    const down = generateDownSql(products, usedSubs);
    const base = join(ROOT, "supabase/sql/store/migrations/202611120001_sourcing_catalog");
    await mkdir(dirname(base), { recursive: true });
    await writeFile(`${base}_up.sql`, up, "utf8");
    await writeFile(`${base}_down.sql`, down, "utf8");
    console.log(`\nZapsáno:\n  ${base}_up.sql\n  ${base}_down.sql`);
  }

  if (apply) {
    console.log(`\nAplikuji na Supabase (${process.env.SUPABASE_URL ?? "?"})…`);
    const newSubs = new Map();
    for (const target of Object.values(CATEGORY_MAP)) {
      if (!target.existing) newSubs.set(target.slug, target);
    }
    const usedSlugs = new Set(products.map((p) => p.categorySlug));
    const usedSubs = [...newSubs.values()].filter((sub) => usedSlugs.has(sub.slug));
    await applyToDb(products, usedSubs);
    return;
  }

  if (!write) console.log(`\n(dry-run — pro zápis SQL přidej --write, pro import do DB --apply)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
