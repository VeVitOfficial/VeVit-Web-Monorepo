// E2E sekce AIFB (playwright-core + node:test, bez dalších závislostí).
//   BASE_URL=http://localhost:3000 npm run test:e2e:aifb
// Prohlížeč: CHROMIUM_PATH (např. /usr/bin/chromium), jinak ten, který nainstaluje
// `npx playwright-core install chromium`. E2E_PRODUCTION=1 značí běh proti `next start`
// (návrhy žákovských textů se pak nesmí zobrazit a AI endpoint musí odpovídat 404).
// Role (admin / teacher / student / veřejnost) se nastavují testovací cookie aifb_test_role, kterou
// server čte jen v `next dev` nebo s AIFB_TEST_ROLES=1 mimo Vercel (viz src/lib/edu/aifb/viewer.ts).

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

const ROLE_COOKIE = "aifb_test_role";

/** `role`: hodnota testovací cookie, null = veřejnost (bez cookie). Výchozí admin vidí vše jako dřív. */
async function withPage(fn, options = {}, role = "admin") {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  if (role) await context.addCookies([{ name: ROLE_COOKIE, value: role, url: base }]);
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
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

test("blok: nejdřív teorie, potom lekce 1–5 (teorie mezi lekce nepatří)", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1/blok-a`);
    const theoryTop = await page.locator(".aifb-theory-card").boundingBox();
    const lessonsTop = await page.locator(".aifb-lesson-list").boundingBox();
    assert.ok(theoryTop && lessonsTop && theoryTop.y < lessonsTop.y, "teorie je nad lekcemi");
    assert.equal(await page.locator(".aifb-lesson-row").count(), 5);
    assert.equal(await page.locator(".aifb-lesson-row", { hasText: "Teorie" }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Projekce" }).count(), 0, "žádný přepínač režimů");
  });
});

test("teorie: běžná velikost písma, obsah, ilustrace a shrnutí", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs2/level-1/teorie`);
    assert.ok((await page.locator(".th-section h2").count()) >= 5);
    assert.ok((await page.locator(".th-figure svg").count()) >= 2);
    assert.ok(await page.locator("#shrnuti").isVisible());
    const size = await page.locator(".th-article p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    assert.ok(size >= 15 && size <= 19, `písmo ${size}px`);
    assert.equal(await page.locator(".th-teacher[open]").count(), 0, "metodika pro učitele je sbalená");
    await page.getByRole("link", { name: /Pokračovat: Lekce 1/ }).click();
    await page.waitForURL(/level-1\/cv1$/);
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
    const course = ["/kurz", "/kurz/m2", "/kurz/m6/teorie", "/kurz/m2/cv2", "/ucitel", "/upravy"];
    for (const path of ["", "/aifb/zs1", "/aifb/zs2", "/aifb/ss", "/aifb/zs1/blok-a", "/aifb/zs1/blok-a/cv3", "/aifb/zs2/level-3/teorie", "/aifb/ss/level-6/teorie", ...course]) {
      await page.goto(`${root}${path}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 1, `${path || "hub"}: přesah ${overflow}px`);
    }
  }, { viewport: { width: 360, height: 800 } });
});

test("online kurz: hub → kurz → modul → teorie → lekce s cvičením → další lekce", async () => {
  await withPage(async (page) => {
    await page.goto(root);
    await page.getByRole("link", { name: /Online kurz pro všechny/ }).click();
    await page.waitForURL(/\/kurz$/);
    assert.equal(await page.locator(".aifb-course-module").count(), 6);
    await page.locator(".aifb-course-module", { hasText: "Soukromí a bezpečnost" }).click();
    await page.waitForURL(/\/kurz\/m4$/);
    const theoryTop = await page.locator(".aifb-theory-card").boundingBox();
    const lessonsTop = await page.locator(".aifb-lesson-list").boundingBox();
    assert.ok(theoryTop && lessonsTop && theoryTop.y < lessonsTop.y, "teorie je nad lekcemi");
    await page.locator(".aifb-theory-card").click();
    await page.waitForURL(/\/kurz\/m4\/teorie$/);
    assert.ok(await page.locator(".th-figure").count() >= 1, "teorie má ilustraci");
    await page.getByRole("link", { name: /Pokračovat: Lekce 1/ }).click();
    await page.waitForURL(/\/kurz\/m4\/cv1$/);
    const item = page.locator(".aifb-traffic__item").nth(1);
    await item.getByRole("button", { name: "Nepatří do AI" }).click();
    await assert.doesNotReject(item.getByRole("status").waitFor());
    await page.getByRole("link", { name: /Lekce 2: Rozřaď údaje/ }).click();
    await page.waitForURL(/\/kurz\/m4\/cv2$/);
  });
});

test("produkce: veřejnost vidí u kurzu ve stavu návrhu jen zprávu, moduly 404", { skip: !production }, async () => {
  await withPage(async (page) => {
    await page.goto(root);
    await page.waitForURL(/\/kurz$/);
    assert.equal(await page.locator("h1").innerText(), "Online kurz se připravuje");
    assert.equal(await page.locator('a[href$="/edu/skoly"]').count(), 1);
    const response = await page.goto(`${root}/kurz/m1`);
    assert.equal(response.status(), 404);
  }, {}, null);
});

test("produkce: žádné návrhy žákovských cvičení a AI endpoint nedostupný (učitel)", { skip: !production }, async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs2/level-2/cv1`);
    assert.equal(await page.getByText("Návrh ke schválení").count(), 0);
    assert.equal(await page.getByRole("heading", { name: "Vyzkoušej si" }).count(), 0);
    const result = await page.evaluate(async () => {
      const r = await fetch("/edu/api/aifb/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: "zs2-level-2-cv1", prompt: "napiš něco" }) });
      return r.status;
    });
    assert.equal(result, 404);
  }, {}, "teacher");
});

