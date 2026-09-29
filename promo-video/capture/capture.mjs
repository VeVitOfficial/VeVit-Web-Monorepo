// Natáčení záběrů UI pro promo video.
//
// Předpoklady: běží aplikace proti mocku (npm run app:start) a je nastavené
// písmo (npm run fonts:setup). Výstup: public/captures/{desktop,mobile}/*.jpg
// a src/captures.json s rozměry a počty snímků sekvencí pro Remotion.
//
// Spuštění: npm run capture            (vše)
//           npm run capture -- desktop (jen desktop), -- mobile, -- qr …
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASE = process.env.PROMO_BASE_URL || "http://localhost:3000";
const OUT = path.join(ROOT, "public/captures");
const MANIFEST = path.join(ROOT, "src/captures.json");
const SAMPLES = path.join(ROOT, ".cache/samples");
const QUALITY = 88;
const ONLY = process.argv.slice(2);

const DEMO_TOKEN = createHash("sha256").update("vevit-promo-demo-session").digest("hex");

// Lokální postup v Edu (localStorage) – ať kurzy neukazují 0 %.
const PYTHON_DONE = [
  "python-01-ahoj-světe", "python-02-proměnné-a-datové-typy", "python-03-základní-operace",
  "python-04-podmínky-ifelse", "python-05-smyčka-for", "python-06-smyčka-while", "python-07-seznamy-list",
  "python-08-řetězce-podrobně", "python-09-slovníky-dict", "python-10-n-tice-a-množiny",
  "python-11-funkce-základy", "python-12-rozsah-proměnných",
];
const EDU_PROGRESS = { completedLessons: PYTHON_DONE, completedExercises: {}, quizScores: {}, lastVisitedLesson: "python-13-funkce-pokročilé" };
const AIGRAM_PROGRESS = {
  completedLessons: [100, 101, 102, 103, 104, 105], totalXp: 155, streak: 4, longestStreak: 6,
  lastActivity: new Date().toISOString().slice(0, 10), achievements: [1], exerciseBest: {},
};

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

function wanted(...tags) {
  return ONLY.length === 0 || tags.some((tag) => ONLY.includes(tag));
}

async function newContext(browser, device) {
  const mobile = device === "mobile";
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1600, height: 900 },
    deviceScaleFactor: mobile ? 3 : 2,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: "dark",
    locale: "cs-CZ",
    timezoneId: "Europe/Prague",
  });
  await context.addCookies([{ name: "__vvsession", value: DEMO_TOKEN, domain: new URL(BASE).hostname, path: "/" }]);
  await context.addInitScript(({ edu, aigram }) => {
    try {
      localStorage.setItem("vevit-ai-progress", JSON.stringify(edu));
      localStorage.setItem("aigram_progress_v1", JSON.stringify(aigram));
    } catch { /* ignorujeme */ }
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      // Skryje vývojářský indikátor Next.js, posuvníky a blikající kurzor.
      style.textContent = "nextjs-portal{display:none!important} html{scrollbar-width:none} ::-webkit-scrollbar{display:none} *{caret-color:transparent!important}";
      document.head.appendChild(style);
    });
  }, { edu: EDU_PROGRESS, aigram: AIGRAM_PROGRESS });
  return context;
}

async function open(context, route, wait = 1500) {
  const page = await context.newPage();
  page.on("pageerror", (error) => console.warn(`  ! ${route}: ${error.message}`));
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(wait);
  return page;
}

function target(device, name) {
  const dir = path.join(OUT, device);
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `${name}.jpg`);
}

/** Snímek od shora stránky do výšky `height` CSS px (nebo viewport). */
async function shot(page, device, name, { height, y = 0 } = {}) {
  const viewport = page.viewportSize();
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const h = Math.min(height ?? viewport.height, docHeight - y);
  await page.screenshot({ path: target(device, name), type: "jpeg", quality: QUALITY, fullPage: true, clip: { x: 0, y, width: viewport.width, height: h } });
  manifest[`${device}/${name}`] = { width: viewport.width, height: h, frames: 1 };
  console.log(`  ✓ ${device}/${name} (${viewport.width}×${h})`);
}

