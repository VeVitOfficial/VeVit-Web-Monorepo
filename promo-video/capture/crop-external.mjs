// Výřezy ze snímků webů vevit.space a vevit.art (pořízeno 29. 9. 2026).
// Do repozitáře jdou jen výřezy – bez fotografií a tvorby členů komunity VeVit Art.
// Použití: node capture/crop-external.mjs <space-top.png> <space-full.png> <art-top.png>
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [spaceTop, spaceFull, artTop] = process.argv.slice(2).map((file) => path.resolve(file));
const OUT = fileURLToPath(new URL("../public/external/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const CROPS = [
  [spaceTop, "space-hero", { x: 300, y: 140, width: 840, height: 240 }],
  [spaceFull, "space-process", { x: 90, y: 7565, width: 1260, height: 180 }],
  [spaceFull, "space-pricing", { x: 90, y: 6640, width: 1260, height: 560 }],
  [artTop, "art-hero", { x: 100, y: 270, width: 600, height: 440 }],
];

const browser = await chromium.launch({ executablePath: process.env.PROMO_CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [source, name, clip] of CROPS) {
  const html = path.join(OUT, ".crop.html");
  writeFileSync(html, `<html><body style="margin:0"><img src="file://${source}"></body></html>`);
  await page.goto(`file://${html}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: "jpeg", quality: 90, clip, fullPage: true });
  console.log(`✓ ${name}`);
}
await browser.close();
