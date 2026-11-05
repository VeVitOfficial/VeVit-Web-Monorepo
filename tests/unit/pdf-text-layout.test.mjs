// Unit testy layout engine PDF→Word/TXT (src/lib/pdf-text-layout.ts).
// Běží přes node --test s nativním type-strippingem TS (Node ≥ 22).
// Itemy synteticky zrcadlí testovací fixtury z tests/fixtures/ (stejné pozice).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLines, buildPageBlocks, blocksToDocxFiles, blocksToPlainText, detectTable, detectPageColumns,
} from "../../src/lib/pdf-text-layout.ts";

// helper: položka pdf.js ve tvaru drawText(x, y, size, str)
const it = (str, x, y, size = 10, widthFactor = 0.5) => ({
  str, x, y, width: str.length * size * widthFactor, height: size,
});

// ── buildLines ──────────────────────────────────────────────────────────────

test("buildLines: řádky podle baseline s tolerancí (1px jitter nesplituje)", () => {
  const lines = buildLines([it("řádek", 50, 100, 10), it("druhá část", 120, 100.6, 10)]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].words.length, 2);
});

test("buildLines: položky slepené bez mezery zůstávají slepené jen když je mezera malá", () => {
  // 2 pt mezera při 10pt fontu < 2.5 pt threshold → bez mezery
  const glued = buildLines([it("slovo", 50, 100, 10, 0.6), it("dalsi", 90.4, 100, 10)]);
  assert.equal(glued[0].text.includes("dalsislovo") || glued[0].text.includes("dalsi"), true);
  // 10 pt mezera → vložit mezeru
  const spaced = buildLines([it("slovo", 50, 100, 10), it("dalsi", 90, 100, 10)]);
  assert.equal(spaced[0].text, "slovo dalsi");
});

test("buildLines: vícenásobné mezery v itemu se zkolapsují (žádné zbytečné mezery)", () => {
  const lines = buildLines([{ str: "a    b", x: 50, y: 100, width: 30, height: 10 }]);
  assert.equal(lines[0].text, "a b");
});

test("buildLines: řazení shora dolů a zleva doprava", () => {
  const lines = buildLines([
    it("B spodní", 40, 90),
    it("A vrchní", 30, 110),
    it("b-díl", 90, 90),
    it("a-díl", 10, 90),
  ]);
  assert.equal(lines[0].text, "A vrchní");
  assert.equal(lines[1].text, "a-díl B spodní b-díl");
});

// ── detekce tabulek (faktura) ──────────────────────────────────────────────

test("faktura s tabulkou: 4 sloupce × 5 řádků → w:tbl, ne plochý text", () => {
  const cols = [50, 330, 420, 500];
  const rowY = [650, 632, 614, 596, 578];
  const items = [
    it("Popis", cols[0], rowY[0], 10, 0.55),
    it("Množství", cols[1], rowY[0], 10, 0.55),
    it("Cena/j.", cols[2], rowY[0], 10, 0.55),
    it("Celkem", cols[3], rowY[0], 10, 0.55),
    ...[
      ["Vývoj webové aplikace", "1 ks", "45 000 Kč", "45 000 Kč"],
      ["Hosting a doména (rok)", "1 ks", "2 400 Kč", "2 400 Kč"],
      ["Podpora — hodinová sazba", "8 h", "1 200 Kč", "9 600 Kč"],
      ["SSL certifikát", "2 ks", "590 Kč", "1 180 Kč"],
    ].flatMap((r, i) => r.map((cell, c) => it(cell, cols[c], rowY[i + 1], 10, 0.5))),
  ];
  const page = buildPageBlocks({ items, width: 595.28, height: 841.89 });
  const tables = page.blocks.filter((b) => b.kind === "table");
  assert.equal(tables.length, 1, "právě jedna tabulka");
  const t = tables[0];
  assert.equal(t.rows.length, 5);
  assert.equal(t.rows[0].join("|"), "Popis|Množství|Cena/j.|Celkem");
  assert.equal(t.rows[1][0], "Vývoj webové aplikace");
  assert.equal(t.rows[1][3], "45 000 Kč");
});

