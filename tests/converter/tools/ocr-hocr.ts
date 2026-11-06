// Dev tool: OCR words from a tesseract CLI hOCR file (same shape as tesseract.js output) →
// OcrWord[] for src/lib/converter/pdf/ocr.ts, so the scan pipeline can be debugged in Node.
import { readFileSync } from "node:fs";
import type { OcrWord } from "../../../src/lib/converter/protocol.ts";

export function hocrWords(file: string): OcrWord[] {
  const h = readFileSync(file, "utf8");
  const words: OcrWord[] = [];
  for (const lm of h.matchAll(/class='ocr_(?:line|header|caption|textfloat)'[^>]*title="bbox (\d+) (\d+) (\d+) (\d+); baseline ([-\d.]+) ([-\d.]+); x_size ([\d.]+)[^"]*"[^>]*>([\s\S]*?)<\/span>\s*(?=<span class='ocr_(?:line|header|caption|textfloat)'|<\/p>)/g)) {
    const x0 = +lm[1], y1 = +lm[4], slope = +lm[5], off = +lm[6], xs = +lm[7];
    for (const wm of lm[8].matchAll(/title='bbox (\d+) (\d+) (\d+) (\d+); x_wconf (\d+)'[^>]*>([^<]*)</g)) {
      const cx = (+wm[1] + +wm[3]) / 2;
      words.push({ text: wm[6].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"), x0: +wm[1], y0: +wm[2], x1: +wm[3], y1: +wm[4], confidence: +wm[5] / 100, base: y1 + off + slope * (cx - x0), rowHeight: xs, slope });
    }
  }
  return words;
}
