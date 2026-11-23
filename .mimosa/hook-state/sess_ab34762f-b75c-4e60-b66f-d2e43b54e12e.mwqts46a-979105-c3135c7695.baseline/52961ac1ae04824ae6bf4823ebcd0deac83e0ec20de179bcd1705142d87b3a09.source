import "server-only";

import obce from "@/content/services/obce.json";
import { normalizeText, regionLabel } from "@/components/services/constants";

/**
 * Obce ČR se souřadnicemi (RÚIAN k 1. 1. 2018, zdroj github.com/33bcdd/souradnice-mest,
 * „volně k použití“). Řádek: [kód obce, název, okres, kraj (slug), lat, lng].
 */
type Row = [number, string, string, string, number, number];

export type City = {
  code: number;
  name: string;
  district: string;
  region: string;
  lat: number;
  lng: number;
  /** Název, u stejnojmenných obcí s okresem. */
  label: string;
};

const ROWS = obce as Row[];

// Největší města první, aby „Br…“ nabídlo Brno dřív než Bratronice.
const BIG_CITIES = [
  "Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Pardubice",
  "Ústí nad Labem", "Zlín", "Havířov", "Kladno", "Most", "Opava", "Jihlava", "Frýdek-Místek", "Karviná", "Teplice",
  "Karlovy Vary", "Chomutov", "Děčín", "Mladá Boleslav", "Prostějov", "Přerov", "Jablonec nad Nisou", "Třebíč",
  "Česká Lípa", "Třinec", "Tábor", "Znojmo", "Příbram", "Cheb", "Kolín", "Trutnov", "Písek", "Orlová", "Kroměříž",
  "Vsetín", "Šumperk", "Uherské Hradiště", "Břeclav", "Hodonín", "Český Těšín", "Litoměřice", "Havlíčkův Brod",
  "Nový Jičín", "Chrudim", "Krnov", "Strakonice", "Valašské Meziříčí", "Sokolov", "Klatovy", "Kopřivnice",
  "Jindřichův Hradec", "Žďár nad Sázavou", "Vyškov", "Blansko", "Náchod", "Beroun", "Mělník", "Kutná Hora",
];
const BIG_RANK = new Map(BIG_CITIES.map((name, index) => [name, index]));
// U velkých měst existují i menší stejnojmenné obce; hlavní je ta s nejnižším kódem okresu města.
const PRIMARY_DISTRICT: Record<string, string> = {
  Praha: "Praha", Brno: "Brno-město", Ostrava: "Ostrava-město", Plzeň: "Plzeň-město",
};

const nameCount = new Map<string, number>();
for (const row of ROWS) nameCount.set(row[1], (nameCount.get(row[1]) ?? 0) + 1);

const byCode = new Map<number, Row>(ROWS.map((row) => [row[0], row]));
const normalized = ROWS.map((row) => normalizeText(row[1]));

function toCity(row: Row): City {
  const duplicate = (nameCount.get(row[1]) ?? 0) > 1;
  return {
    code: row[0], name: row[1], district: row[2], region: row[3], lat: row[4], lng: row[5],
    label: duplicate ? `${row[1]} (okres ${row[2]})` : row[1],
  };
}

export function cityByCode(code: unknown): City | null {
  const number = typeof code === "number" ? code : Number(code);
  if (!Number.isInteger(number)) return null;
  const row = byCode.get(number);
  return row ? toCity(row) : null;
}

function rank(row: Row, index: number, query: string): number {
  const name = normalized[index];
  const big = BIG_RANK.get(row[1]);
  const primary = PRIMARY_DISTRICT[row[1]];
  const isBig = big !== undefined && (!primary || primary === row[2]);
  // Velká města vyhrají už při shodě začátku („usti“ → Ústí nad Labem před vesnicí Ústí).
  if (isBig && name.startsWith(query)) return big;
  if (name === query) return 100;
  if (name.startsWith(query)) return 200 + name.length;
  return 400 + name.length;
}

/** Našeptávač: přesná shoda, pak začátek názvu, pak výskyt; velká města první. */
export function searchCities(query: string, limit = 8): City[] {
  const q = normalizeText(query.trim()).slice(0, 60);
  if (q.length < 2) return [];
  const hits: { row: Row; score: number }[] = [];
  ROWS.forEach((row, index) => {
    const name = normalized[index];
    if (!name.includes(q)) return;
    const wordStart = name.startsWith(q) || name.includes(` ${q}`) || name.includes(`-${q}`);
    if (!wordStart && q.length < 4) return;
    hits.push({ row, score: rank(row, index, q) });
  });
  hits.sort((a, b) => a.score - b.score || a.row[1].localeCompare(b.row[1], "cs"));
  return hits.slice(0, limit).map((hit) => toCity(hit.row));
}

/** Vzdálenost vzdušnou čarou v km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function cityRegionLabel(city: City): string {
  return regionLabel(city.region);
}
