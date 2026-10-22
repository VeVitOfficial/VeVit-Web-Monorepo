// Generuje TypeScript typy ze schématu obsahu AIFB (bez externích závislostí).
//   node scripts/aifb-gen-types.mjs          zapíše src/lib/edu/aifb/types.generated.ts
//   node scripts/aifb-gen-types.mjs --check  selže, když je soubor zastaralý (CI)
// Podporuje jen podmnožinu JSON Schema, kterou schéma používá: $ref, const, enum, type
// (i pole typů), properties/required, items, oneOf.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "src/content/aifb/aifb-content.schema.json");
const outPath = join(root, "src/lib/edu/aifb/types.generated.ts");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const pascal = (key) => key.charAt(0).toUpperCase() + key.slice(1);

function typeOf(node, indent) {
  if (node.$ref) return pascal(node.$ref.replace("#/$defs/", ""));
  if ("const" in node) return JSON.stringify(node.const);
  if (node.enum) return node.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (node.oneOf) return node.oneOf.map((branch) => typeOf(branch, indent)).join(" | ");
  if (Array.isArray(node.type)) return node.type.map((name) => typeOf({ type: name }, indent)).join(" | ");
  switch (node.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const item = typeOf(node.items ?? {}, indent);
      return item.includes(" | ") || item.includes("{") ? `(${item})[]` : `${item}[]`;
    }
    case "object": {
      const props = node.properties;
      if (!props) return "Record<string, unknown>";
      const required = new Set(node.required ?? []);
      const pad = "  ".repeat(indent + 1);
      const lines = Object.entries(props).map(([key, value]) => {
        const doc = value.description ? `${pad}/** ${value.description} */\n` : "";
        return `${doc}${pad}${key}${required.has(key) ? "" : "?"}: ${typeOf(value, indent + 1)};`;
      });
      return `{\n${lines.join("\n")}\n${"  ".repeat(indent)}}`;
    }
    default:
      return "unknown";
  }
}

const parts = [
  "// GENEROVÁNO skriptem scripts/aifb-gen-types.mjs ze src/content/aifb/aifb-content.schema.json.",
  "// Needitovat ručně: po změně schématu spusť `npm run gen:aifb-types`.",
  "",
];
for (const [key, def] of Object.entries(schema.$defs ?? {})) {
  if (def.description) parts.push(`/** ${def.description} */`);
  parts.push(`export type ${pascal(key)} = ${typeOf(def, 0)};`, "");
}
parts.push(`/** ${schema.title} */`, `export type AifbContent = ${typeOf(schema, 0)};`, "");
const output = parts.join("\n");

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(outPath, "utf8");
  } catch {
    // chybějící soubor = zastaralý
  }
  if (current !== output) {
    console.error("types.generated.ts je zastaralý. Spusť: npm run gen:aifb-types");
    process.exit(1);
  }
  console.log("types.generated.ts je aktuální.");
} else {
  writeFileSync(outPath, output);
  console.log(`Zapsáno ${outPath}`);
}
