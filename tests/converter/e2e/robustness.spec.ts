// Damaged, malicious and protected inputs: the tool must fail with a clear message (never hang
// or crash the tab), and a password-protected PDF must convert once the password is entered.
import { test, expect } from "@playwright/test";
import path from "node:path";
import { CORPUS } from "./helpers";

const BAD = path.join(CORPUS, "bad");
const CASES = [
  { slug: "word-to-pdf", file: "zip-bomba.docx", expect: /podezřele|poškozeně/ },
  { slug: "word-to-pdf", file: "nesmysl.docx", expect: /není dokument Word|poškozený|nezdařil/ },
  { slug: "word-to-pdf", file: "sifrovany.docx", expect: /heslem/ },
  { slug: "pdf-to-word", file: "useknute.pdf", expect: /poškozený|nezdařil/ },
  { slug: "pdf-to-word", file: "sifrovane.pdf", expect: /heslem/ },
];

for (const c of CASES) {
  test(`robustness: ${c.slug} ${c.file}`, async ({ page }) => {
    await page.goto(`/cs/tools/${c.slug}`);
    const root = page.locator("#tool-root");
    await expect(root.locator('[data-converter][data-ready="1"]')).toBeVisible();
    await root.locator('input[type="file"]').first().setInputFiles(path.join(BAD, c.file));
    await root.locator('[data-testid="convert"]').click();
    await expect(root.locator('[data-testid="error"]')).toContainText(c.expect, { timeout: 120_000 });
    // Stránka žije: tlačítko převodu jde znovu použít.
    await expect(root.locator('[data-testid="convert"]')).toBeEnabled();
  });
}

test("robustness: encrypted PDF converts after entering the password", async ({ page }) => {
  await page.goto("/cs/tools/pdf-to-word");
  const root = page.locator("#tool-root");
  await expect(root.locator('[data-converter][data-ready="1"]')).toBeVisible();
  await root.locator('input[type="file"]').first().setInputFiles(path.join(BAD, "sifrovane.pdf"));
  await root.locator('[data-testid="convert"]').click();
  await expect(root.locator('[data-testid="error"]')).toContainText(/heslem/, { timeout: 120_000 });
  await expect(root.getByRole("link", { name: "Ochrana PDF heslem" })).toHaveAttribute("href", "/cs/tools/pdf-password");
  await root.locator("#p2w-password").fill("heslo123");
  await root.locator('[data-testid="convert"]').click();
  await expect(root.locator('[data-testid="download"]')).toBeVisible({ timeout: 120_000 });
});
