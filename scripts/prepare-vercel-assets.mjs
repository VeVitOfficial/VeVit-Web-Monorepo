import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicDir = join(root, "public");
const legacyDir = join(root, "legacy-public");
const publicExtensions = new Set([
  ".css", ".js", ".mjs", ".json", ".map", ".png", ".jpg", ".jpeg",
  ".webp", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".wasm",
  ".pdf", ".bin", ".data", ".mp3", ".wav", ".mp4", ".webm"
]);

const excludedSegments = new Set([
  ".git", ".claude", ".claude-flow", "api", "bin", "config", "docs",
  "includes", "legacy", "lib", "logs", "migrations", "php", "reports",
  "scripts", "sql", "tests", "uploads", "vendor"
]);

if (process.env.VERCEL === "1") {
  const required = [
    "NEXT_PUBLIC_SITE_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY"
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    console.warn("\n[VeVit deploy warning] Missing Vercel environment variables:");
    for (const name of missing) console.warn(`  - ${name}`);
    console.warn("The public site will build, but related backend features will return 503 until these variables are configured.\n");
  }
}

async function copyTree(source, destination, options = {}) {
  const entries = await readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    const isSectionRoot = options.sourceRoot === source;
    if (entry.name.startsWith(".") || (isSectionRoot && excludedSegments.has(entry.name))) continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to, options);
      continue;
    }
    const extension = extname(entry.name).toLowerCase();
    if (!publicExtensions.has(extension) && !(options.html && extension === ".html")) continue;
    const target = extension === ".html" && options.htmlRoot
      ? join(options.htmlRoot, relative(options.sourceRoot, from))
      : to;
    await mkdir(join(target, ".."), { recursive: true });
    await cp(from, target);
  }
}

await rm(publicDir, { recursive: true, force: true });
await rm(legacyDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });
await mkdir(legacyDir, { recursive: true });

await copyTree(join(root, "assets"), join(publicDir, "assets"));
await copyTree(join(root, "shared", "js"), join(publicDir, "assets", "shared"));

for (const section of ["home", "account", "edu", "tools"]) {
  await copyTree(join(root, section), join(publicDir, section), {
    html: true,
    htmlRoot: join(legacyDir, section),
    sourceRoot: join(root, section)
  });
}

for (const section of ["assets", "images"]) {
  await copyTree(join(root, "store", section), join(publicDir, "store", section));
}

for (const file of ["robots.txt", "sitemap.xml"]) {
  await cp(join(root, file), join(publicDir, file));
}

const generated = join(root, "generated", "vercel");
try {
  await cp(generated, legacyDir, { recursive: true, force: true });
} catch (error) {
  if (error?.code === "ENOENT") {
    throw new Error("Generated tool pages are missing. Run npm run export:legacy-tools and commit generated/vercel/.");
  }
  throw error;
}

console.log("Vercel assets prepared in public/ and legacy-public/.");
