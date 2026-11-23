// Úpravy obsahu AIFB adminem: překryv nad JSON v repozitáři (soubory se nemění, pravidlo R6).
// Úprava nahrazuje jednu „jednotku“ obsahu (lekci, level, modul, téma teorie…) určenou cestou:
//   "@"                        kořen dokumentu (např. název a stav kurzu)
//   "levels/[zs1-blok-a]"      prvek pole podle id
//   "topics/foundation"        klíč objektu
// Jednotky vyšší úrovně vynechávají své podřízené části (level bez lekcí, modul bez lekcí), takže
// se úpravy levelu a jeho lekcí nepřepisují navzájem. Soubor je bez importů (server, klient, testy).

export type EditDoc = "zs1" | "zs2" | "ss" | "theory" | "kurz" | "pilots";

export const EDIT_DOCS: readonly EditDoc[] = ["zs1", "zs2", "ss", "theory", "kurz", "pilots"];

export function isEditDoc(value: unknown): value is EditDoc {
  return typeof value === "string" && (EDIT_DOCS as readonly string[]).includes(value);
}

export const ROOT_PATH = "@";

type Segment = { key: string } | { id: string };
type Json = Record<string, unknown>;

const KEY = /^[A-Za-z0-9_-]{1,60}$/;
const ID = /^[a-z0-9-]{1,80}$/;

export function parsePath(path: string): Segment[] | null {
  if (path === ROOT_PATH) return [];
  if (path.length > 300) return null;
  const segments: Segment[] = [];
  for (const part of path.split("/")) {
    const byId = /^\[(.+)\]$/.exec(part);
    if (byId) {
      if (!ID.test(byId[1])) return null;
      segments.push({ id: byId[1] });
    } else {
      if (!KEY.test(part)) return null;
      segments.push({ key: part });
    }
  }
  return segments;
}

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

function child(node: unknown, segment: Segment): unknown {
  // Jen vlastní klíče (ne __proto__, constructor apod. z prototypu).
  if ("key" in segment) return isObject(node) && Object.hasOwn(node, segment.key) ? node[segment.key] : undefined;
  return Array.isArray(node) ? node.find((item) => isObject(item) && item.id === segment.id) : undefined;
}

export function getAt(root: unknown, segments: Segment[]): unknown {
  return segments.reduce<unknown>((node, segment) => (node === undefined ? undefined : child(node, segment)), root);
}

/** Nová kopie stromu s nahrazenou hodnotou (kopírují se jen uzly na cestě, ostatní se sdílí). */
function setAt(node: unknown, segments: Segment[], value: unknown): unknown {
  if (segments.length === 0) return value;
  const [head, ...rest] = segments;
  if ("key" in head) {
    if (!isObject(node) || !Object.hasOwn(node, head.key)) throw new Error("missing");
    return { ...node, [head.key]: setAt(node[head.key], rest, value) };
  }
  if (!Array.isArray(node)) throw new Error("missing");
  const index = node.findIndex((item) => isObject(item) && item.id === head.id);
  if (index < 0) throw new Error("missing");
  const copy = node.slice();
  copy[index] = setAt(node[index], rest, value);
  return copy;
}

// ── Jednotky ───────────────────────────────────────────────────────────────

const UNIT_RULES: Record<EditDoc, { pattern: RegExp; omit: string[] }[]> = {
  zs1: categoryRules(),
  zs2: categoryRules(),
  ss: categoryRules(),
  theory: [
    { pattern: /^@$/, omit: ["topics", "levels"] },
    { pattern: /^topics\/[A-Za-z0-9_-]+$/, omit: [] },
    { pattern: /^levels\/[A-Za-z0-9_-]+$/, omit: [] },
  ],
  kurz: [
    { pattern: /^@$/, omit: ["modules"] },
    { pattern: /^modules\/\[[a-z0-9-]+\]$/, omit: ["lessons"] },
    { pattern: /^modules\/\[[a-z0-9-]+\]\/lessons\/\[[a-z0-9-]+\]$/, omit: [] },
  ],
  pilots: [{ pattern: /^lessons\/[A-Za-z0-9_-]+$/, omit: [] }],
};

function categoryRules() {
  return [
    { pattern: /^category$/, omit: [] },
    { pattern: /^guide\/\[[a-z0-9-]+\]$/, omit: [] },
    { pattern: /^levels\/\[[a-z0-9-]+\]$/, omit: ["lessons"] },
    { pattern: /^levels\/\[[a-z0-9-]+\]\/lessons\/\[[a-z0-9-]+\]$/, omit: [] },
  ];
}

/** Vynechané části jednotky, nebo null, když cesta není upravitelná jednotka. */
export function unitOmit(doc: EditDoc, path: string): string[] | null {
  return UNIT_RULES[doc].find((rule) => rule.pattern.test(path))?.omit ?? null;
}

