import { mapBinResponse, matchKnownBank } from "@/lib/payments/bin-response";
import type { CardBankKey } from "@/lib/payments/card-banks";
import { storeRest } from "@/lib/store-config";
import "server-only";

/**
 * BIN lookup behind /api/payments/bin: cache table first (8 digits, then 6), then the optional
 * external service from BIN_LOOKUP_URL. Only the 6-8 digit prefix is handled here and nothing
 * (not even the prefix) is logged.
 */

export type BinInfo = {
  bankKey: CardBankKey | null;
  bankName: string | null;
  scheme: string | null;
  funding: string | null;
  country: string | null;
};

interface CacheRow {
  prefix: string;
  bank_key: CardBankKey | null;
  bank_name: string | null;
  scheme: string | null;
  funding: string | null;
  country: string | null;
  source: string;
  fetched_at: string;
}

const LOOKUP_TIMEOUT_MS = 1500;
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Known-bank branding is only trusted for the two markets the local table covers.
const BRANDED_COUNTRIES = new Set(["CZ", "SK"]);

function infoFromRow(row: CacheRow): BinInfo | null {
  if (row.source === "miss") return null;
  return { bankKey: row.bank_key, bankName: row.bank_name, scheme: row.scheme, funding: row.funding, country: row.country };
}

async function readCache(prefix: string): Promise<{ hit: boolean; info: BinInfo | null }> {
  const candidates = prefix.length > 6 ? [prefix, prefix.slice(0, 6)] : [prefix];
  const { json } = await storeRest<CacheRow[]>("GET", "card_bin_cache", {
    query: `select=*&prefix=in.(${candidates.join(",")})`,
  });
  const now = Date.now();
  for (const candidate of candidates) {
    const row = json.find((r) => r.prefix === candidate);
    if (!row) continue;
    if (row.source === "miss" && now - new Date(row.fetched_at).getTime() > MISS_TTL_MS) continue;
    return { hit: true, info: infoFromRow(row) };
  }
  return { hit: false, info: null };
}

async function fetchExternal(prefix: string): Promise<{ status: "ok"; json: unknown } | { status: "miss" } | { status: "unavailable" }> {
  const template = process.env.BIN_LOOKUP_URL?.trim() ?? "";
  if (!template.includes("{bin}") || !/^https:\/\//.test(template)) return { status: "unavailable" };
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.BIN_LOOKUP_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  try {
    const response = await fetch(template.replace("{bin}", prefix), {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (response.status === 404) return { status: "miss" };
    if (!response.ok) return { status: "unavailable" };
    return { status: "ok", json: await response.json() };
  } catch {
    return { status: "unavailable" };
  }
}

async function writeCache(row: Omit<CacheRow, "fetched_at">): Promise<void> {
  await storeRest("POST", "card_bin_cache", {
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { ...row, fetched_at: new Date().toISOString() },
  });
}

export async function lookupBin(prefix: string): Promise<BinInfo | null> {
  if (!/^\d{6,8}$/.test(prefix)) return null;
  const cached = await readCache(prefix);
  if (cached.hit) return cached.info;

  const external = await fetchExternal(prefix);
  if (external.status === "unavailable") return null;
  if (external.status === "miss") {
    await writeCache({ prefix, bank_key: null, bank_name: null, scheme: null, funding: null, country: null, source: "miss" });
    return null;
  }

  const mapped = mapBinResponse(external.json);
  const known = mapped.country !== null && BRANDED_COUNTRIES.has(mapped.country) ? matchKnownBank(mapped.bankName) : null;
  const empty = mapped.bankName === null && mapped.scheme === null;
  await writeCache({
    prefix,
    bank_key: known,
    bank_name: mapped.bankName,
    scheme: mapped.scheme,
    funding: mapped.funding,
    country: mapped.country,
    source: empty ? "miss" : "external",
  });
  return empty ? null : { bankKey: known, bankName: mapped.bankName, scheme: mapped.scheme, funding: mapped.funding, country: mapped.country };
}
