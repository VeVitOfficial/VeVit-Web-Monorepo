#!/usr/bin/env node
// Hledá ve verzovaných souborech natvrdo zapsané tajné klíče (JWT, Supabase
// secret key, service role). Spouští se v CI (.github/workflows/security.yml).
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skipExtensions = new Set([".wasm", ".onnx", ".woff", ".woff2", ".ttf", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".pdf", ".zip", ".gz"]);
const dummyMarkers = ["replace-", "example", "test-key", "test-value", "_test_", "dummy", "placeholder", "your-project", "your_", "changeme"];
const patterns = [
  ["JWT token", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{10,}\b/g],
  ["hardcoded service role", /(?:SUPABASE_SERVICE_ROLE|service_role)["']?\s*(?:=>|=|:)\s*["']([^"']{8,})["']/gi],
];

const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const failures = [];

for (const file of files) {
  const path = join(root, file);
  if (skipExtensions.has(extname(file).toLowerCase())) continue;
  let size;
  try {
    size = statSync(path).size;
  } catch {
    continue; // smazaný, ale ještě nestagovaný soubor
  }
  if (size > 5 * 1024 * 1024) continue;
  const contents = readFileSync(path, "utf8");
  for (const [label, pattern] of patterns) {
    for (const match of contents.matchAll(pattern)) {
      const candidate = (match[1] ?? match[0]).toLowerCase();
      if (dummyMarkers.some((marker) => candidate.includes(marker))) continue;
      const line = contents.slice(0, match.index).split("\n").length;
      failures.push(`${file}:${line}: ${label}`);
    }
  }
}

if (failures.length) {
  process.stderr.write(`secret-scan: FAIL\n${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("secret-scan: PASS\n");
