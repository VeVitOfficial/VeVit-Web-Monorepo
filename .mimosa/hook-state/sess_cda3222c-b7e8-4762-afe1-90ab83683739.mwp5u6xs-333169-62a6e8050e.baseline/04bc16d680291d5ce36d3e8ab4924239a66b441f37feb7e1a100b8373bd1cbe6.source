// Kódování canvasu do rastrových formátů v prohlížeči: PNG/JPEG/WebP přes canvas.toBlob,
// BMP a TIFF (nekomprimované RGB) vlastním zápisem, GIF přes gifenc (/tools/assets/js/lib/gifenc.js).
import { loadScript } from "@/components/tools/tool-runtime";

export type RasterFormat = "png" | "jpeg" | "webp" | "bmp" | "tiff" | "gif";

export const RASTER_FORMATS: { key: RasterFormat; label: string; ext: string; mime: string; hint: string; lossy?: boolean; alpha?: boolean }[] = [
  { key: "png", label: "PNG", ext: "png", mime: "image/png", hint: "bezztrátový, průhlednost", alpha: true },
  { key: "jpeg", label: "JPG", ext: "jpg", mime: "image/jpeg", hint: "malé soubory, bez průhlednosti", lossy: true },
  { key: "webp", label: "WebP", ext: "webp", mime: "image/webp", hint: "moderní, malý", lossy: true, alpha: true },
  { key: "bmp", label: "BMP", ext: "bmp", mime: "image/bmp", hint: "nekomprimovaný" },
  { key: "tiff", label: "TIFF", ext: "tiff", mime: "image/tiff", hint: "nekomprimovaný, pro tisk/archivaci" },
  { key: "gif", label: "GIF", ext: "gif", mime: "image/gif", hint: "256 barev" },
];

interface GifEnc {
  GIFEncoder: () => { writeFrame: (idx: Uint8Array, w: number, h: number, o: { palette: number[][] }) => void; finish: () => void; bytes: () => Uint8Array };
  quantize: (data: Uint8Array, maxColors: number) => number[][];
  applyPalette: (data: Uint8Array, palette: number[][]) => Uint8Array;
}

/** Bílé pozadí pod průhledností (pro formáty bez alfa kanálu). */
function flatten(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width; c.height = src.height;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0);
  return c;
}

function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const { width: w, height: h } = canvas;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const row = Math.ceil((w * 3) / 4) * 4;
  const size = 54 + row * h;
  const buf = new ArrayBuffer(size);
  const v = new DataView(buf);
  v.setUint8(0, 0x42); v.setUint8(1, 0x4d);
  v.setUint32(2, size, true); v.setUint32(10, 54, true);
  v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true);
  v.setUint16(26, 1, true); v.setUint16(28, 24, true); v.setUint32(34, row * h, true);
  v.setInt32(38, 2835, true); v.setInt32(42, 2835, true);
  const out = new Uint8Array(buf);
  for (let y = 0; y < h; y++) {
    let o = 54 + (h - 1 - y) * row;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      out[o++] = rgba[i + 2]; out[o++] = rgba[i + 1]; out[o++] = rgba[i];
    }
  }
  return new Blob([buf], { type: "image/bmp" });
}

function encodeTiff(canvas: HTMLCanvasElement): Blob {
  const { width: w, height: h } = canvas;
  const rgba = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const entries = 11;
  const ifdOff = 8;
  const ifdSize = 2 + entries * 12 + 4;
  const bitsOff = ifdOff + ifdSize;   // 3× uint16 (BitsPerSample)
  const resOff = bitsOff + 8;         // 2× rational (X/Y rozlišení)
  const dataOff = resOff + 16;
  const dataLen = w * h * 3;
  const buf = new ArrayBuffer(dataOff + dataLen);
  const v = new DataView(buf);
  v.setUint8(0, 0x49); v.setUint8(1, 0x49); v.setUint16(2, 42, true); v.setUint32(4, ifdOff, true);
  v.setUint16(ifdOff, entries, true);
  let p = ifdOff + 2;
  const tag = (id: number, type: number, count: number, value: number) => {
    v.setUint16(p, id, true); v.setUint16(p + 2, type, true); v.setUint32(p + 4, count, true);
    if (type === 3 && count === 1) v.setUint16(p + 8, value, true); else v.setUint32(p + 8, value, true);
    p += 12;
  };
  tag(256, 4, 1, w); tag(257, 4, 1, h); tag(258, 3, 3, bitsOff); tag(259, 3, 1, 1); tag(262, 3, 1, 2);
  tag(273, 4, 1, dataOff); tag(277, 3, 1, 3); tag(278, 4, 1, h); tag(279, 4, 1, dataLen);
  tag(282, 5, 1, resOff); tag(283, 5, 1, resOff + 8);
  v.setUint32(p, 0, true);
  v.setUint16(bitsOff, 8, true); v.setUint16(bitsOff + 2, 8, true); v.setUint16(bitsOff + 4, 8, true);
  v.setUint32(resOff, 144, true); v.setUint32(resOff + 4, 1, true); v.setUint32(resOff + 8, 144, true); v.setUint32(resOff + 12, 1, true);
  const out = new Uint8Array(buf, dataOff);
  for (let i = 0, o = 0; i < rgba.length; i += 4) { out[o++] = rgba[i]; out[o++] = rgba[i + 1]; out[o++] = rgba[i + 2]; }
  return new Blob([buf], { type: "image/tiff" });
}

async function encodeGif(canvas: HTMLCanvasElement): Promise<Blob> {
  await loadScript("/tools/assets/js/lib/gifenc.js");
  const g = (window as unknown as { gifenc?: GifEnc }).gifenc;
  if (!g) throw new Error("Knihovnu gifenc se nepodařilo načíst.");
  const { width: w, height: h } = canvas;
  const data = new Uint8Array(canvas.getContext("2d")!.getImageData(0, 0, w, h).data.buffer);
  const palette = g.quantize(data, 256);
  const enc = g.GIFEncoder();
  enc.writeFrame(g.applyPalette(data, palette), w, h, { palette });
  enc.finish();
  return new Blob([enc.bytes() as BlobPart], { type: "image/gif" });
}

/** Zakóduje canvas do zvoleného formátu. `quality` platí pro JPEG/WebP (0–1). */
export async function encodeCanvas(canvas: HTMLCanvasElement, format: RasterFormat, quality = 0.9): Promise<Blob> {
  const meta = RASTER_FORMATS.find((f) => f.key === format)!;
  const src = meta.alpha ? canvas : flatten(canvas);
  if (format === "bmp") return encodeBmp(src);
  if (format === "tiff") return encodeTiff(src);
  if (format === "gif") return encodeGif(src);
  const blob = await new Promise<Blob | null>((res) => src.toBlob(res, meta.mime, meta.lossy ? quality : undefined));
  if (!blob || blob.type !== meta.mime) throw new Error(`Prohlížeč neumí uložit formát ${meta.label}. Zvolte jiný.`);
  return blob;
}
