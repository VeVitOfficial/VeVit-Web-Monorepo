// E2E sekce AIFB (playwright-core + node:test, bez dalších závislostí).
//   BASE_URL=http://localhost:3000 npm run test:e2e:aifb
// Prohlížeč: CHROMIUM_PATH (např. /usr/bin/chromium), jinak ten, který nainstaluje
// `npx playwright-core install chromium`. E2E_PRODUCTION=1 značí běh proti `next start`
// (návrhy žákovských textů se pak nesmí zobrazit a AI endpoint musí odpovídat 404).

import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const root = `${base}/cs/edu/ai-gramotnost`;
const production = process.env.E2E_PRODUCTION === "1";
let browser;

test.before(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
});
test.after(async () => {
  await browser?.close();
});

async function withPage(fn, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

/** Počká na hydrataci ovládání projekce, stiskne klávesu jednou a čeká na změnu adresy (bez opakování, které by rušilo probíhající navigaci). */
async function press(page, key, pattern) {
  await page.locator('.aifb-proj__bar[data-ready="true"]').waitFor({ timeout: 30_000 });
  await page.keyboard.press(key);
  await page.waitForURL(pattern, { timeout: 30_000 });
}

const CATEGORIES = [
  { id: "zs1", card: "1. stupeň ZŠ", level: "blok-a", lesson: "cv1", theme: "pirate-map" },
  { id: "zs2", card: "2. stupeň ZŠ", level: "level-1", lesson: "cv2", theme: "trail" },
  { id: "ss", card: "Střední školy a gymnázia", level: "level-1", lesson: "teorie", theme: "clean" },
];

for (const category of CATEGORIES) {
  test(`${category.id}: hub → kategorie → level → lekce kliknutím`, async () => {
    await withPage(async (page) => {
      await page.goto(root);
      await page.getByRole("link", { name: new RegExp(category.card) }).first().click();
      await page.waitForURL(new RegExp(`/aifb/${category.id}$`));
      assert.ok(await page.locator(`.aifb-overview--${category.theme}`).count(), "téma kategorie");
      await page.locator(`a[href$="/aifb/${category.id}/${category.level}"]`).first().click();
      await page.waitForURL(new RegExp(`/${category.level}$`));
      assert.equal(await page.locator("h1").count(), 1);
      await page.locator(`a[href$="/${category.level}/${category.lesson}"]`).first().click();
      await page.waitForURL(new RegExp(`/${category.lesson}$`));
      assert.ok((await page.locator("h1").innerText()).length > 0);
    });
  });

  test(`${category.id}: přímé otevření URL a obnovení stránky`, async () => {
    await withPage(async (page) => {
      for (const url of [`${root}/aifb/${category.id}`, `${root}/aifb/${category.id}/${category.level}`, `${root}/aifb/${category.id}/${category.level}/${category.lesson}`, `${root}/aifb/${category.id}/pro-ucitele`]) {
        const response = await page.goto(url);
        assert.equal(response.status(), 200, url);
        await page.reload();
        assert.equal(await page.locator("h1").count() >= 1, true, url);
      }
    });
  });
}

test("zpět a vpřed v historii", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs2`);
    await page.locator('a[href$="/aifb/zs2/level-1"]').first().click();
    await page.waitForURL(/level-1$/);
    await page.goBack();
    await page.waitForURL(/\/aifb\/zs2$/);
    await page.goForward();
    await page.waitForURL(/level-1$/);
  });
});

test("seznamové zobrazení map a přepínač Karty / Tabulka", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1`);
    await page.getByRole("button", { name: "Seznam" }).click();
    assert.equal(await page.locator(".aifb-level-card").count(), 4);
    await page.goto(`${root}/aifb/zs2`);
    await page.getByRole("button", { name: "Seznam" }).click();
    assert.equal(await page.locator(".aifb-level-card").count(), 6);
    await page.goto(`${root}/aifb/ss`);
    await page.getByRole("button", { name: "Tabulka" }).click();
    assert.equal(await page.locator("table.aifb-table--levels tbody tr").count(), 6);
    assert.equal(await page.locator("table.aifb-table--levels th[scope='col']").count(), 6);
  });
});

