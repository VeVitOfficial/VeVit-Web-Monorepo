// Kontrola dat proti aifb-content.schema.json (jen použitá podmnožina JSON Schema 2020-12), bez
// závislostí. Používá ji validace obsahu (scripts/aifb-validate.mjs) i ukládání úprav adminem.

type Schema = Record<string, unknown> & {
  $ref?: string;
  const?: unknown;
  enum?: unknown[];
  type?: string | string[];
  oneOf?: Schema[];
  pattern?: string;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
};

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function typeMatches(type: string, value: unknown): boolean {
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

function resolveRef(root: Schema, ref: string): Schema {
  return ref
    .replace(/^#\//, "")
    .split("/")
    .reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], root) as Schema;
}

function validateNode(root: Schema, schema: Schema, data: unknown, path: string, errors: string[]): void {
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
    const dataType = (data as { type?: unknown } | null)?.type;
    const byType = schema.oneOf.find((branch) => {
      const resolved = branch.$ref ? resolveRef(root, branch.$ref) : branch;
      const constType = (resolved.properties?.type as Schema | undefined)?.const;
      return constType !== undefined && constType === dataType;
    });
    if (byType) return validateNode(root, byType, data, path, errors);
    const matching = schema.oneOf.filter((branch) => {
      const local: string[] = [];
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
    const items = schema.items;
    if (items) data.forEach((item, index) => validateNode(root, items, item, `${path}[${index}]`, errors));
  }
  if (typeof data === "object" && data !== null && !Array.isArray(data) && (schema.properties || schema.required)) {
    for (const key of schema.required ?? []) {
      if (!(key in data)) errors.push(`${path}: chybí povinné pole "${key}"`);
    }
    for (const [key, value] of Object.entries(data)) {
      const property = schema.properties?.[key];
      if (property) validateNode(root, property, value, `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}: nepovolené pole "${key}"`);
    }
  }
}

export function validateAgainstSchema(schema: unknown, data: unknown, label: string): string[] {
  const errors: string[] = [];
  validateNode(schema as Schema, schema as Schema, data, label, errors);
  return errors;
}