/** Sekvence snímků (animace psaní apod.) – každý krok zavolá `step(i)`. */
async function sequence(page, device, name, steps, clip) {
  const dir = path.join(OUT, device, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (let index = 0; index < steps.length; index++) {
    await steps[index]();
    await page.waitForTimeout(350);
    const viewport = page.viewportSize();
    const area = clip ?? { x: 0, y: 0, width: viewport.width, height: viewport.height };
    await page.screenshot({ path: path.join(dir, `${String(index).padStart(3, "0")}.jpg`), type: "jpeg", quality: QUALITY, clip: area });
  }
  const area = clip ?? { width: page.viewportSize().width, height: page.viewportSize().height };
  manifest[`${device}/${name}`] = { width: area.width, height: area.height, frames: steps.length };
  console.log(`  ✓ ${device}/${name} (${steps.length} snímků)`);
}

async function scrollTo(page, selectorOrY, offset = 0) {
  await page.evaluate(({ selectorOrY, offset }) => {
    const y = typeof selectorOrY === "number"
      ? selectorOrY
      : (document.querySelector(selectorOrY)?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo(0, Math.max(0, y - offset));
  }, { selectorOrY, offset });
  await page.waitForTimeout(400);
}

// Ukázkové PDF pro nástroje (vymyšlený obsah, s velkým obrázkem, ať je co komprimovat).
async function makeSamples(browser) {
  mkdirSync(SAMPLES, { recursive: true });
  const page = await browser.newPage();
  const docs = [
    ["Smlouva_o_dilo.pdf", "Smlouva o dílo", "Zhotovitel: Truhlářství Dřevěnka s.r.o. · Objednatel: Kavárna U Mlýnku"],
    ["Priloha_A_rozpocet.pdf", "Příloha A – Rozpočet", "Položkový rozpočet zakázky, ceny bez DPH."],
    ["Predavaci_protokol.pdf", "Předávací protokol", "Dílo převzato bez vad a nedodělků."],
  ];
  for (const [file, title, text] of docs) {
    await page.setContent(`<html><body style="font-family:Geist,sans-serif;padding:56px;color:#111">
      <h1 style="font-size:30px">${title}</h1><p>${text}</p>
      <canvas id="c" width="1600" height="1100" style="width:100%"></canvas>
      <script>const c=document.getElementById('c').getContext('2d');for(let i=0;i<9000;i++){c.fillStyle='hsl('+(i*7%360)+',60%,'+(35+i%40)+'%)';c.fillRect(Math.random()*1600,Math.random()*1100,24,24);}</script>
      </body></html>`);
    await page.pdf({ path: path.join(SAMPLES, file), format: "A4", printBackground: true });
  }
  await page.close();
}

async function captureDesktop(browser) {
  const device = "desktop";
  const context = await newContext(browser, device);

  if (wanted("desktop", "home")) {
    const page = await open(context, "/cs/home", 3000);
    await shot(page, device, "home-hero");
    await page.close();
  }

  if (wanted("desktop", "tools")) {
    const page = await open(context, "/cs/tools");
    await shot(page, device, "tools-hub-long", { height: 3400 });
    const input = page.locator(".tools-hub input[type=search], .tools-hub input[placeholder*='Hledat']").first();
    await sequence(page, device, "tools-search", [
      async () => {},
      async () => { await input.click(); await input.type("p"); },
      async () => { await input.type("d"); },
      async () => { await input.type("f"); },
    ]);
    await page.close();
  }

  if (wanted("desktop", "qr")) {
    const page = await open(context, "/cs/tools/qr-generator");
    await page.getByText("URL", { exact: true }).first().click();
    await page.locator("input[type='number']").first().fill("5").catch(() => {});
    const field = page.locator("input:not([type=number]):visible").first();
    const url = "https://www.vevit.cz";
    const cuts = [0, 1, 4, 8, 12, 15, 18, url.length];
    // Vyšší okno, ať je vygenerovaný QR kód vidět celý.
    await page.setViewportSize({ width: 1600, height: 1350 });
    await scrollTo(page, 70);
    await sequence(page, device, "tool-qr", cuts.map((cut) => async () => {
      await field.fill(url.slice(0, cut));
    }));
    await page.close();
  }

  if (wanted("desktop", "compress")) {
    const page = await open(context, "/cs/tools/pdf-compress");
    await page.locator("input[type=file]").first().setInputFiles(path.join(SAMPLES, "Smlouva_o_dilo.pdf"));
    await page.getByText("Silná komprese", { exact: false }).click().catch(() => {});
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: /Komprimovat/ }).click();
    await page.getByText("Stáhnout").first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(600);
    await shot(page, device, "tool-compress", { height: 1000 });
    await page.close();
  }

  if (wanted("desktop", "password")) {
    const page = await open(context, "/cs/tools/password-gen");
    await page.getByRole("button", { name: "Generovat", exact: true }).click();
    await page.waitForTimeout(500);
    await shot(page, device, "tool-password", { height: 900 });
    await page.close();
  }

  if (wanted("desktop", "merge")) {
    // Sloučení PDF: pokud nástroj soubory přijme, nafotí se i stav se soubory.
    const page = await open(context, "/cs/tools/pdf-merge");
    await shot(page, device, "tool-merge");
    await page.locator("input[type=file]").first().setInputFiles(["Smlouva_o_dilo.pdf", "Priloha_A_rozpocet.pdf", "Predavaci_protokol.pdf"].map((file) => path.join(SAMPLES, file)));
    await page.waitForTimeout(1200);
    if (await page.getByText("Smlouva_o_dilo.pdf").count()) await shot(page, device, "tool-merge-files", { height: 1000 });
    else console.warn("  ! tool-merge-files: nástroj soubory nepřijal (chyba v pdf-merge.tsx), záběr přeskočen");
    await page.close();
  }

  if (wanted("desktop", "edu")) {
    let page = await open(context, "/cs/edu/programovani", 2000);
    await shot(page, device, "edu-programming", { height: 1900 });
    await page.close();

    page = await open(context, "/cs/edu/kurzy/python", 2000);
    // Horní lišta kurzu má v aplikaci překrývající se drobečkovou navigaci – bereme obsah pod ní.
    await shot(page, device, "edu-python", { y: 70, height: 900 });
    await page.close();
  }

  if (wanted("desktop", "js")) {
    const page = await open(context, "/cs/edu/lekce/javascript-10-pole-arrays/", 2000);
    const editor = page.locator("textarea").first();
    await editor.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const area = document.querySelector("textarea");
      if (area) window.scrollTo(0, area.getBoundingClientRect().top + window.scrollY - 330);
    });
    await page.waitForTimeout(500);
    const lines = [
      "const kurzy = ['Python', 'JavaScript', 'SQL'];",
      "kurzy.forEach((kurz, i) => console.log(`${i + 1}. ${kurz}`));",
      "console.log('Hotovo:', kurzy.length, 'kurzy');",
    ];
    const clip = { x: 0, y: 110, width: 1600, height: 790 };
    await sequence(page, device, "edu-js", [
      async () => { await editor.fill(""); },
      async () => { await editor.fill(lines[0]); },
      async () => { await editor.fill(lines.slice(0, 2).join("\n")); },
      async () => { await editor.fill(lines.join("\n")); },
      async () => { await page.getByRole("button", { name: "Spustit" }).first().click(); await page.waitForTimeout(1200); },
    ], clip);
    await page.close();
  }

  if (wanted("desktop", "ai")) {
    let page = await open(context, "/cs/edu/ai-gramotnost", 2500);
    await shot(page, device, "ai-overview", { height: 1700 });
    await page.close();

    page = await open(context, "/cs/edu/ai-gramotnost/lekce/3-2-struktura-promptu", 2000);
    const answers = ["Ne", "Ne", "Ne", "Ano"];
    const groups = page.locator("fieldset");
    for (let index = 0; index < answers.length; index++) {
      await groups.nth(index).getByText(answers[index], { exact: true }).click().catch(() => {});
    }
    await page.waitForTimeout(600);
    await shot(page, device, "ai-lesson", { height: 1300 });
    await page.close();
  }

  if (wanted("desktop", "services")) {
    let page = await open(context, "/cs/services", 1500);
    await shot(page, device, "svc-home", { height: 1750 });
    await page.close();

    page = await open(context, "/cs/services/poptavky", 1500);
    // Postranní filtr je „sticky“ s výškou okna – vyšší okno, ať není useknutý.
    await page.setViewportSize({ width: 1600, height: 1300 });
    await page.waitForTimeout(500);
    await shot(page, device, "svc-list", { height: 1300 });
    await page.close();

    page = await open(context, "/cs/services/poptavka/11111111-1111-4111-8111-000000000001", 1500);
    await shot(page, device, "svc-detail", { height: 1900 });
    await page.close();
  }

  if (wanted("desktop", "account")) {
    for (const [route, name, height] of [["/cs/account", "acc-overview", 1300], ["/cs/account/billing", "acc-billing", 1000], ["/cs/account/security", "acc-security", 900]]) {
      const page = await open(context, route, 2000);
      await shot(page, device, name, { height });
      await page.close();
    }
  }

  await context.close();
}

