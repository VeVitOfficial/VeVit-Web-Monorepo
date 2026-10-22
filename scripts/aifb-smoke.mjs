// Smoke test běžícího serveru: hub, 3 kategorie, 16 levelů (+ tisk), 96 lekcí (učitel i projekce)
// a průvodce. Každá stránka musí vrátit 200 a obsahovat <h1>. Spuštění: `npm run smoke:aifb`
// (server na BASE_URL, výchozí http://localhost:3000; potřebuje `npm run dev` nebo `npm start`).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src/content/aifb");
const prefix = `${base}/cs/edu/ai-gramotnost`;
const urls = [prefix];
for (const category of ["zs1", "zs2", "ss"]) {
  const content = JSON.parse(readFileSync(join(dir, `aifb-content-${category}.json`), "utf8"));
  urls.push(`${prefix}/aifb/${category}`, `${prefix}/aifb/${category}/pro-ucitele`);
  for (const level of content.levels) {
    const levelSlug = level.id.slice(category.length + 1);
    urls.push(`${prefix}/aifb/${category}/${levelSlug}`, `${prefix}/aifb/${category}/${levelSlug}/tisk`);
    for (const lesson of level.lessons) {
      const slug = lesson.id.slice(level.id.length + 1);
      urls.push(`${prefix}/aifb/${category}/${levelSlug}/${slug}`, `${prefix}/aifb/${category}/${levelSlug}/${slug}?rezim=projekce`, `${prefix}/aifb/${category}/${levelSlug}/${slug}?rezim=zak`);
    }
  }
}

let failures = 0;
const pool = 6;
let next = 0;
async function worker() {
  while (next < urls.length) {
    const url = urls[next++];
    try {
      const res = await fetch(url);
      const html = await res.text();
      if (res.status !== 200 || !/<h1[\s>]/.test(html)) {
        failures += 1;
        console.error(`FAIL ${res.status} ${url}${res.status === 200 ? " (chybí <h1>)" : ""}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${url}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: pool }, worker));
console.log(`${urls.length - failures}/${urls.length} stránek v pořádku`);
process.exit(failures === 0 ? 0 : 1);
