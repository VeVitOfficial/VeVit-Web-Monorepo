// Kontrola obsahu AIFB (CI i build): bez externích závislostí.
//   node scripts/aifb-validate.mjs
// 1) každý obsahový soubor proti aifb-content.schema.json (podmnožina JSON Schema 2020-12),
// 2) invarianty z plánu: 3 kategorie s obsahem, 16 levelů, 96 lekcí, unikátní id,
//    shoda katalogu s obsahem, tvar id lekcí, odkazy „kapitola/oddíl" vedou na existující oddíl,
//    certifikace jen jako „planned", text pro žáky jen ve stavu todo/draft.
// Obsahové soubory se nikdy nepřepisují ani nepřeformátovávají.

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DATA_PROTECTION_ANCHOR, PRINTABLE_SECTIONS } from "../src/lib/edu/aifb/guide.ts";
import { guideRefsIn } from "../src/lib/edu/aifb/markdown.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultDir = join(repoRoot, "src/content/aifb");
const CATEGORY_FILES = { zs1: "aifb-content-zs1.json", zs2: "aifb-content-zs2.json", ss: "aifb-content-ss.json" };
const EXPECTED = { categories: 3, levels: 16, lessons: 96 };

// ── JSON Schema (jen použité klíčové slovo) ─────────────────────────────────

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function typeMatches(type, value) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}

