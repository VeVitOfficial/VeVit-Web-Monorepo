// Minimální lokální náhrada Supabase Data API (PostgREST) pro natáčení promo videa.
// Drží tabulky v paměti (capture/fixtures.mjs), umí základní filtry, řazení,
// stránkování, počty, jednoduché embedy a RPC funkce, které stránky volají.
// Není to plná implementace PostgRESTu – jen tolik, aby se UI vykreslilo
// s realistickými ukázkovými daty. Aplikace se nemění: stačí jí nastavit
// SUPABASE_URL=http://127.0.0.1:54321 a libovolný SUPABASE_SECRET_KEY.
import http from "node:http";
import { buildFixtures, RPC } from "./fixtures.mjs";

const PORT = Number(process.env.MOCK_SUPABASE_PORT || 54321);
const VERBOSE = process.env.MOCK_VERBOSE === "1";
const db = buildFixtures();

// Vztahy pro embedy typu `alias:tabulka!hint(sloupce)` nebo `tabulka(sloupce)`.
// [zdrojová tabulka, cílová tabulka] -> jak spárovat řádky
const RELATIONS = {
  "services_offers>services_requests": { local: "request_id", foreign: "id", one: true },
  "services_requests>services_offers": { local: "id", foreign: "request_id", one: false },
  "services_reviews>users": { local: "author_id", foreign: "id", one: true },
  "user_ranks>ranks": { local: "rank_key", foreign: "key", one: true },
  "premium_subscriptions>tiers": { local: "tier", foreign: "key", one: true },
  "organization_members>organizations": { local: "organization_id", foreign: "id", one: true },
};

function splitTopLevel(input) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSelect(select) {
  const columns = [];
  const embeds = [];
  for (const part of splitTopLevel(select || "*")) {
    const match = part.match(/^(?:([a-zA-Z_]+):)?([a-zA-Z_]+)(?:!([a-zA-Z_]+))?\((.*)\)$/s);
    if (match) embeds.push({ alias: match[1] || match[2], table: match[2], hint: match[3] || null, select: match[4] });
    else columns.push(part.replace(/^[a-zA-Z_]+:/, "").split("::")[0]);
  }
  return { columns, embeds };
}

function coerce(raw) {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

function compare(a, b) {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1;
  if (b === null || b === undefined) return 1;
  const na = Number(a);
  const nb = Number(b);
  if (typeof a !== "boolean" && !Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== "" && !/^\d{4}-\d{2}-\d{2}/.test(String(a))) return na - nb;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function likeToRegex(pattern, flags) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/[*%]/g, ".*");
  return new RegExp(`^${escaped}$`, flags);
}

function matchesFilter(row, column, expression) {
  let negate = false;
  let expr = expression;
  if (expr.startsWith("not.")) {
    negate = true;
    expr = expr.slice(4);
  }
  const dot = expr.indexOf(".");
  const op = expr.slice(0, dot);
  const rawValue = expr.slice(dot + 1);
  const value = row[column];
  let result;
  switch (op) {
    case "eq": result = String(value) === String(coerce(rawValue)) || value === coerce(rawValue); break;
    case "neq": result = String(value) !== String(coerce(rawValue)); break;
    case "gt": result = compare(value, rawValue) > 0; break;
    case "gte": result = compare(value, rawValue) >= 0; break;
    case "lt": result = compare(value, rawValue) < 0; break;
    case "lte": result = compare(value, rawValue) <= 0; break;
    case "is": result = rawValue === "null" ? value === null || value === undefined : value === coerce(rawValue); break;
    case "in": {
      const list = rawValue.replace(/^\(|\)$/g, "").split(",").map((item) => item.replace(/^"|"$/g, ""));
      result = list.includes(String(value));
      break;
    }
    case "like": result = likeToRegex(rawValue, "").test(String(value ?? "")); break;
    case "ilike": result = likeToRegex(rawValue, "i").test(String(value ?? "")); break;
    case "cs": {
      const list = rawValue.replace(/^\{|\}$/g, "").split(",").filter(Boolean);
      result = Array.isArray(value) && list.every((item) => value.includes(item));
      break;
    }
    case "ov": {
      const list = rawValue.replace(/^\{|\}$/g, "").split(",").filter(Boolean);
      result = Array.isArray(value) && list.some((item) => value.includes(item));
      break;
    }
    default: result = true;
  }
  return negate ? !result : result;
}

function matchesOr(row, expression) {
  // or=(a.eq.1,b.is.null)
  const inner = expression.replace(/^\(|\)$/g, "");
  return splitTopLevel(inner).some((part) => {
    const dot = part.indexOf(".");
    return matchesFilter(row, part.slice(0, dot), part.slice(dot + 1));
  });
}

