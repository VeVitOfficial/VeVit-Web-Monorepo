// Statické soubory převodníku (WASM enginy, fonty, OCR data): stahování s průběhem
// a Cache API, takže druhé použití je okamžité a offline. Běží v okně i ve workeru.
//
// Soubory leží v public/tools/assets/js/lib/converter/ (D1) a Next je servíruje
// s `Cache-Control: immutable` — verzi v URL (`?v=`) proto nese build.json enginu.

export const CONVERTER_BASE = "/tools/assets/js/lib/converter/";
export const CACHE_NAME = "vevit-converter-v1";

export interface DownloadProgress {
  /** Co se stahuje (pro UI: "engine", "fonts", "ocr"…). */
  label: string;
  loaded: number;
  /** 0, když server délku nesdělí. */
  total: number;
  /** Načteno z Cache API, bez sítě. */
  cached: boolean;
}

export type ProgressFn = (p: DownloadProgress) => void;

function openCache(): Promise<Cache | null> {
  // Cache API chybí v nezabezpečeném kontextu a v některých privátních režimech.
  if (typeof caches === "undefined") return Promise.resolve(null);
  return caches.open(CACHE_NAME).catch(() => null);
}

/**
 * Stáhne `path` (relativně k CONVERTER_BASE nebo absolutní URL na stejném originu)
 * a vrátí bajty. Odpověď se uloží do Cache API; při dalším volání se vrátí odtud.
 */
export async function fetchAsset(path: string, label: string, onProgress?: ProgressFn, signal?: AbortSignal): Promise<Uint8Array> {
  const url = new URL(path, new URL(CONVERTER_BASE, self.location.origin)).toString();
  const cache = await openCache();
  const hit = cache ? await cache.match(url).catch(() => undefined) : undefined;
  if (hit) {
    const buf = new Uint8Array(await hit.arrayBuffer());
    onProgress?.({ label, loaded: buf.length, total: buf.length, cached: true });
    return buf;
  }
  const res = await fetch(url, { signal, credentials: "same-origin" });
  if (!res.ok || !res.body) throw new AssetError(`${label}: HTTP ${res.status}`, url);
  // Content-Length je u brotli přenosu komprimovaná velikost, průběh je tak jen orientační.
  const total = Number(res.headers.get("content-length") ?? 0);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.({ label, loaded, total: Math.max(total, loaded), cached: false });
  }
  const buf = concat(chunks, loaded);
  if (cache) {
    const type = res.headers.get("content-type") ?? "application/octet-stream";
    await cache.put(url, new Response(buf.slice().buffer, { headers: { "content-type": type } })).catch(() => undefined);
  }
  onProgress?.({ label, loaded, total: loaded, cached: false });
  return buf;
}

export async function fetchJson<T>(path: string, label: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await fetchAsset(path, label))) as T;
}

/** Je soubor už v cache? (UI tak může napsat „engine je připraven“ místo velikosti stažení.) */
export async function isCached(path: string): Promise<boolean> {
  const cache = await openCache();
  if (!cache) return false;
  const url = new URL(path, new URL(CONVERTER_BASE, self.location.origin)).toString();
  return !!(await cache.match(url).catch(() => undefined));
}

function concat(chunks: Uint8Array[], size: number): Uint8Array {
  if (chunks.length === 1) return chunks[0];
  const out = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// Bez parameter properties: moduly převodníku musí jít spustit v Node přes type stripping (testy).
export class AssetError extends Error {
  readonly url: string;
  constructor(message: string, url: string) {
    super(message);
    this.name = "AssetError";
    this.url = url;
  }
}