test("mapa je ovladatelná z klávesnice a cíle mají aspoň 64 px", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1`);
    const boxes = await page.locator(".aifb-island").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    assert.equal(boxes.length, 4);
    for (const box of boxes) assert.ok(box.width >= 64 && box.height >= 64, `cíl ${box.width}×${box.height}`);
    await page.locator(".aifb-island").first().focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(/blok-a$/);
  });
});

test("projekce: velké písmo a přepínání lekcí klávesami", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1/blok-a/cv1?rezim=projekce`);
    const size = await page.locator(".aifb-proj__text p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(size >= 32, `písmo ${size}px`);
    await press(page, "ArrowRight", /cv2\?rezim=projekce$/);
    await press(page, "ArrowLeft", /cv1\?rezim=projekce$/);
    await press(page, "Escape", /cv1$/);
  });
});

test("tisk: bez navigace, černá na bílé", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs2/level-1/tisk`);
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("#navbar").isVisible(), false);
    assert.equal(await page.locator(".aifb-toolbar").isVisible(), false);
    const colors = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, fg: getComputedStyle(document.querySelector(".aifb-prose p")).color }));
    assert.equal(colors.bg, "rgb(255, 255, 255)");
    assert.equal(colors.fg, "rgb(0, 0, 0)");
  });
});

test("průběh: označení lekce přežije obnovení a neobsahuje osobní údaje", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1/blok-a/teorie`);
    await page.getByRole("button", { name: "Označit jako hotové" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Označit jako nehotové" }).waitFor({ state: "visible", timeout: 10_000 });
    const stored = await page.evaluate(() => localStorage.getItem("vevit.edu.aifb.progress.v1"));
    const data = JSON.parse(stored);
    assert.deepEqual(Object.keys(data), ["version", "lessons"]);
    assert.equal(data.lessons["zs1-blok-a-teorie"].status, "done");
  });
});

test("soukromí: žádné požadavky mimo vlastní doménu", async () => {
  const baseHost = new URL(base).host;
  await withPage(async (page) => {
    const foreign = new Set();
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith("http") && url.host !== baseHost) foreign.add(url.host);
    });
    for (const path of ["", "/aifb/zs1", "/aifb/zs1/blok-a/cv1", "/aifb/ss/pro-ucitele"]) {
      await page.goto(`${root}${path}`, { waitUntil: "networkidle" });
    }
    assert.deepEqual([...foreign], []);
  });
});

test("žádný vodorovný posun na 360 px", async () => {
  await withPage(async (page) => {
    for (const path of ["", "/aifb/zs1", "/aifb/zs2", "/aifb/ss", "/aifb/zs1/blok-a", "/aifb/zs1/blok-a/cv3"]) {
      await page.goto(`${root}${path}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${path || "hub"}: přesah ${overflow}px`);
    }
  }, { viewport: { width: 360, height: 800 } });
});

test("režim Žák: na produkci žádné návrhy a AI endpoint nedostupný", { skip: !production }, async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs2/level-2/cv1?rezim=zak`);
    assert.ok(await page.getByText("Žákovská verze se připravuje").isVisible());
    assert.equal(await page.getByText("Návrh ke schválení").count(), 0);
    const result = await page.evaluate(async () => {
      const r = await fetch("/edu/api/aifb/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: "zs2-level-2-cv1", prompt: "napiš něco" }) });
      return r.status;
    });
    assert.equal(result, 404);
  });
});

test("AI endpoint: osobní údaje a lekce 1. stupně se odmítnou", { skip: production }, async () => {
  const post = (body) => fetch(`${base}/edu/api/aifb/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post({ lessonId: "zs2-level-2-cv1", prompt: "napiš na jan@example.com" })).status, 422);
  assert.equal((await post({ lessonId: "zs1-blok-a-cv1", prompt: "ahoj" })).status, 404);
});
