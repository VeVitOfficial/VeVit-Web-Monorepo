// Náhledové snímky ze všech scén (kontrola čitelnosti, zarovnání, načasování).
// Použití: npm run stills [-- Promo|PromoVertical] [-- --frames=120,450]
// Výstup: out/stills/<kompozice>/<scéna>-<snímek>.jpg
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const compositions = args.filter((arg) => !arg.startsWith("--"));
const explicit = args.find((arg) => arg.startsWith("--frames="))?.slice(9).split(",").map(Number);

// Začátky scén spočítané ze src/timeline.ts (přechody se překrývají).
const timeline = readFileSync(path.join(ROOT, "src/timeline.ts"), "utf8");
const scenes = [...timeline.matchAll(/^\s+(\w+): (\d+),$/gm)].map((match) => [match[1], Number(match[2])]);
const transition = Number(timeline.match(/TRANSITION = (\d+)/)[1]);
const samples = [];
let start = 0;
for (const [name, length] of scenes) {
  // Začátek (po přechodu), střed a konec scény.
  for (const [label, offset] of [["a", transition + 12], ["b", Math.round(length * 0.55)], ["c", length - transition - 4]]) {
    samples.push({ name: `${name}-${label}`, frame: start + offset });
  }
  start += length - transition;
}

const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts"), publicDir: path.join(ROOT, "public") });
for (const id of compositions.length ? compositions : ["Promo", "PromoVertical"]) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable: process.env.PROMO_CHROMIUM || null });
  const dir = path.join(ROOT, "out/stills", id);
  mkdirSync(dir, { recursive: true });
  const list = explicit ? explicit.map((frame) => ({ name: "frame", frame })) : samples;
  for (const { name, frame } of list) {
    const output = path.join(dir, `${name}-${String(frame).padStart(4, "0")}.jpg`);
    await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 85, browserExecutable: process.env.PROMO_CHROMIUM || null });
    console.log(`✓ ${id} ${name} @${frame}`);
  }
}
