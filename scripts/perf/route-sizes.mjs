// Usage: node route-sizes.mjs <projectDir>  → markdown table of first-load JS/CSS per page route
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(process.argv[2]);
const next = path.join(root, ".next");
const bm = JSON.parse(fs.readFileSync(path.join(next, "build-manifest.json"), "utf8"));
const rootMain = bm.rootMainFiles ?? [];
const cache = new Map();
function size(f) {
  if (!cache.has(f)) {
    const buf = fs.readFileSync(path.join(next, f));
    cache.set(f, [buf.length, zlib.gzipSync(buf, { level: 9 }).length]);
  }
  return cache.get(f);
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "page_client-reference-manifest.js") out.push(p);
  }
  return out;
}
globalThis.self = globalThis;
const rows = [];
for (const file of walk(path.join(next, "server/app"))) {
  globalThis.__RSC_MANIFEST = {};
  const code = fs.readFileSync(file, "utf8");
  new Function(code)();
  for (const [key, m] of Object.entries(globalThis.__RSC_MANIFEST)) {
    const js = new Set(rootMain.map((f) => f.replace(/^\//, "")));
    for (const list of Object.values(m.entryJSFiles ?? {})) list.forEach((f) => js.add(f.replace(/^\//, "")));
    const css = new Set();
    for (const list of Object.values(m.entryCSSFiles ?? {})) list.forEach((c) => css.add((c.path ?? c).replace(/^\//, "")));
    const sum = (set) => [...set].filter((f) => fs.existsSync(path.join(next, f))).reduce((a, f) => [a[0] + size(f)[0], a[1] + size(f)[1]], [0, 0]);
    const [jsRaw, jsGz] = sum(js);
    const [cssRaw, cssGz] = sum(css);
    rows.push({ route: key.replace(/\/page$/, "") || "/", jsRaw, jsGz, cssRaw, cssGz });
  }
}
rows.sort((a, b) => b.jsGz - a.jsGz);
const kb = (n) => (n / 1024).toFixed(0);
console.log("| Route | JS raw kB | JS gzip kB | CSS raw kB | CSS gzip kB |\n|---|---:|---:|---:|---:|");
for (const r of rows) console.log(`| ${r.route} | ${kb(r.jsRaw)} | ${kb(r.jsGz)} | ${kb(r.cssRaw)} | ${kb(r.cssGz)} |`);