function withoutKeys(value: Json, keys: string[]): Json {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

/** Hodnota jednotky pro editor (bez vynechaných částí), nebo undefined. */
export function unitValue(doc: EditDoc, data: unknown, path: string): Json | undefined {
  const omit = unitOmit(doc, path);
  const segments = parsePath(path);
  if (omit === null || segments === null) return undefined;
  const value = getAt(data, segments);
  return isObject(value) ? withoutKeys(value, omit) : undefined;
}

/** Chyby nové hodnoty jednotky (tvar, neměnné id, žádné vynechané části). */
export function unitValueErrors(doc: EditDoc, data: unknown, path: string, value: unknown): string[] {
  const omit = unitOmit(doc, path);
  const segments = parsePath(path);
  if (omit === null || segments === null) return [`cestu „${path}“ nejde upravovat`];
  const current = getAt(data, segments);
  if (!isObject(current)) return [`„${path}“ v obsahu neexistuje`];
  if (!isObject(value)) return ["hodnota musí být objekt"];
  const errors: string[] = [];
  if ("id" in current && value.id !== current.id) errors.push(`id se nesmí měnit (má zůstat „${String(current.id)}“)`);
  for (const key of omit) if (key in value) errors.push(`„${key}“ se upravuje zvlášť`);
  return errors;
}

/** Použije jednu úpravu: hodnota jednotky + vynechané části z aktuálního obsahu. Neplatná cesta = beze změny. */
export function applyUnit<T>(doc: EditDoc, data: T, path: string, value: unknown): T {
  if (unitValueErrors(doc, data, path, value).length > 0) return data;
  const segments = parsePath(path)!;
  const current = getAt(data, segments) as Json;
  const omit = unitOmit(doc, path)!;
  const merged = { ...(value as Json), ...Object.fromEntries(omit.filter((key) => key in current).map((key) => [key, current[key]])) };
  return setAt(data, segments, merged) as T;
}

export type StoredEdit = { path: string; value: unknown };

/** Platné úpravy dokumentu: nejdřív mělčí jednotky (kurz, level), potom hlubší (lekce). */
export function applyEdits<T>(doc: EditDoc, base: T, edits: readonly StoredEdit[]): T {
  const depth = (path: string) => (path === ROOT_PATH ? 0 : path.split("/").length);
  return [...edits]
    .filter((edit) => edit.value !== null && edit.value !== undefined)
    .sort((a, b) => depth(a.path) - depth(b.path))
    .reduce((data, edit) => applyUnit(doc, data, edit.path, edit.value), base);
}

// ── Seznam jednotek pro přehled úprav ─────────────────────────────────────

export type EditUnit = { path: string; label: string; depth: number };

const str = (value: unknown) => (typeof value === "string" ? value : "");
const idsOf = (list: unknown) => (Array.isArray(list) ? list.filter(isObject) : []);

export function listUnits(doc: EditDoc, data: unknown): EditUnit[] {
  const root = isObject(data) ? data : {};
  const units: EditUnit[] = [];
  if (doc === "zs1" || doc === "zs2" || doc === "ss") {
    units.push({ path: "category", label: str((root.category as Json | undefined)?.title), depth: 0 });
    for (const chapter of idsOf(root.guide)) units.push({ path: `guide/[${str(chapter.id)}]`, label: `Průvodce ${str(chapter.number)}. ${str(chapter.title)}`, depth: 1 });
    for (const level of idsOf(root.levels)) {
      units.push({ path: `levels/[${str(level.id)}]`, label: `${str(level.code)}: ${str(level.title)}`, depth: 1 });
      for (const lesson of idsOf(level.lessons)) {
        units.push({ path: `levels/[${str(level.id)}]/lessons/[${str(lesson.id)}]`, label: str(lesson.title) || str(lesson.id), depth: 2 });
      }
    }
  } else if (doc === "theory") {
    units.push({ path: ROOT_PATH, label: "Stav a poznámka", depth: 0 });
    for (const [key, topic] of Object.entries(isObject(root.topics) ? root.topics : {})) {
      units.push({ path: `topics/${key}`, label: `Téma ${key}: ${str((topic as Json).lead).slice(0, 60)}`, depth: 1 });
    }
    for (const key of Object.keys(isObject(root.levels) ? root.levels : {})) units.push({ path: `levels/${key}`, label: `Level ${key}`, depth: 1 });
  } else if (doc === "kurz") {
    units.push({ path: ROOT_PATH, label: str(root.title), depth: 0 });
    for (const mod of idsOf(root.modules)) {
      units.push({ path: `modules/[${str(mod.id)}]`, label: `${str(mod.code)}: ${str(mod.title)}`, depth: 1 });
      for (const lesson of idsOf(mod.lessons)) {
        units.push({ path: `modules/[${str(mod.id)}]/lessons/[${str(lesson.id)}]`, label: str(lesson.title), depth: 2 });
      }
    }
  } else {
    for (const key of Object.keys(isObject(root.lessons) ? root.lessons : {})) units.push({ path: `lessons/${key}`, label: key, depth: 1 });
  }
  return units;
}

// ── Odkazy ze stránek ──────────────────────────────────────────────────────

export const lessonEditPath = (levelId: string, lessonId: string) => `levels/[${levelId}]/lessons/[${lessonId}]`;
export const levelEditPath = (levelId: string) => `levels/[${levelId}]`;
export const moduleEditPath = (moduleId: string) => `modules/[${moduleId}]`;
export const courseLessonEditPath = (moduleId: string, lessonId: string) => `modules/[${moduleId}]/lessons/[${lessonId}]`;
