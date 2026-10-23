// Smoke test běžícího serveru: hub, 3 kategorie, 16 levelů (+ tisk), 16 teorií a 80 lekcí,
// průvodce, online kurz a stránky učitele a admina. Spuštění: `npm run smoke:aifb` (server na
// BASE_URL, výchozí http://localhost:3000; potřebuje `npm run dev`, nebo `npm start` s AIFB_TEST_ROLES=1).
// Obsah se prochází v roli admina (testovací cookie aifb_test_role) a každá stránka musí vrátit 200
// a <h1>. Potom se ověří přesměrování podle role: veřejnost na online kurz, student mimo svou třídu
// na rozcestník. S E2E_PRODUCTION=1 čeká veřejnost u modulů kurzu ve stavu návrhu 404.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src/content/aifb");
const prefix = `${base}/cs/edu/ai-gramotnost`;
const production = process.env.E2E_PRODUCTION === "1";

/** { url, role, status, location? }: role = hodnota testovací cookie, null = veřejnost. */
const checks = [];
const admin = (url) => checks.push({ url, role: "admin", status: 200 });

admin(prefix);
for (const category of ["zs1", "zs2", "ss"]) {
  const content = JSON.parse(readFileSync(join(dir, `aifb-content-${category}.json`), "utf8"));
  admin(`${prefix}/aifb/${category}`);
  admin(`${prefix}/aifb/${category}/pro-ucitele`);
  for (const level of content.levels) {
    const levelSlug = level.id.slice(category.length + 1);
    admin(`${prefix}/aifb/${category}/${levelSlug}`);
    admin(`${prefix}/aifb/${category}/${levelSlug}/tisk`);
    for (const lesson of level.lessons) admin(`${prefix}/aifb/${category}/${levelSlug}/${lesson.id.slice(level.id.length + 1)}`);
  }
}

const course = JSON.parse(readFileSync(join(dir, "aifb-kurz.json"), "utf8"));
const courseUrls = [`${prefix}/kurz`];
for (const mod of course.modules) {
  const moduleUrl = `${prefix}/kurz/${mod.id.slice("kurz-".length)}`;
  courseUrls.push(moduleUrl, `${moduleUrl}/teorie`, ...mod.lessons.map((lesson) => `${moduleUrl}/${lesson.id.slice(mod.id.length + 1)}`));
}
// Admin vidí kurz vždy (i návrh); veřejnost na produkci jen zprávu „připravuje se“ a moduly 404.
courseUrls.forEach(admin);
const publicModuleStatus = course.status === "draft" && production ? 404 : 200;
checks.push({ url: `${prefix}/kurz`, role: null, status: 200 });
checks.push({ url: courseUrls[1], role: null, status: publicModuleStatus });

admin(`${prefix}/ucitel`);
admin(`${prefix}/upravy`);
admin(`${prefix}/upravy?doc=kurz&path=${encodeURIComponent("modules/[kurz-m1]")}`);
admin(`${prefix}/upravy?doc=zs1&path=${encodeURIComponent("levels/[zs1-blok-a]/lessons/[zs1-blok-a-cv1]")}`);
checks.push({ url: `${base}/cs/edu/skoly`, role: null, status: 200 });

// Přesměrování podle role.
const toCourse = { status: 307, location: /\/cs\/edu\/ai-gramotnost\/kurz$/ };
const toHub = { status: 307, location: /\/cs\/edu\/ai-gramotnost$/ };
for (const path of ["", "/aifb/zs1", "/aifb/zs1/blok-a", "/aifb/zs1/blok-a/cv1", "/aifb/zs1/pro-ucitele", "/aifb/zs1/blok-a/tisk", "/ucitel", "/upravy"]) {
  checks.push({ url: `${prefix}${path}`, role: null, ...toCourse });
}
const student = "student:zs1:zs1-blok-a-teorie,zs1-blok-a-cv1";
checks.push({ url: `${prefix}/aifb/zs1/blok-a/cv1`, role: student, status: 200 });
checks.push({ url: `${prefix}/aifb/zs1/blok-a/cv2`, role: student, status: 200 }); // stránka „Lekce je zatím zamčená“
for (const path of ["/aifb/zs2", "/aifb/zs1/pro-ucitele", "/aifb/zs1/blok-a/tisk", "/ucitel", "/upravy"]) {
  checks.push({ url: `${prefix}${path}`, role: student, ...toHub });
}
checks.push({ url: `${prefix}/upravy`, role: "teacher", ...toHub });

let failures = 0;
const pool = 6;
let next = 0;
async function worker() {
  while (next < checks.length) {
    const check = checks[next++];
    const label = `${check.url} [${check.role ?? "veřejnost"}]`;
    try {
      const res = await fetch(check.url, {
        redirect: "manual",
        headers: check.role ? { Cookie: `aifb_test_role=${check.role}` } : {},
      });
      const html = await res.text();
      const location = res.headers.get("location") ?? "";
      if (res.status !== check.status) {
        failures += 1;
        console.error(`FAIL ${res.status} ≠ ${check.status} ${label}${location ? ` → ${location}` : ""}`);
      } else if (check.location && !check.location.test(new URL(location, base).pathname)) {
        failures += 1;
        console.error(`FAIL přesměrování na ${location} ${label}`);
      } else if (check.status === 200 && !/<h1[\s>]/.test(html)) {
        failures += 1;
        console.error(`FAIL chybí <h1> ${label}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${label}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: pool }, worker));
console.log(`${checks.length - failures}/${checks.length} kontrol v pořádku`);
process.exit(failures === 0 ? 0 : 1);
