// Quality metrics for the converter corpus (Node side of the harness).
// Rendering uses poppler (pdftoppm/pdftotext) as a neutral third renderer: it is
// neither the engine under test nor the reference producer.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PNG } from "pngjs";

/** Renders every page of a PDF to grayscale PNG at `dpi`. Returns [{width,height,gray:Uint8Array,png:Buffer}]. */
export function renderPdf(pdfPath, dpi = 150) {
  const dir = mkdtempSync(path.join(tmpdir(), "vv-render-"));
  try {
    execFileSync("pdftoppm", ["-r", String(dpi), "-gray", "-png", pdfPath, path.join(dir, "p")], { stdio: "pipe" });
    return readdirSync(dir).filter((f) => f.endsWith(".png")).sort((a, b) => pageNo(a) - pageNo(b)).map((f) => {
      const buf = readFileSync(path.join(dir, f));
      const png = PNG.sync.read(buf);
      const gray = new Uint8Array(png.width * png.height);
      for (let i = 0; i < gray.length; i++) gray[i] = png.data[i * 4];
      return { width: png.width, height: png.height, gray, png: buf };
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const pageNo = (f) => Number(/-(\d+)\.png$/.exec(f)?.[1] ?? 0);

/** Pads/crops b to a's size (white fill) so pages of slightly different size compare. */
function align(a, b) {
  if (a.width === b.width && a.height === b.height) return b.gray;
  const out = new Uint8Array(a.width * a.height).fill(255);
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  for (let y = 0; y < h; y++) out.set(b.gray.subarray(y * b.width, y * b.width + w), y * a.width);
  return out;
}

/**
 * Mean SSIM (Wang et al. 2004) over 8×8 windows with stride 4, on grayscale.
 * Windows that are blank in both images are skipped: an A4 page is mostly
 * white paper and would otherwise push every score towards 1.
 */
export function ssim(a, b) {
  const g1 = a.gray, g2 = align(a, b), W = a.width, H = a.height;
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2, N = 64;
  let sum = 0, n = 0;
  for (let y = 0; y + 8 <= H; y += 4) for (let x = 0; x + 8 <= W; x += 4) {
    let s1 = 0, s2 = 0, q1 = 0, q2 = 0, c = 0, blank = true;
    for (let j = 0; j < 8; j++) {
      const row = (y + j) * W + x;
      for (let i = 0; i < 8; i++) {
        const p1 = g1[row + i], p2 = g2[row + i];
        if (p1 < 250 || p2 < 250) blank = false;
        s1 += p1; s2 += p2; q1 += p1 * p1; q2 += p2 * p2; c += p1 * p2;
      }
    }
    if (blank) continue;
    const m1 = s1 / N, m2 = s2 / N;
    const v1 = q1 / N - m1 * m1, v2 = q2 / N - m2 * m2, cv = c / N - m1 * m2;
    sum += ((2 * m1 * m2 + C1) * (2 * cv + C2)) / ((m1 * m1 + m2 * m2 + C1) * (v1 + v2 + C2));
    n++;
  }
  return n ? sum / n : 1;
}

/** Share of pixels differing by more than `tol` gray levels, over non-blank pixels; also returns a red/blue diff PNG. */
export function pixelDiff(a, b, tol = 64) {
  const g1 = a.gray, g2 = align(a, b), W = a.width, H = a.height;
  const out = new PNG({ width: W, height: H });
  let diff = 0, ink = 0;
  for (let i = 0; i < W * H; i++) {
    const p1 = g1[i], p2 = g2[i], o = i * 4;
    if (p1 < 250 || p2 < 250) ink++;
    const d = Math.abs(p1 - p2) > tol;
    if (d) diff++;
    // Gray = same, red = only in reference, blue = only in result.
    if (!d) { const v = 255 - (255 - Math.min(p1, p2)) * 0.35; out.data[o] = out.data[o + 1] = out.data[o + 2] = v; }
    else if (p1 < p2) { out.data[o] = 220; out.data[o + 1] = 30; out.data[o + 2] = 30; }
    else { out.data[o] = 30; out.data[o + 1] = 80; out.data[o + 2] = 230; }
    out.data[o + 3] = 255;
  }
  return { ratio: ink ? diff / ink : 0, png: PNG.sync.write(out) };
}

/** Box blur (radius r, two passes ≈ Gaussian), paper-white outside the page: the tolerant
 *  SSIM variant forgives 1–2 px shifts that the 150 DPI SSIM punishes like missing text. */
export function blur(page, r = 2) {
  const { width: W, height: H } = page;
  const k = 2 * r + 1;
  const pass1d = (src, len, stride, lines, lineStride, dst) => {
    const pre = new Float64Array(len + 1);
    for (let l = 0; l < lines; l++) {
      const base = l * lineStride;
      for (let i = 0; i < len; i++) pre[i + 1] = pre[i] + src[base + i * stride];
      for (let i = 0; i < len; i++) {
        const a = i - r, b = i + r;
        const inside = pre[Math.min(len, b + 1)] - pre[Math.max(0, a)];
        const outside = (Math.max(0, -a) + Math.max(0, b - len + 1)) * 255;
        dst[base + i * stride] = (inside + outside) / k;
      }
    }
  };
  let g = page.gray;
  for (let pass = 0; pass < 2; pass++) {
    const h = new Uint8Array(W * H), v = new Uint8Array(W * H);
    pass1d(g, W, 1, H, W, h);
    pass1d(h, H, W, W, 1, v);
    g = v;
  }
  return { ...page, gray: g };
}

/** Compares two PDFs page by page. Missing pages count as SSIM 0. */
export function comparePdfs(refPdf, outPdf, { dpi = 150, diffDir, name } = {}) {
  const A = renderPdf(refPdf, dpi), B = renderPdf(outPdf, dpi);
  const pages = [];
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    if (!A[i] || !B[i]) { pages.push({ page: i + 1, ssim: 0, ssimSoft: 0, diff: 1 }); continue; }
    const d = pixelDiff(A[i], B[i]);
    if (diffDir) writeFileSync(path.join(diffDir, `${name}-p${i + 1}.png`), d.png);
    pages.push({ page: i + 1, ssim: ssim(A[i], B[i]), ssimSoft: ssim(blur(A[i]), blur(B[i])), diff: d.ratio });
  }
  const mean = (k) => pages.reduce((s, p) => s + (p[k] ?? 0), 0) / (pages.length || 1);
  return { pagesRef: A.length, pagesOut: B.length, ssim: mean("ssim"), ssimSoft: mean("ssimSoft"), minSsim: Math.min(...pages.map((p) => p.ssim)), diff: Math.max(...pages.map((p) => p.diff)), pages };
}

export const pdfText = (pdfPath) => execFileSync("pdftotext", ["-enc", "UTF-8", "-raw", pdfPath, "-"], { encoding: "utf8" });
export const normText = (s) => s.normalize("NFC").replace(/­/g, "").replace(/[   ]/g, " ").replace(/-\n/g, "").replace(/\s+/g, " ").trim();

/** Word-level similarity: 1 - levenshtein(words)/max(len). Also reports characters missing/extra (multiset). */
export function textSimilarity(refText, outText) {
  const a = normText(refText).split(" ").filter(Boolean), b = normText(outText).split(" ").filter(Boolean);
  const n = a.length, m = b.length;
  let prev = new Uint32Array(m + 1).map((_, j) => j), cur = new Uint32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    cur[0] = i;
    for (let j = 1; j <= m; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  const dist = prev[m];
  const count = (s) => { const c = new Map(); for (const ch of s.replace(/\s/g, "")) c.set(ch, (c.get(ch) ?? 0) + 1); return c; };
  const ca = count(normText(refText)), cb = count(normText(outText));
  let missing = 0, extra = 0;
  for (const [k, v] of ca) missing += Math.max(0, v - (cb.get(k) ?? 0));
  for (const [k, v] of cb) extra += Math.max(0, v - (ca.get(k) ?? 0));
  return { similarity: Math.max(n, m) ? 1 - dist / Math.max(n, m) : 1, missingChars: missing, extraChars: extra };
}

export function pdfFonts(pdfPath) {
  const out = execFileSync("pdffonts", [pdfPath], { encoding: "utf8" }).split("\n").slice(2).filter(Boolean);
  return [...new Set(out.map((l) => l.split(/\s+/)[0].replace(/^[A-Z]{6}\+/, "")))].sort();
}

/** Decodes QR codes on rendered pages with jsQR (pure JS). Returns decoded strings. */
export async function decodeQr(pdfPath, dpi = 150) {
  const { default: jsQR } = await import("jsqr");
  const found = [];
  for (const page of renderPdf(pdfPath, dpi)) {
    const rgba = new Uint8ClampedArray(page.width * page.height * 4);
    for (let i = 0; i < page.gray.length; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = page.gray[i]; rgba[i * 4 + 3] = 255; }
    const res = jsQR(rgba, page.width, page.height);
    if (res) found.push(res.data);
  }
  return found;
}
