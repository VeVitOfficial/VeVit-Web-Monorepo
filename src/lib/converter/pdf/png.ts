// Minimální PNG enkodér (RGBA nebo šedotón, filtr None/Up) nad fflate — běží v okně,
// ve workeru i v Node, bez canvasu. Obrázky z PDF se tak ukládají bezztrátově v původním
// rozlišení.
import { zlibSync } from "fflate";

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();

function crc32(parts: Uint8Array[]): number {
  let c = 0xffffffff;
  for (const p of parts) for (let i = 0; i < p.length; i++) c = CRC[(c ^ p[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  const t = new TextEncoder().encode(type);
  out.set(t, 4);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32([t, data]));
  return out;
}

/** `channels`: 1 = šedotón, 3 = RGB, 4 = RGBA. */
export function encodePng(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number, channels: 1 | 3 | 4 = 4): Uint8Array {
  const stride = width * channels;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const o = y * (stride + 1);
    if (y === 0) { raw[o] = 0; raw.set(row, o + 1); continue; }
    // Filtr Up: dobře komprimuje skeny i plochy.
    raw[o] = 2;
    const prev = pixels.subarray((y - 1) * stride, y * stride);
    for (let i = 0; i < stride; i++) raw[o + 1 + i] = (row[i] - prev[i]) & 0xff;
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width); dv.setUint32(4, height);
  ihdr[8] = 8; ihdr[9] = channels === 1 ? 0 : channels === 3 ? 2 : 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk("IHDR", ihdr), chunk("IDAT", zlibSync(raw, { level: 6 })), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}

/**
 * Vektorový shluk obdélníků (QR kód) → PNG přesně na mřížku modulů (`scale` px na modul),
 * bez vyhlazování: čtečky QR pak dekódují stejně jako originál.
 */
export function rasterizeRects(rects: { x: number; y: number; w: number; h: number; color: [number, number, number] }[], box: { x: number; y: number; w: number; h: number }): { png: Uint8Array; pxW: number; pxH: number } {
  const module = Math.max(0.3, Math.min(...rects.filter((r) => r.color.some((v) => v < 200)).map((r) => Math.min(r.w, r.h))));
  const cols = Math.max(1, Math.round(box.w / module)), rowsN = Math.max(1, Math.round(box.h / module));
  const scale = Math.max(4, Math.min(16, Math.ceil(600 / Math.max(cols, rowsN))));
  const W = cols * scale, H = rowsN * scale;
  const px = new Uint8Array(W * H * 3).fill(255);
  for (const r of rects) {
    const color = r.color;
    const c0 = Math.round((r.x - box.x) / module), r0 = Math.round((r.y - box.y) / module);
    const c1 = Math.max(c0 + 1, Math.round((r.x + r.w - box.x) / module)), r1 = Math.max(r0 + 1, Math.round((r.y + r.h - box.y) / module));
    for (let y = r0 * scale; y < Math.min(H, r1 * scale); y++) for (let x = c0 * scale; x < Math.min(W, c1 * scale); x++) {
      const o = (y * W + x) * 3;
      px[o] = color[0]; px[o + 1] = color[1]; px[o + 2] = color[2];
    }
  }
  return { png: encodePng(px, W, H, 3), pxW: W, pxH: H };
}
