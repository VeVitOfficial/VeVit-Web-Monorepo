// Kontrola DOCX (ZIP) před rozbalením: velikosti z centrálního adresáře, počet položek,
// kompresní poměr (zip bomba), makra. Nic se nerozbaluje — čte se jen adresář.
//
// Deklarované velikosti mohou lhát; engine (vetext) má vlastní limity na rozbalenou
// velikost části, takže tohle je první, levná vrstva.
import { LimitError, type ConverterLimits } from "./limits.ts";

export interface ZipEntryInfo {
  name: string;
  compressed: number;
  size: number;
}

export interface ZipReport {
  entries: ZipEntryInfo[];
  totalSize: number;
  /** word/vbaProject.bin a spol. Makra se nikdy nespouštějí; jen to hlásíme. */
  hasMacros: boolean;
  isDocx: boolean;
}

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/** Čte centrální adresář ZIPu (bez ZIP64 položek nad 4 GB — takový DOCX odmítneme). */
export function readZipDirectory(bytes: Uint8Array): ZipEntryInfo[] {
  // End of central directory: posledních 22 + až 65535 bajtů komentáře.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (u32(bytes, i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new LimitError("invalid_file", { reason: "not a zip" });
  const count = u16(bytes, eocd + 10);
  let off = u32(bytes, eocd + 16);
  const entries: ZipEntryInfo[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (off + 46 > bytes.length || u32(bytes, off) !== 0x02014b50) throw new LimitError("invalid_file", { reason: "broken central directory" });
    const compressed = u32(bytes, off + 20), size = u32(bytes, off + 24);
    const nameLen = u16(bytes, off + 28), extraLen = u16(bytes, off + 30), commentLen = u16(bytes, off + 32);
    if (compressed === 0xffffffff || size === 0xffffffff) throw new LimitError("zip_bomb", { reason: "zip64 entry" });
    const name = dec.decode(bytes.subarray(off + 46, off + 46 + nameLen));
    entries.push({ name, compressed, size });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export function checkDocx(bytes: Uint8Array, limits: ConverterLimits): ZipReport {
  if (bytes.length > limits.maxFileBytes) throw new LimitError("file_too_large", { size: bytes.length, limit: limits.maxFileBytes });
  if (u32(bytes, 0) !== 0x04034b50) {
    // Šifrovaný DOCX je OLE (CFB) kontejner, ne ZIP.
    if (u32(bytes, 0) === 0xe011cfd0) throw new LimitError("encrypted");
    throw new LimitError("invalid_file", { reason: "not a zip" });
  }
  const entries = readZipDirectory(bytes);
  if (entries.length > limits.maxZipEntries) throw new LimitError("zip_bomb", { entries: entries.length });
  let total = 0;
  for (const e of entries) {
    total += e.size;
    if (e.compressed > 0 && e.size / e.compressed > limits.maxCompressionRatio && e.size > 10 * 1024 * 1024) throw new LimitError("zip_bomb", { entry: e.name, ratio: Math.round(e.size / e.compressed) });
    if (e.name.includes("..") || e.name.startsWith("/")) throw new LimitError("invalid_file", { reason: "path traversal", entry: e.name });
  }
  if (total > limits.maxUnzippedBytes) throw new LimitError("zip_bomb", { size: total, limit: limits.maxUnzippedBytes });
  const names = new Set(entries.map((e) => e.name));
  return {
    entries,
    totalSize: total,
    hasMacros: entries.some((e) => /vbaProject\.bin$|vbaData\.xml$/i.test(e.name)),
    isDocx: names.has("word/document.xml") || names.has("[Content_Types].xml"),
  };
}