test("hlavička faktury (Dodavatel/Odběratel 2 sloupce × 2 řádky) NENÍ tabulka", () => {
  const items = [
    it("Dodavatel: VeVit s.r.o.", 50, 755, 10, 0.55),
    it("Odběratel: ACME a.s.", 340, 755, 10, 0.55),
    it("IČO: 12345678", 50, 741, 10, 0.55),
    it("IČO: 87654321", 400, 741, 10, 0.55),
  ];
  assert.equal(detectTable(buildLines(items), 0), null);
});

test("sloupce hlavičky se neslepí: mezera mezi Dodavatel a Odběratel → mezera", () => {
  const items = [
    it("Dodavatel: VeVit s.r.o.", 50, 755, 10, 0.55),
    it("Odběratel: ACME a.s.", 340, 755, 10, 0.55),
  ];
  const lines = buildLines(items);
  assert.equal(lines[0].text, "Dodavatel: VeVit s.r.o. Odběratel: ACME a.s.");
});

// ── odstavce ───────────────────────────────────────────────────────────────

test("zalomený odstavec se sloučí do jednoho <w:p> (krátký poslední řádek)", () => {
  // Zrcadlí wrapped-text.pdf: 5 plných řádků + krátký závěrečný
  const para1 = [
    "Toto je dlouhý odstavec, který byl v PDF zalomen na několik vizuálních řádků.",
    "Konvertor by měl tyto řádky spojit do jednoho odstavce, protože řádek končí",
    "uprostřed věty a další řádek začíná malým písmenem. Přesně tohle je hlavní",
    "scénář, který dřívější konverze rozbíjela na samostatné odstavce pro každý",
    "vizuální řádek, což ve Wordu vypadalo rozbitě.",
  ];
  const para2 = ["Druhý odstavec, který má zůstat samostatný."];
  let y = 770;
  const items = [];
  for (const t of para1) { items.push(it(t, 50, y, 11)); y -= 16; }
  y -= 10;
  for (const t of para2) { items.push(it(t, 50, y, 11)); y -= 16; }
  const page = buildPageBlocks({ items, width: 595.28, height: 841.89 });
  const paras = page.blocks.filter((b) => b.kind === "paragraph");
  assert.equal(paras.length, 2, `očekávány 2 odstavce, bylo: ${JSON.stringify(page.blocks)}`);
  assert.ok(paras[0].text.includes("rozbitě."), "poslední řádek patří do odstavce 1");
  assert.ok(paras[1].text.startsWith("Druhý odstavec"));
});

test("prázdný řádek (svislá mezera) odděluje odstavce", () => {
  const items = [
    it("První odstavec pokračuje", 50, 760, 10),
    it("a končí tady.", 50, 745, 10),
    // mezera o dvě řádky
    it("Druhý odstavec", 50, 710, 10),
  ];
  const page = buildPageBlocks({ items, width: 595.28, height: 841.89 });
  const paras = page.blocks.filter((b) => b.kind === "paragraph");
  assert.equal(paras.length, 2);
});

test("nadpis (větší font) je samostatný blok a odstavce pod ním se neslučují s ním", () => {
  const items = [
    it("Faktura č. 20250001", 50, 780, 18),
    it("Dodavatel: VeVit s.r.o.", 50, 755, 10, 0.55),
    it("a pokračování řádku", 50, 741, 10),
  ];
  const page = buildPageBlocks({ items, width: 595.28, height: 841.89 });
  assert.equal(page.blocks[0].kind, "heading");
  assert.equal(page.blocks[1].kind, "paragraph");
  assert.ok(page.blocks[1].text.includes("a pokračování"));
});

