// Playwright harness převodníku Word ⇄ PDF: skutečné stránky nástrojů v Chromiu, Firefoxu a WebKitu.
//   npx playwright test -c tests/converter/playwright.config.ts
// Proměnné: CONVERTER_BASE_URL (běžící server; jinak se spustí `next start` / `next dev`),
// CONVERTER_LABEL (štítek výsledků, např. "baseline"), CONVERTER_DOCS (čárkami oddělené názvy),
// PW_WEBKIT_WS (ws:// Playwright run-server, např. v kontejneru mcr.microsoft.com/playwright, když
// hostitel nemá knihovny pro WebKit — testy a metriky dál běží na hostiteli).
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.CONVERTER_PORT ?? 3210);
const external = process.env.CONVERTER_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./out/playwright",
  timeout: 5 * 60_000,
  expect: { timeout: 120_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "./out/playwright-report.json" }]],
  use: {
    baseURL: external ?? `http://localhost:${port}`,
    acceptDownloads: true,
    locale: "cs-CZ",
  },
  projects: [
    // Plný Chromium (ne headless shell): jen ten má performance.measureUserAgentSpecificMemory.
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium", launchOptions: { args: ["--enable-blink-features=ForceEagerMeasureMemory"] } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"], ...(process.env.PW_WEBKIT_WS ? { connectOptions: { wsEndpoint: process.env.PW_WEBKIT_WS } } : {}) } },
  ],
  webServer: external
    ? undefined
    : {
        command: process.env.CI ? `npx next start --port ${port}` : `npx next dev --port ${port}`,
        url: `http://localhost:${port}/cs/tools/`,
        reuseExistingServer: true,
        timeout: 300_000,
        cwd: "../..",
      },
});