async function captureMobile(browser) {
  const device = "mobile";
  const context = await newContext(browser, device);
  const simple = [
    ["home", "/cs/home", "m-home", 844, 3000],
    ["tools", "/cs/tools", "m-tools", 2400, 1500],
    ["edu", "/cs/edu/programovani", "m-edu-programming", 1900, 2000],
    ["ai", "/cs/edu/ai-gramotnost", "m-ai-overview", 2200, 2500],
    ["services", "/cs/services", "m-svc-home", 2400, 1500],
    ["services", "/cs/services/poptavka/11111111-1111-4111-8111-000000000001", "m-svc-detail", 2600, 1500],
    ["account", "/cs/account", "m-acc-overview", 1800, 2000],
    ["account", "/cs/account/billing", "m-acc-billing", 2000, 2000],
  ];
  for (const [tag, route, name, height, wait] of simple) {
    if (!wanted("mobile", tag)) continue;
    const page = await open(context, route, wait);
    await shot(page, device, name, { height });
    await page.close();
  }

  if (wanted("mobile", "qr")) {
    const page = await open(context, "/cs/tools/qr-generator");
    await page.getByText("URL", { exact: true }).first().click();
    const field = page.locator("input:not([type=number]):visible").first();
    const url = "https://www.vevit.cz";
    await scrollTo(page, 60);
    await sequence(page, device, "m-tool-qr", [0, 4, 12, 18, url.length].map((cut) => async () => { await field.fill(url.slice(0, cut)); }));
    await page.close();
  }

  if (wanted("mobile", "compress")) {
    const page = await open(context, "/cs/tools/pdf-compress");
    await page.locator("input[type=file]").first().setInputFiles(path.join(SAMPLES, "Smlouva_o_dilo.pdf"));
    await page.getByText("Silná komprese", { exact: false }).click().catch(() => {});
    await page.getByRole("button", { name: /Komprimovat/ }).click();
    await page.getByText("Stáhnout").first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(600);
    await shot(page, device, "m-tool-compress", { height: 1500 });
    await page.close();
  }

  if (wanted("mobile", "js")) {
    const page = await open(context, "/cs/edu/lekce/javascript-10-pole-arrays/", 2000);
    const editor = page.locator("textarea").first();
    await editor.fill("const kurzy = ['Python', 'JavaScript', 'SQL'];\nkurzy.forEach((kurz, i) => console.log(`${i + 1}. ${kurz}`));\nconsole.log('Hotovo:', kurzy.length, 'kurzy');");
    await page.getByRole("button", { name: "Spustit" }).first().click();
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const area = document.querySelector("textarea");
      if (area) window.scrollTo(0, area.getBoundingClientRect().top + window.scrollY - 240);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: target(device, "m-edu-js"), type: "jpeg", quality: QUALITY });
    manifest[`${device}/m-edu-js`] = { width: 390, height: 844, frames: 1 };
    console.log("  ✓ mobile/m-edu-js");
    await page.close();
  }

  await context.close();
}

const browser = await chromium.launch({ executablePath: process.env.PROMO_CHROMIUM || undefined });
try {
  await makeSamples(browser);
  if (wanted("desktop", "home", "tools", "qr", "compress", "password", "merge", "edu", "js", "ai", "services", "account")) {
    console.log("Desktop 1600×900 @2x");
    await captureDesktop(browser);
  }
  if (wanted("mobile", "home", "tools", "qr", "compress", "edu", "js", "ai", "services", "account")) {
    console.log("Mobil 390×844 @3x");
    await captureMobile(browser);
  }
} finally {
  await browser.close();
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST)}`);
}