function resolveRef(root, ref) {
  return ref
    .replace(/^#\//, "")
    .split("/")
    .reduce((node, key) => node?.[key], root);
}

function validateNode(root, schema, data, path, errors) {
  if (schema.$ref) return validateNode(root, resolveRef(root, schema.$ref), data, path, errors);
  if ("const" in schema && !deepEqual(schema.const, data)) {
    errors.push(`${path}: očekává se ${JSON.stringify(schema.const)}`);
    return;
  }
  if (schema.enum && !schema.enum.some((value) => deepEqual(value, data))) {
    errors.push(`${path}: hodnota ${JSON.stringify(data)} není v ${JSON.stringify(schema.enum)}`);
    return;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(type, data))) {
      errors.push(`${path}: očekává se typ ${types.join("|")}`);
      return;
    }
  }
  if (schema.oneOf) {
    // Diskriminovaná unie podle `type`: zkontroluje jen odpovídající větev (srozumitelnější chyby).
    const byType = schema.oneOf.find((branch) => {
      const resolved = branch.$ref ? resolveRef(root, branch.$ref) : branch;
      return resolved.properties?.type?.const !== undefined && resolved.properties.type.const === data?.type;
    });
    if (byType) return validateNode(root, byType, data, path, errors);
    const matching = schema.oneOf.filter((branch) => {
      const local = [];
      validateNode(root, branch, data, path, local);
      return local.length === 0;
    });
    if (matching.length !== 1) errors.push(`${path}: neodpovídá právě jedné variantě (oneOf), shod ${matching.length}`);
    return;
  }
  if (typeof data === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) errors.push(`${path}: nesplňuje vzor ${schema.pattern}`);
    if (schema.minLength !== undefined && data.length < schema.minLength) errors.push(`${path}: příliš krátké`);
  }
  if (typeof data === "number") {
    if (schema.minimum !== undefined && data < schema.minimum) errors.push(`${path}: menší než ${schema.minimum}`);
    if (schema.maximum !== undefined && data > schema.maximum) errors.push(`${path}: větší než ${schema.maximum}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) errors.push(`${path}: méně než ${schema.minItems} položek`);
    if (schema.maxItems !== undefined && data.length > schema.maxItems) errors.push(`${path}: více než ${schema.maxItems} položek`);
    if (schema.items) data.forEach((item, index) => validateNode(root, schema.items, item, `${path}[${index}]`, errors));
  }
  if (typeof data === "object" && data !== null && !Array.isArray(data) && (schema.properties || schema.required)) {
    for (const key of schema.required ?? []) {
      if (!(key in data)) errors.push(`${path}: chybí povinné pole "${key}"`);
    }
    for (const [key, value] of Object.entries(data)) {
      if (schema.properties?.[key]) validateNode(root, schema.properties[key], value, `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}: nepovolené pole "${key}"`);
    }
  }
}

export function validateAgainstSchema(schema, data, label) {
  const errors = [];
  validateNode(schema, schema, data, label, errors);
  return errors;
}

// ── Invarianty obsahu ───────────────────────────────────────────────────────

const levelSlug = (categoryId, levelId) => levelId.slice(categoryId.length + 1);

function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

export function validateAifb(dir = defaultDir, publicDir = join(repoRoot, "public")) {
  const errors = [];
  const warnings = [];
  const read = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"));
  const schema = read("aifb-content.schema.json");
  const catalog = read("aifb-catalog.json");
  const seenIds = new Map();
  const claim = (id, where) => {
    if (seenIds.has(id)) errors.push(`duplicitní id "${id}" (${seenIds.get(id)} a ${where})`);
    else seenIds.set(id, where);
  };
  let levelTotal = 0;
  let lessonTotal = 0;

  const catalogWithContent = catalog.categories.filter((category) => category.contentFile);
  if (catalogWithContent.length !== EXPECTED.categories) {
    errors.push(`katalog má ${catalogWithContent.length} kategorií s obsahem, očekává se ${EXPECTED.categories}`);
  }

  for (const [categoryId, fileName] of Object.entries(CATEGORY_FILES)) {
    const content = read(fileName);
    errors.push(...validateAgainstSchema(schema, content, fileName));
    if (content.category?.id !== categoryId) errors.push(`${fileName}: category.id musí být "${categoryId}"`);
    const catalogCategory = catalog.categories.find((category) => category.id === categoryId);
    if (!catalogCategory) {
      errors.push(`katalog neobsahuje kategorii "${categoryId}"`);
      continue;
    }
    if (catalogCategory.contentFile !== fileName) errors.push(`katalog: contentFile kategorie ${categoryId} je "${catalogCategory.contentFile}"`);
    if (catalogCategory.theme !== content.category.theme) errors.push(`${categoryId}: téma v katalogu a obsahu se liší`);
    if (catalogCategory.unit !== content.category.unit) errors.push(`${categoryId}: jednotka v katalogu a obsahu se liší`);
    if (catalogCategory.levels.length !== content.levels.length) {
      errors.push(`${categoryId}: katalog má ${catalogCategory.levels.length} levelů, obsah ${content.levels.length}`);
    }

    // Průvodce: id kapitol/oddílů a množina kotev pro kontrolu odkazů.
    const anchors = new Set();
    for (const chapter of content.guide) {
      claim(`${categoryId}:${chapter.id}`, fileName);
      if (chapter.id !== `g${chapter.number}`) errors.push(`${fileName}: kapitola ${chapter.number} má id "${chapter.id}", očekává se "g${chapter.number}"`);
      anchors.add(chapter.id);
      for (const section of chapter.sections ?? []) {
        claim(`${categoryId}:${section.id}`, fileName);
        const expected = `g${section.number.replace(".", "-")}`;
        if (section.id !== expected) errors.push(`${fileName}: oddíl ${section.number} má id "${section.id}", očekává se "${expected}"`);
        anchors.add(section.id);
      }
    }

    content.levels.forEach((level, index) => {
      levelTotal += 1;
      claim(level.id, fileName);
      if (!level.id.startsWith(`${categoryId}-`)) errors.push(`${fileName}: id levelu "${level.id}" nezačíná "${categoryId}-"`);
      const catalogLevel = catalogCategory.levels[index];
      if (!catalogLevel || catalogLevel.id !== level.id) {
        errors.push(`${categoryId}: pořadí/id levelů v katalogu a obsahu se liší na pozici ${index + 1} (${level.id})`);
      } else {
        const expectedRoute = `/edu/ai-gramotnost/aifb/${categoryId}/${levelSlug(categoryId, level.id)}`;
        if (catalogLevel.route !== expectedRoute) errors.push(`${level.id}: route v katalogu je "${catalogLevel.route}", očekává se "${expectedRoute}"`);
        if (catalogLevel.title !== level.title) errors.push(`${level.id}: název v katalogu a obsahu se liší`);
        if (catalogLevel.code !== level.code) errors.push(`${level.id}: kód v katalogu a obsahu se liší`);
        if (catalogLevel.hours !== level.hours) errors.push(`${level.id}: hodiny v katalogu a obsahu se liší`);
        if (catalogLevel.lessonCount !== level.lessons.length) errors.push(`${level.id}: lessonCount v katalogu (${catalogLevel.lessonCount}) neodpovídá ${level.lessons.length} lekcím`);
      }
      if (level.lessonCount !== level.lessons.length) errors.push(`${level.id}: lessonCount ${level.lessonCount} ≠ ${level.lessons.length}`);
      if (level.certification && level.certification.status !== "planned") errors.push(`${level.id}: certifikace musí mít stav "planned"`);

      level.lessons.forEach((lesson, lessonIndex) => {
        lessonTotal += 1;
        claim(lesson.id, fileName);
        const expectedId = lesson.type === "theory" ? `${level.id}-teorie` : `${level.id}-cv${lesson.order}`;
        if (lesson.id !== expectedId) errors.push(`${lesson.id}: očekává se id "${expectedId}"`);
        const expectedOrder = lessonIndex;
        if (lesson.order !== expectedOrder) errors.push(`${lesson.id}: order ${lesson.order}, očekává se ${expectedOrder}`);
        if ((lessonIndex === 0) !== (lesson.type === "theory")) errors.push(`${lesson.id}: teorie musí být první a jediná`);
        const status = lesson.pupil?.status;
        if (status === "reviewed" || status === "published") {
          warnings.push(`${lesson.id}: pupil.status "${status}" smí nastavit jen vlastník`);
        }
      });
    });

    // Odkazy „kapitola N" / „oddíl N.M" musí vést na existující kotvu průvodce téže kategorie.
    for (const text of collectStrings([content.guide, content.levels])) {
      for (const ref of guideRefsIn(text)) {
        if (!anchors.has(ref.anchor)) errors.push(`${fileName}: odkaz „${ref.text}" vede na neexistující oddíl (#${ref.anchor})`);
      }
    }
    // Oddíly, na které odkazuje upozornění u lekcí s AI, a oddíly s tiskem/kopírováním, musí existovat.
    const needed = [DATA_PROTECTION_ANCHOR[categoryId], ...(PRINTABLE_SECTIONS[categoryId] ?? [])];
    for (const anchor of needed) {
      if (!anchors.has(anchor)) errors.push(`${fileName}: průvodce nemá oddíl "${anchor}" požadovaný aplikací`);
    }
  }

  // Soubory ke stažení: položka musí odpovídat skutečnému souboru (existence i velikost).
  const downloads = read("downloads.json");
  for (const item of downloads.files ?? []) {
    if (!CATEGORY_FILES[item.category]) errors.push(`downloads.json: neznámá kategorie "${item.category}"`);
    if (!String(item.path).endsWith(`/${item.file}`)) errors.push(`downloads.json: path "${item.path}" nekončí názvem souboru "${item.file}"`);
    const onDisk = join(publicDir, String(item.path));
    if (!existsSync(onDisk)) errors.push(`downloads.json: soubor ${item.path} neexistuje v public/`);
    else if (statSync(onDisk).size !== item.bytes) errors.push(`downloads.json: ${item.file} má ${statSync(onDisk).size} B, v manifestu ${item.bytes} B`);
  }

  const totals = catalog.totals ?? {};
  if (totals.categoriesWithContent !== catalogWithContent.length) errors.push("katalog: totals.categoriesWithContent neodpovídá počtu kategorií s obsahem");
  if (totals.levels !== levelTotal) errors.push(`katalog: totals.levels ${totals.levels} ≠ ${levelTotal}`);
  if (totals.lessons !== lessonTotal) errors.push(`katalog: totals.lessons ${totals.lessons} ≠ ${lessonTotal}`);
  if (levelTotal !== EXPECTED.levels) errors.push(`celkem ${levelTotal} levelů, očekává se ${EXPECTED.levels}`);
  if (lessonTotal !== EXPECTED.lessons) errors.push(`celkem ${lessonTotal} lekcí, očekává se ${EXPECTED.lessons}`);
  return { errors, warnings, summary: { categories: catalogWithContent.length, levels: levelTotal, lessons: lessonTotal } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings, summary } = validateAifb();
  for (const warning of warnings) console.warn(`VAROVÁNÍ ${warning}`);
  if (errors.length > 0) {
    console.error(`Obsah AIFB je neplatný (${errors.length} chyb):`);
    for (const error of errors) console.error(` - ${error}`);
    process.exit(1);
  }
  console.log(`Obsah AIFB je v pořádku: ${summary.categories} kategorie, ${summary.levels} levelů, ${summary.lessons} lekcí.`);
}