function project(row, table, select) {
  const { columns, embeds } = parseSelect(select);
  const out = {};
  if (columns.includes("*") || columns.length === 0) Object.assign(out, row);
  else for (const column of columns) out[column] = row[column] ?? null;
  for (const embed of embeds) {
    const relation = RELATIONS[`${table}>${embed.table}`];
    const target = db[embed.table] ?? [];
    if (!relation) {
      out[embed.alias] = null;
      continue;
    }
    const related = target.filter((candidate) => String(candidate[relation.foreign]) === String(row[relation.local]));
    const projected = related.map((candidate) => project(candidate, embed.table, embed.select));
    out[embed.alias] = relation.one ? projected[0] ?? null : projected;
  }
  return out;
}

function queryTable(table, params) {
  let rows = [...(db[table] ?? [])];
  for (const [key, value] of params) {
    if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(key)) continue;
    if (key === "or") rows = rows.filter((row) => matchesOr(row, value));
    else if (key === "and") continue;
    else rows = rows.filter((row) => matchesFilter(row, key, value));
  }
  const order = params.get("order");
  if (order) {
    const rules = order.split(",").map((rule) => {
      const [column, direction] = rule.split(".");
      return { column, desc: direction === "desc" };
    });
    rows.sort((a, b) => {
      for (const rule of rules) {
        const result = compare(a[rule.column], b[rule.column]);
        if (result !== 0) return rule.desc ? -result : result;
      }
      return 0;
    });
  }
  const total = rows.length;
  const offset = Number(params.get("offset") || 0);
  const limit = params.has("limit") ? Number(params.get("limit")) : undefined;
  rows = rows.slice(offset, limit === undefined ? undefined : offset + limit);
  return { rows, total };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const body = await readBody(req);
  const accept = req.headers.accept || "";
  const prefer = req.headers.prefer || "";
  const log = (note = "") => {
    if (VERBOSE) console.log(`[mock] ${req.method} ${url.pathname}${url.search} ${note}`);
  };

  const rpcMatch = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_0-9]+)$/);
  if (rpcMatch) {
    const fn = RPC[rpcMatch[1]];
    const args = body && typeof body === "object" ? body : Object.fromEntries(url.searchParams);
    log(fn ? "" : "(neznámá RPC → null)");
    const result = fn ? fn(db, args) : null;
    return send(res, 200, result ?? null);
  }

  const tableMatch = url.pathname.match(/^\/rest\/v1\/([a-z_0-9]+)$/);
  if (tableMatch) {
    const table = tableMatch[1];
    const params = url.searchParams;
    if (!db[table]) db[table] = [];
    if (req.method === "GET" || req.method === "HEAD") {
      const { rows, total } = queryTable(table, params);
      const projected = rows.map((row) => project(row, table, params.get("select")));
      log(`→ ${projected.length}/${total}`);
      const headers = { "Content-Range": `0-${Math.max(0, projected.length - 1)}/${prefer.includes("count=") ? total : "*"}` };
      if (req.method === "HEAD") return send(res, 200, undefined, headers);
      if (accept.includes("vnd.pgrst.object")) {
        if (projected.length !== 1) return send(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: null, hint: null });
        return send(res, 200, projected[0], headers);
      }
      return send(res, 200, projected, headers);
    }
    if (req.method === "POST") {
      const items = Array.isArray(body) ? body : [body];
      const inserted = items.map((item) => ({ id: item?.id ?? `${table}-${db[table].length + 1}`, created_at: new Date().toISOString(), ...item }));
      db[table].push(...inserted);
      log(`insert ${inserted.length}`);
      const out = prefer.includes("return=representation") ? inserted.map((row) => project(row, table, params.get("select"))) : undefined;
      if (out && accept.includes("vnd.pgrst.object")) return send(res, 201, out[0]);
      return send(res, 201, out);
    }
    if (req.method === "PATCH") {
      const { rows } = queryTable(table, params);
      for (const row of rows) Object.assign(row, body);
      log(`update ${rows.length}`);
      const out = prefer.includes("return=representation") ? rows.map((row) => project(row, table, params.get("select"))) : undefined;
      if (out && accept.includes("vnd.pgrst.object")) return send(res, 200, out[0] ?? null);
      return send(res, 200, out);
    }
    if (req.method === "DELETE") {
      const { rows } = queryTable(table, params);
      db[table] = db[table].filter((row) => !rows.includes(row));
      log(`delete ${rows.length}`);
      return send(res, 200, prefer.includes("return=representation") ? rows : undefined);
    }
  }

  log("(nepodporováno → 404)");
  return send(res, 404, { message: "not found in promo mock" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock] Supabase mock běží na http://127.0.0.1:${PORT}`);
});
