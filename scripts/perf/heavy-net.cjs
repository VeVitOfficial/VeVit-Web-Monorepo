// Usage: node heavy-net.cjs <projectDir> <baseUrl> <slug...>
// Opens each tool page without interacting and lists heavy assets fetched within 6 s.
const { createRequire } = require("node:module");
const req = createRequire(require("node:path").resolve(process.argv[2]) + "/");
const { chromium } = req("playwright-core");
const base = process.argv[3];
const slugs = process.argv.slice(4);
const HEAVY = /\.(wasm|onnx|traineddata|data|bin)(\?|$)|ffmpeg|tesseract|onnx|libheif|qpdf|pdf\.worker|pdf\.min/i;
(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
  for (const slug of slugs) {
    const page = await browser.newPage();
    const hits = [];
    page.on("response", async (r) => {
      if (!HEAVY.test(r.url())) return;
      const len = Number(r.headers()["content-length"] || 0);
      hits.push(`${new URL(r.url()).pathname} ${(len / 1024) | 0}k`);
    });
    await page.goto(`${base}/cs/tools/${slug}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000);
    console.log(`${slug}: ${hits.length ? hits.join(", ") : "nic těžkého"}`);
    await page.close();
  }
  await browser.close();
})();
