// Limity podle zařízení: slabé zařízení (málo paměti, mobil) dostane varování předem
// a nižší limity, ať převod selže srozumitelně a ne pádem tabu.

export interface DeviceProfile {
  /** GB podle navigator.deviceMemory (Chromium; zaokrouhleno, max 8). null = neznámé. */
  memoryGb: number | null;
  cores: number;
  mobile: boolean;
  /** Slabé zařízení: ≤ 2 GB nebo mobil s ≤ 4 GB / bez údaje. */
  weak: boolean;
}

export interface ConverterLimits {
  maxFileBytes: number;
  maxPages: number;
  /** Nad touto velikostí UI předem upozorní, že převod může trvat déle. */
  warnFileBytes: number;
  /** Max. rozbalená velikost DOCX (ochrana proti zip bombě). */
  maxUnzippedBytes: number;
  maxZipEntries: number;
  /** Max. poměr rozbalená/komprimovaná velikost jedné položky. */
  maxCompressionRatio: number;
}

type NavigatorLike = { deviceMemory?: number; hardwareConcurrency?: number; userAgent?: string; maxTouchPoints?: number; userAgentData?: { mobile?: boolean } };

export function deviceProfile(nav: NavigatorLike = typeof navigator !== "undefined" ? (navigator as NavigatorLike) : {}): DeviceProfile {
  const memoryGb = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const ua = nav.userAgent ?? "";
  const mobile = nav.userAgentData?.mobile ?? (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1));
  const cores = nav.hardwareConcurrency ?? 2;
  const weak = (memoryGb != null && memoryGb <= 2) || (mobile && (memoryGb == null || memoryGb <= 4));
  return { memoryGb, cores, mobile, weak };
}

const MB = 1024 * 1024;

export function limitsFor(p: DeviceProfile): ConverterLimits {
  if (p.weak) {
    return { maxFileBytes: 25 * MB, maxPages: 60, warnFileBytes: 8 * MB, maxUnzippedBytes: 200 * MB, maxZipEntries: 5000, maxCompressionRatio: 200 };
  }
  return { maxFileBytes: 100 * MB, maxPages: 500, warnFileBytes: 30 * MB, maxUnzippedBytes: 600 * MB, maxZipEntries: 20000, maxCompressionRatio: 200 };
}

/** Chyba, která se uživateli ukáže tak, jak je (bez technického balastu). */
export class LimitError extends Error {
  readonly code: "file_too_large" | "too_many_pages" | "zip_bomb" | "out_of_memory" | "encrypted" | "invalid_file";
  readonly detail: Record<string, string | number>;
  constructor(code: LimitError["code"], detail: Record<string, string | number> = {}) {
    super(code);
    this.name = "LimitError";
    this.code = code;
    this.detail = detail;
  }
}

/** RangeError / „out of memory“ z WASM nebo alokace → srozumitelná chyba. */
export function isOutOfMemory(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? e);
  return e instanceof RangeError || /out of memory|memory access out of bounds|Array buffer allocation failed|Cannot allocate/i.test(msg);
}
