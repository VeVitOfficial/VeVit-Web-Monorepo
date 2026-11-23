import "server-only";

import { AccountBackendUnavailableError } from "@/lib/account-session";
import { cityByCode, distanceKm, type City } from "@/lib/services-geo";
import { db, requestsByIds, type ServicesRequest } from "@/lib/services";
import { categoryLabel, expandCategories, type ServicesCategory } from "@/components/services/categories";
import {
  JOB_TYPES, PAGE_SIZE, POSTED, RADII, REGIONS, SORTS,
  jobTypeLabel, normalizeText, regionLabel, type JobType, type SortValue,
} from "@/components/services/constants";

/**
 * Filtry výpisu poptávek. Jediný zdroj pravdy pro stránku /services/poptavky
 * i pro hlídací psy (uložené hledání = query string téže stránky).
 *
 * URL: q, kat (víc), typ (víc), obec (kód), okruh (km), kraj, dalku (jen|ne),
 * od (Kč), stari (dny), bez_nabidek, spech, razeni, strana.
 */
export type RequestFilters = {
  q: string;
  categories: string[];
  jobTypes: JobType[];
  city: City | null;
  radius: number | null;
  region: string;
  remote: "any" | "only" | "exclude";
  budgetMin: number | null;
  posted: number | null;
  noOffers: boolean;
  urgent: boolean;
  sort: SortValue;
  page: number;
};

type Input = URLSearchParams | Record<string, string | string[] | undefined>;