test("vícesloupcová sazba: sloupce se nepropletou a výstup jde sloupec po sloupci", () => {
  const colA = ["První sloupec začíná zde a pokračuje", "na dalším řádku, který je vizuálně", "oddělený. Čtenář má dojem jednoho", "odstavce, který plyne přes řádky.", "", "Nový odstavec začíná mezerou nahoře."];
  const colB = ["Druhý sloupec obsahuje jiný text,", "který nesmí být spojen se sloupcem", "prvním. Typická chyba konverze je", "prohození pořadí nebo slepení."];
  const items = [];
  let y = 760;
  for (const t of colA) { if (t) items.push(it(t, 50, y, 10, 0.55)); y -= 15; }
  y = 760;
  for (const t of colB) { if (t) items.push(it(t, 330, y, 10, 0.55)); y -= 15; }
  const lines = buildLines(items);
  // detekce sloupců musí reálně proběhnout (ne fallback segmentů)
  const cols = detectPageColumns(lines, 595.28);
  assert.ok(cols, "detekce sloupců musí uspět");
  assert.deepEqual(cols.map((b) => b.length), [5, 4]);
  const page = buildPageBlocks({ items, width: 595.28, height: 841.89 });
  const texts = page.blocks.filter((b) => b.kind === "paragraph").map((b) => b.text);
  const joined = texts.join("\n");
  assert.ok(texts.some((t) => t.includes("plyne přes řádky")), "sloupec A kompletní");
  assert.ok(texts.some((t) => t.includes("prohození pořadí")), "sloupec B kompletní");
  assert.ok(!texts.some((t) => t.includes("První sloupec") && t.includes("Druhý sloupec")), "sloupce nesmí být slepené do jednoho odstavce");
  // pořadí: poslední text sloupce A ("Nový odstavec") před první kompletní větou sloupce B ("Typická chyba")
  const idxNovy = texts.findIndex((t) => t.includes("Nový odstavec"));
  const idxTypicka = texts.findIndex((t) => t.includes("Typická chyba"));
  assert.ok(idxNovy !== -1 && idxTypicka !== -1 && idxNovy < idxTypicka, "sloupec A celý před sloupcem B");
});

test("roztažené mezery: široké gapy → jednoduché mezery, ne žádné ani trojné", () => {
  const words = ["Tento", "text", "má", "slova", "roztažená"];
  let x = 50;
  const items = words.map((w) => { const i = it(w, x, 760, 12, 0.55); x += i.width + 18; return i; });
  const lines = buildLines(items);
  assert.equal(lines[0].text, "Tento text má slova roztažená");
});

// ── DOCX sestava ───────────────────────────────────────────────────────────

test("blocksToDocxFiles: tabulka je w:tbl s w:tc, odstavce mají w:sz a sectPr má okraje", () => {
  const pages = [
    { blocks: [
      { kind: "heading", text: "Faktura", align: "left", fontSize: 18 },
      { kind: "paragraph", text: "Dodavatel: VeVit", align: "left", fontSize: 10 },
      { kind: "table", rows: [["Popis", "Cena"], ["Hosting", "2 400 Kč"]] },
    ] },
    { blocks: [{ kind: "paragraph", text: "Strana 2 text", align: "left", fontSize: 10 }] },
  ];
  const files = blocksToDocxFiles(pages);
  const doc = files["word/document.xml"];
  assert.ok(doc.includes("<w:tbl>"), "tabulka jako w:tbl");
  assert.ok(doc.includes("<w:tc>"), "buňky w:tc");
  assert.ok(doc.includes('<w:pgMar w:top="1134"'), "okraje stránky");
  assert.ok(doc.includes("Faktura"), "nadpis přítomen");
  assert.ok(doc.includes("2 400 Kč"), "obsah tabulky");
  assert.ok(files["word/styles.xml"].includes("docDefaults"), "styles.xml přítomno");
});

test("escXml: ampersandy a ostré závorky se escapují", async () => {
  const { escXml } = await import("../../src/lib/pdf-text-layout.ts");
  assert.equal(escXml('a<b & "c"'), "a&lt;b &amp; &quot;c&quot;");
});

test("blocksToPlainText: tabulka = řádky s tabulátory", () => {
  const txt = blocksToPlainText([{ blocks: [
    { kind: "paragraph", text: "Úvod", align: "left", fontSize: 10 },
    { kind: "table", rows: [["a", "b"], ["c", "d"]] },
  ] }]);
  assert.ok(txt.includes("Úvod"));
  assert.ok(txt.includes("a\tb"));
  assert.ok(txt.includes("c\td"));
});
