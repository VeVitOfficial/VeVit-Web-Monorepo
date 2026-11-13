// Kolik JS (gzip přenos) stránka reálně stáhne a jestli se v ní objeví očekávaný prvek.
// Použití: node scripts/perf/page-js.cjs <base-url> <cesta> [css-selektor-ktery-musi-byt-videt]...
// Příklad: node scripts/perf/page-js.cjs http://localhost:3100 /cs/tools/pdf-merge "#tool-root input[type=file]"
const { chromium } = require("playwright-core");

(async () => {
  const [base, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
  for (let i = 0; i < rest.length; i++) {
    const path = rest[i];
    const selector = rest[i + 1] && !rest[i + 1].startsWith("/") ? rest[++i] : null;
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 140)));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    let js = 0, count = 0;
    const types = new Map();
    cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
    const urls = new Map();
    cdp.on("Network.requestWillBeSent", (e) => urls.set(e.requestId, e.request.url));
    cdp.on("Network.loadingFinished", (e) => { if (types.get(e.requestId) === "Script") { js += e.encodedDataLength; count++; if (process.env.VERBOSE) console.log("   ", (e.encodedDataLength / 1024).toFixed(1), urls.get(e.requestId)); } });
    // networkidle nestačí: některé stránky polují (login), proto load + 4 s na lazy chunky a prefetch.
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForTimeout(4000);
    let found = "";
    if (selector) found = (await page.locator(selector).count()) > 0 ? " selektor OK" : " SELEKTOR CHYBÍ";
    console.log(`${path}: ${count} JS souborů, ${(js / 1024).toFixed(0)} kB přenos${found}${errors.length ? " CHYBY: " + errors.join(" | ") : ""}`);
    await page.close();
  }
  await browser.close();
})();