function all(input: Input, key: string): string[] {
  if (input instanceof URLSearchParams) return input.getAll(key);
  const value = input[key];
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function one(input: Input, key: string): string {
  return (all(input, key)[0] ?? "").trim().slice(0, 100);
}

function int(value: string): number | null {
  if (!/^\d{1,9}$/.test(value.replace(/\s/g, ""))) return null;
  return Number(value.replace(/\s/g, ""));
}

export function parseRequestFilters(input: Input, categories: ServicesCategory[]): RequestFilters {
  const known = new Set(categories.map((category) => category.slug));
  const jobValues = new Set<string>(JOB_TYPES.map((item) => item.value));
  const city = cityByCode(one(input, "obec"));
  const radiusRaw = int(one(input, "okruh"));
  const radius = city ? (radiusRaw !== null && (RADII as readonly number[]).includes(radiusRaw) ? radiusRaw : 25) : null;
  const region = one(input, "kraj");
  const remote = one(input, "dalku");
  const posted = int(one(input, "stari"));
  const sort = one(input, "razeni");
  const page = int(one(input, "strana"));
  return {
    q: one(input, "q").slice(0, 80),
    categories: [...new Set(all(input, "kat").filter((slug) => known.has(slug)))].slice(0, 20),
    jobTypes: [...new Set(all(input, "typ").filter((value) => jobValues.has(value)))] as JobType[],
    city,
    radius,
    region: !city && REGIONS.some((item) => item.value === region) ? region : "",
    remote: remote === "jen" ? "only" : remote === "ne" ? "exclude" : "any",
    budgetMin: int(one(input, "od")),
    posted: posted !== null && POSTED.some((item) => item.value === posted) ? posted : null,
    noOffers: one(input, "bez_nabidek") === "1",
    urgent: one(input, "spech") === "1",
    sort: SORTS.some((item) => item.value === sort) && (sort !== "distance" || city) ? (sort as SortValue) : city ? "distance" : "newest",
    page: page !== null && page >= 1 && page <= 500 ? page : 1,
  };
}

/** Kanonický query string (bez výchozích hodnot); `override` mění jednotlivé položky. */
export function filtersToQuery(filters: RequestFilters, override: Partial<RequestFilters> = {}): string {
  const f = { ...filters, ...override };
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  for (const slug of f.categories) params.append("kat", slug);
  for (const type of f.jobTypes) params.append("typ", type);
  if (f.city) {
    params.set("obec", String(f.city.code));
    if (f.radius && f.radius !== 25) params.set("okruh", String(f.radius));
  } else if (f.region) params.set("kraj", f.region);
  if (f.remote === "only") params.set("dalku", "jen");
  if (f.remote === "exclude") params.set("dalku", "ne");
  if (f.budgetMin) params.set("od", String(f.budgetMin));
  if (f.posted) params.set("stari", String(f.posted));
  if (f.noOffers) params.set("bez_nabidek", "1");
  if (f.urgent) params.set("spech", "1");
  const defaultSort = f.city ? "distance" : "newest";
  if (f.sort !== defaultSort) params.set("razeni", f.sort);
  if (f.page > 1) params.set("strana", String(f.page));
  return params.toString();
}

export function hasActiveFilters(filters: RequestFilters): boolean {
  return Boolean(filters.q || filters.categories.length || filters.jobTypes.length || filters.city || filters.region
    || filters.remote !== "any" || filters.budgetMin || filters.posted || filters.noOffers || filters.urgent);
}

export type FilterChip = { label: string; query: string };

/** Aktivní filtry jako odebíratelné štítky. */
export function filterChips(filters: RequestFilters, categories: ServicesCategory[]): FilterChip[] {
  const chips: FilterChip[] = [];
  const base = { ...filters, page: 1 };
  if (filters.q) chips.push({ label: `„${filters.q}“`, query: filtersToQuery(base, { q: "" }) });
  for (const slug of filters.categories) {
    chips.push({ label: categoryLabel(slug, categories), query: filtersToQuery(base, { categories: filters.categories.filter((item) => item !== slug) }) });
  }
  for (const type of filters.jobTypes) {
    chips.push({ label: jobTypeLabel(type, true), query: filtersToQuery(base, { jobTypes: filters.jobTypes.filter((item) => item !== type) }) });
  }
  if (filters.city) chips.push({ label: `${filters.city.name} + ${filters.radius} km`, query: filtersToQuery(base, { city: null, radius: null }) });
  if (filters.region) chips.push({ label: regionLabel(filters.region), query: filtersToQuery(base, { region: "" }) });
  if (filters.remote === "only") chips.push({ label: "Jen na dálku", query: filtersToQuery(base, { remote: "any" }) });
  if (filters.remote === "exclude") chips.push({ label: "Bez práce na dálku", query: filtersToQuery(base, { remote: "any" }) });
  if (filters.budgetMin) chips.push({ label: `Rozpočet od ${new Intl.NumberFormat("cs-CZ").format(filters.budgetMin)} Kč`, query: filtersToQuery(base, { budgetMin: null }) });
  if (filters.posted) chips.push({ label: POSTED.find((item) => item.value === filters.posted)?.label ?? "", query: filtersToQuery(base, { posted: null }) });
  if (filters.noOffers) chips.push({ label: "Bez nabídek", query: filtersToQuery(base, { noOffers: false }) });
  if (filters.urgent) chips.push({ label: "Spěchá", query: filtersToQuery(base, { urgent: false }) });
  return chips;
}

/** Krátký popis hledání (název hlídacího psa, e-maily). */
export function describeFilters(filters: RequestFilters, categories: ServicesCategory[]): string {
  const parts = filterChips(filters, categories).map((chip) => chip.label.replace(/^„|“$/g, ""));
  return (parts.join(" · ") || "Všechny poptávky").slice(0, 80);
}

/**
 * Slova dotazu bez diakritiky a s oříznutou koncovkou, aby „kavárna“ našla
 * i „kavárnu“ a „doučování“ i „doučováním“ (čeština skloňuje, DB hledá podřetězec).
 */
export function searchWords(q: string): string[] {
  const stem = (word: string) => (/^\d/.test(word) ? word : word.length >= 7 ? word.slice(0, -2) : word.length >= 5 ? word.slice(0, -1) : word);
  return [...new Set(normalizeText(q).split(/[^a-z0-9+#.]+/).filter((word) => word.length >= 2).map(stem))].slice(0, 6);
}

export type RequestHit = ServicesRequest & { distance_km: number | null; offer_count: number };

export async function searchRequests(filters: RequestFilters, categories: ServicesCategory[], limit = PAGE_SIZE): Promise<{ items: RequestHit[]; total: number }> {
  const words = searchWords(filters.q);
  const expanded = expandCategories(filters.categories, categories);
  const { data, error } = await db().rpc("services_search_requests", {
    p_words: words.length ? words : null,
    p_categories: expanded.length ? expanded : null,
    p_job_types: filters.jobTypes.length ? filters.jobTypes : null,
    p_region: filters.region || null,
    p_lat: filters.city?.lat ?? null,
    p_lng: filters.city?.lng ?? null,
    p_radius_km: filters.city ? filters.radius : null,
    p_include_remote: filters.remote !== "exclude",
    p_remote_only: filters.remote === "only",
    p_budget_min: filters.budgetMin,
    p_posted_days: filters.posted,
    p_no_offers: filters.noOffers,
    p_urgent: filters.urgent,
    p_sort: filters.sort,
    p_limit: limit,
    p_offset: (filters.page - 1) * limit,
  });
  if (error) throw new AccountBackendUnavailableError(`search unavailable: ${error.code}`);
  const rows = (data ?? []) as { id: string; distance_km: number | null; offer_count: number; total_count: number }[];
  const requests = await requestsByIds(rows.map((row) => row.id));
  const meta = new Map(rows.map((row) => [row.id, row]));
  const items = requests.map((request) => ({
    ...request,
    distance_km: meta.get(request.id)?.distance_km ?? null,
    offer_count: meta.get(request.id)?.offer_count ?? 0,
  }));
  return { items, total: rows[0] ? Number(rows[0].total_count) : 0 };
}

/**
 * Odpovídá nová poptávka uloženému hledání? Stejná pravidla jako SQL
 * services_search_requests (bez „bez nabídek“ – nová poptávka nemá žádnou).
 */
export function requestMatchesFilters(request: ServicesRequest, filters: RequestFilters, categories: ServicesCategory[]): boolean {
  const expanded = expandCategories(filters.categories, categories);
  if (expanded.length && !expanded.includes(request.category)) return false;
  if (filters.jobTypes.length && !filters.jobTypes.includes(request.job_type as JobType)) return false;
  if (filters.remote === "only" && !request.remote) return false;
  const includeRemote = filters.remote !== "exclude";
  if (filters.region && request.region !== filters.region && !(includeRemote && request.remote)) return false;
  if (filters.city && filters.radius) {
    const near = request.lat !== null && request.lng !== null && distanceKm(filters.city, { lat: request.lat, lng: request.lng }) <= filters.radius;
    if (!near && !(includeRemote && request.remote)) return false;
  }
  if (filters.budgetMin && Math.max(request.budget_max ?? 0, request.budget_min ?? 0) < filters.budgetMin) return false;
  if (filters.urgent && !request.urgent) return false;
  const text = request.search_text || normalizeText(`${request.title} ${request.description}`);
  return searchWords(filters.q).every((word) => text.includes(word));
}
