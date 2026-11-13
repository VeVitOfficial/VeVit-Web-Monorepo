#!/usr/bin/env node
// VeVit Store — aplikace produktového obohacení (obrázky, popisy, parametry, zdroje)
//
// Použití: npm run store:enrich [-- docs/store-enrichment/Neco.json …]
// Bez argumentů zpracuje všechny docs/store-enrichment/*.json.
//
// Formát vstupu (na skupinu variant):
// {
//   "brand": "UGREEN",
//   "groups": [{
//     "variantGroup": "ugreen-usb-c-usb-c",
//     "name": "UGREEN kabel USB-C↔USB-C",
//     "description": "český popis",
//     "shortDesc": "krátký popis",
//     "specs": { "Klíč": "hodnota" },
//     "images": ["/store/img/products/…/1.jpg"],
//     "sources": [{ "type": "official", "url": "https://…", "note": "…", "verified": "2026-11-12" }],
//     "imagesByVariant": { "slug": ["/…"] },  // volitelné přepisy po variantě
//     "officialName": "70mai Dash Cam A510",  // volitelné: oficiální název; varianta se připojí v závorce
//     "imageSources": [{ "file": "/…", "source": "https://…" }]  // evidence původu fotek (do DB se nezapisuje)
//   }],
//   "unresolved": [{ "variantGroup": "…", "reason": "…" }]  // neidentifikované produkty (jen dokumentace)
// }
// Skupina = variant_group, u produktů bez variant_group jejich slug.
// Aktualizace jsou PATCH po skupině (a po slugu pro imagesByVariant a officialName).

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "docs/store-enrichment");

async function main() {
  const args = process.argv.slice(2);
  const files = args.length
    ? args.map((name) => name.startsWith("/") ? name : join(process.cwd(), name))
    : (await readdir(DIR)).filter((name) => name.endsWith(".json")).map((name) => join(DIR, name));

  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Chybí SUPABASE_URL/SUPABASE_SECRET_KEY (node --env-file=.env.local …)");

  // Skupina: variant_group, nebo slug u produktu bez variant_group.
  const groupFilter = (group) => {
    const value = `"${group.replaceAll('"', '\\"')}"`;
    return `or=(variant_group.eq.${encodeURIComponent(value)},and(variant_group.is.null,slug.eq.${encodeURIComponent(value)}))`;
  };

  const patch = (group, body) =>
    fetch(`${url}/rest/v1/store_products?${groupFilter(group)}&select=slug,variant_label`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });

  const patchSlug = (slug, body) =>
    fetch(`${url}/rest/v1/store_products?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body)
    });

  const summary = { groups: 0, patched: 0, products: 0, skipped: 0, variantOverrides: 0, errors: [] };
  for (const file of files) {
    const payload = JSON.parse(await readFile(file, "utf8"));
    for (const group of payload.groups ?? []) {
      summary.groups += 1;
      if (!group.variantGroup) { summary.skipped += 1; summary.errors.push(`${file}: skupina bez variantGroup`); continue; }
      const body = {};
      if (group.description) body.description = group.description;
      if (group.shortDesc) body.short_desc = group.shortDesc.slice(0, 255);
      if (group.specs) body.specs = group.specs;
      if (group.sources) body.sources = group.sources;
      if (group.images?.length) body.images = group.images;
      if (!Object.keys(body).length) { summary.skipped += 1; continue; }
      const response = await patch(group.variantGroup, body);
      if (!response.ok) {
        summary.errors.push(`${group.variantGroup}: PATCH ${response.status} ${(await response.text()).slice(0, 200)}`);
        continue;
      }
      const rows = await response.json();
      if (!rows.length) {
        summary.errors.push(`${group.variantGroup}: žádný produkt v DB`);
        continue;
      }
      summary.patched += 1;
      summary.products += rows.length;
      if (group.officialName) {
        for (const row of rows) {
          const name = row.variant_label ? `${group.officialName} (${row.variant_label})` : group.officialName;
          const nameResponse = await patchSlug(row.slug, { name: name.slice(0, 255) });
          if (!nameResponse.ok) summary.errors.push(`${row.slug}: název PATCH ${nameResponse.status}`);
        }
      }
      for (const [slug, images] of Object.entries(group.imagesByVariant ?? {})) {
        const slugResponse = await patchSlug(slug, { images });
        if (slugResponse.ok) summary.variantOverrides += 1;
        else summary.errors.push(`${slug}: PATCH ${slugResponse.status}`);
      }
    }
  }
  console.log(`Skupin: ${summary.groups}, aktualizováno: ${summary.patched} (${summary.products} produktů), přeskočeno: ${summary.skipped}, variantní přepisy: ${summary.variantOverrides}`);
  if (summary.errors.length) {
    console.log("Chyby:");
    for (const error of summary.errors) console.log(`  - ${error}`);
  }
  await writeFile(join(ROOT, "docs/store-enrichment/.last-run.json"), JSON.stringify({ at: new Date().toISOString(), ...summary }, null, 2));
}

main().catch((error) => { console.error(error); process.exit(1); });
