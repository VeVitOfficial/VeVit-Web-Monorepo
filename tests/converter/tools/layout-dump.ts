// Dev tool: print the reconstructed block tree (layout.ts) of a corpus PDF.
//   node tests/converter/tools/layout-dump.ts <file.pdf> [page]
import { readFileSync } from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractPage } from "../../../src/lib/converter/pdf/extract.ts";
import { buildLines, layoutPage, bodySizeOf, headingSizes, marginsOf, rulesAndFills, lineText } from "../../../src/lib/converter/pdf/layout.ts";
import { mapFont } from "../../../src/lib/converter/pdf/fontmap.ts";
import type { Block } from "../../../src/lib/converter/pdf/model.ts";

const [file, pageArg] = process.argv.slice(2);
const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(file)), fontExtraProperties: true }).promise;
const page = await doc.getPage(Number(pageArg ?? 1));
const m = await extractPage(pdfjs as never, page, 0);
const lines = buildLines(m.glyphs);
const body = bodySizeOf([m]);
console.log("lines:"); for (const l of lines.slice(0, 40)) console.log(`  y=${l.base.toFixed(1)} x=${l.x0.toFixed(1)}-${l.x1.toFixed(1)} s=${l.size} segs=${l.segs.length} ${JSON.stringify(lineText(l).slice(0, 70))}`);
const { rules } = rulesAndFills(m.paths);
console.log("rules:", rules.map((r) => `${r.horiz ? "H" : "V"}(${r.x0.toFixed(0)}-${r.x1.toFixed(0)},${r.y0.toFixed(0)}-${r.y1.toFixed(0)})`).join(" "));
const margins = marginsOf(m, lines);
const blocks = layoutPage(m, lines, margins, m.fonts, { bodySize: body, headingSizes: headingSizes(lines, body), fontMap: (f) => mapFont(f), links: m.links }, []);
const show = (bs: Block[], ind: string) => {
  for (const b of bs) {
    if (b.kind === "para") console.log(`${ind}P top=${b.top.toFixed(1)} al=${b.align} h=${b.heading ?? ""} list=${b.list?.marker ?? ""} line=${b.line?.toFixed(1) ?? "-"} ind=${b.indLeft.toFixed(0)}/${b.indFirst.toFixed(0)} ${JSON.stringify(b.runs.map((r) => r.text).join("").slice(0, 60))}`);
    else if (b.kind === "table") { console.log(`${ind}T${b.layout ? "(layout)" : ""} x=${b.x.toFixed(0)} cols=${b.colWidths.map((w) => w.toFixed(0)).join(",")} rows=${b.rows.length} top=${b.top.toFixed(0)} bottom=${b.bottom.toFixed(0)}`); b.rows.slice(0, 4).forEach((r, i) => r.cells.forEach((c, k) => { console.log(`${ind}  [${i},${k}] span=${c.span}${c.vMerge ? " v=" + c.vMerge : ""}`); show(c.blocks, ind + "    "); })); }
    else console.log(`${ind}${b.kind}`);
  }
};
show(blocks, "");