test("AI endpoint: osobní údaje a lekce 1. stupně se odmítnou, veřejnost ani zamčená lekce neprojde", { skip: production }, async () => {
  const post = (body, role) => fetch(`${base}/edu/api/aifb/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(role ? { Cookie: `${ROLE_COOKIE}=${role}` } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal((await post({ lessonId: "zs2-level-2-cv1", prompt: "napiš na jan@example.com" }, "teacher")).status, 422);
  assert.equal((await post({ lessonId: "zs1-blok-a-cv1", prompt: "ahoj" }, "teacher")).status, 404);
  assert.equal((await post({ lessonId: "zs2-level-2-cv1", prompt: "napiš něco o AI" })).status, 404, "veřejnost");
  assert.equal((await post({ lessonId: "zs2-level-2-cv1", prompt: "napiš něco o AI" }, "student:zs2:zs2-level-2-teorie")).status, 404, "zamčená lekce");
});

// ── Role a třídy ────────────────────────────────────────────────────────────

const STUDENT = "student:zs1:zs1-blok-a-teorie,zs1-blok-a-cv1";

test("veřejnost: rozcestník a lekce AIFB vedou rovnou na online kurz", async () => {
  await withPage(async (page) => {
    for (const path of ["", "/aifb/zs1", "/aifb/zs2/level-1/cv2", "/aifb/ss/pro-ucitele", "/ucitel", "/upravy"]) {
      await page.goto(`${root}${path}`);
      await page.waitForURL(/\/kurz$/);
    }
    assert.equal(await page.locator('a[href$="/aifb/zs1"]').count(), 0, "žádná karta kategorie");
    assert.equal(await page.locator(".aifb-crumbs a", { hasText: "AI gramotnost" }).count(), 0, "bez rozcestníku v navigaci");
  }, {}, null);
});

test("student: jen kategorie třídy, zamčené lekce bez odkazu a bez metodiky", async () => {
  await withPage(async (page) => {
    await page.goto(root);
    assert.equal(await page.locator('a[href$="/aifb/zs1"]').count(), 1);
    assert.equal(await page.locator('a[href$="/aifb/zs2"]').count(), 0);
    assert.equal(await page.locator('a[href*="/pro-ucitele"]').count(), 0);
    await page.goto(`${root}/aifb/zs1/blok-a`);
    assert.equal(await page.locator(".aifb-lesson-row--locked").count(), 4, "odemčená jen lekce 1");
    assert.equal(await page.locator('a[href$="/blok-a/cv2"]').count(), 0);
    assert.equal(await page.locator('a[href$="/blok-a/cv1"]').count(), 1);
    assert.equal(await page.locator("summary", { hasText: "Pro učitele" }).count(), 0);
    await page.goto(`${root}/aifb/zs1/blok-a/cv2`);
    assert.equal(await page.locator("h1").innerText(), "Lekce je zatím zamčená");
    await page.goto(`${root}/aifb/zs1/blok-b`);
    assert.equal(await page.locator(".aifb-theory-card--locked").count(), 1);
    for (const path of ["/aifb/zs2", "/aifb/zs1/pro-ucitele", "/aifb/zs1/blok-a/tisk", "/ucitel", "/upravy"]) {
      await page.goto(`${root}${path}`);
      await page.waitForURL(/\/ai-gramotnost$/);
    }
  }, {}, STUDENT);
});

test("student bez třídy: výzva k zadání kódu", async () => {
  await withPage(async (page) => {
    await page.goto(root);
    assert.equal(await page.getByText("Zatím nejsi v žádné třídě").count(), 1);
    assert.equal(await page.locator('a[href$="/edu/skoly"]').count(), 1);
  }, {}, "student");
});

test("učitel: všechny kategorie, metodika a Moje třídy, bez úprav obsahu", async () => {
  await withPage(async (page) => {
    await page.goto(root);
    for (const id of ["zs1", "zs2", "ss"]) assert.equal(await page.locator(`a[href$="/aifb/${id}"]`).count(), 1, id);
    await page.getByRole("link", { name: "Moje třídy a odemykání lekcí" }).click();
    await page.waitForURL(/\/ucitel$/);
    assert.equal(await page.locator("h1").innerText(), "Moje třídy");
    await page.goto(`${root}/aifb/zs1/blok-a`);
    assert.equal(await page.locator(".aifb-lesson-row--locked").count(), 0);
    assert.equal(await page.locator("summary", { hasText: "Pro učitele" }).count(), 1);
    assert.equal(await page.locator(".aifb-edit-link").count(), 0);
    await page.goto(`${root}/upravy`);
    await page.waitForURL(/\/ai-gramotnost$/);
  }, {}, "teacher");
});

test("admin: odkazy Upravit a editor s texty i JSON", async () => {
  await withPage(async (page) => {
    await page.goto(`${root}/aifb/zs1/blok-a/cv1`);
    await page.locator(".aifb-edit-link").first().click();
    await page.waitForURL(/\/upravy\?doc=zs1&path=/);
    assert.equal(await page.locator("h1").count(), 1);
    assert.ok((await page.locator(".aifb-edit-fields textarea").count()) >= 3, "textová pole lekce");
    await page.getByRole("button", { name: "JSON (pokročilé)" }).click();
    const json = JSON.parse(await page.locator("textarea.aifb-edit-json").inputValue());
    assert.equal(json.id, "zs1-blok-a-cv1");
    await page.goto(`${root}/upravy`);
    assert.equal(await page.locator("h1").innerText(), "Úpravy obsahu");
    assert.ok((await page.locator(".aifb-edit-units a").count()) > 100);
  });
});

test("VeVit Edu pro školy: tlačítko na hlavním webu a zadání kódu", async () => {
  await withPage(async (page) => {
    await page.goto(`${base}/cs/home`);
    assert.ok((await page.locator('a[href$="/edu/skoly#trida"]').count()) >= 1, "tlačítko VeVit Edu pro školy");
    await page.goto(`${base}/cs/edu/skoly#trida`);
    assert.equal(await page.getByRole("heading", { name: "Máš kód třídy?" }).count(), 1);
    const login = page.getByRole("link", { name: "Přihlásit se" });
    assert.match(await login.getAttribute("href"), /return_to=/);
  }, {}, null);
});
