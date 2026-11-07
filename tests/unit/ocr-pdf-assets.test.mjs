// The ocr-pdf tool loads tesseract.js from vendored files. Every file the tool asks for must
// exist in public/: the core glue named by corePath (plus the .wasm next to it) and the language
// data for each language the UI offers (.traineddata.gz when gzip is on).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = readFileSync(path.join(root, "src/components/tools/tools/ocr-pdf.tsx"), "utf8");
const base = /const TESS_BASE = "([^"]+)"/.exec(src)?.[1];
const pub = (url) => path.join(root, "public", url.replace(/^\//, ""));

test("ocr-pdf: TESS_BASE is set", () => assert.ok(base));

test("ocr-pdf: corePath names an existing core glue file with its wasm", () => {
  const core = /corePath: `\$\{TESS_BASE\}\/([^`]*)`/.exec(src)?.[1];
  assert.ok(core && core.endsWith(".js"), `corePath must point at a .js file, got "${core}"`);
  assert.ok(existsSync(pub(`${base}/${core}`)), `${core} missing`);
  assert.ok(existsSync(pub(`${base}/${core.replace(/\.js$/, ".wasm")}`)), "core .wasm missing");
});

test("ocr-pdf: worker script exists", () => {
  const worker = /workerPath: `\$\{TESS_BASE\}\/([^`]*)`/.exec(src)?.[1];
  assert.ok(worker && existsSync(pub(`${base}/${worker}`)));
});

test("ocr-pdf: language data exists for every offered language", () => {
  // tesseract.js defaults to gzip: true.
  const gzip = !/gzip:\s*false/.test(src);
  const langs = [...src.matchAll(/<option value="([a-z+]+)">/g)].flatMap((m) => m[1].split("+"));
  assert.ok(langs.length >= 2);
  for (const l of new Set(langs)) {
    const f = `${base}/${l}.traineddata${gzip ? ".gz" : ""}`;
    assert.ok(existsSync(pub(f)), `${f} missing`);
  }
});

test("proxy: tesseract data is served as a static file (no locale redirect)", () => {
  const proxy = readFileSync(path.join(root, "src/proxy.ts"), "utf8");
  const re = new RegExp(/const publicFile = \/(.*)\/i;/.exec(proxy)[1], "i");
  for (const f of ["ces.traineddata", "ces.traineddata.gz", "tesseract-core-simd-lstm.wasm", "worker.min.js"]) assert.ok(re.test(`${base}/${f}`), f);
});
