import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

/**
 * Port of edu/ai-gramotnost/api/config.php — shared API config.
 *
 * No-auth mode (api config has no auth/sessions), CORS wildcard `*` and
 * plain (non-envelope) JSON responses — intentionally different from the
 * legacy MariaDB API under edu/legacy/api/.
 *
 * Credentials live in env vars: EDU_GRAMOTNOST_DB_HOST / _PORT / _NAME /
 * _USER / _PASSWORD. Unconfigured DB name keeps the PHP placeholder value
 * `YOUR_DB_NAME`, in which case dbOrNull() returns null and every endpoint
 * falls back to the bundled static content (educational mode).
 */

export const GRAM_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GRAM_DB_HOST = process.env.EDU_GRAMOTNOST_DB_HOST ?? "localhost";
const GRAM_DB_PORT = process.env.EDU_GRAMOTNOST_DB_PORT ?? "3306";
const GRAM_DB_NAME = process.env.EDU_GRAMOTNOST_DB_NAME ?? "YOUR_DB_NAME";
const GRAM_DB_USER = process.env.EDU_GRAMOTNOST_DB_USER ?? "YOUR_DB_USER";
const GRAM_DB_PASSWORD = process.env.EDU_GRAMOTNOST_DB_PASSWORD ?? "YOUR_DB_PASS";

let gramPool: Pool | null = null;

/**
 * Port of dbOrNull(): null when the DB is unconfigured (placeholder name),
 * otherwise a pooled connection. Connection failures surface later as thrown
 * query errors, which every caller wraps in `try/catch` exactly like PHP's
 * `catch (Throwable $e) {}`.
 */
export function gramotnostDbOrNull(): Pool | null {
  if (GRAM_DB_NAME === "YOUR_DB_NAME") return null;
  if (gramPool === null) {
    gramPool = createPool({
      host: GRAM_DB_HOST,
      port: Number.parseInt(GRAM_DB_PORT, 10) || 3306,
      user: GRAM_DB_USER,
      password: GRAM_DB_PASSWORD,
      database: GRAM_DB_NAME,
      connectionLimit: 5,
      enableKeepAlive: false,
      charset: "utf8mb4",
    });
  }
  return gramPool;
}

export async function gramQuery<T extends RowDataPacket>(db: Pool, sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await db.query<T[]>(sql, params);
  return rows;
}

/**
 * Port of edu/ai-gramotnost/data/content-loader.php locale resolution
 * (ai_gram_lang): VEVIT_LANG env → URI prefix → cookie vevit-lang → cs.
 * The URI prefix never matches on API paths, so env and cookie are the
 * effective channels in the PHP deployment too.
 */
const GRAM_SUPPORTED_LOCALES = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);

export function gramotnostLocale(request: Request): string {
  const env = process.env.VEVIT_LANG ?? "";
  if (GRAM_SUPPORTED_LOCALES.has(env)) return env;
  const cookie = request.headers.get("cookie") ?? "";
  const match = /(?:^|;\s*)vevit-lang=([^;]*)/.exec(cookie);
  const value = match !== null ? decodeURIComponent(match[1]) : "";
  if (GRAM_SUPPORTED_LOCALES.has(value)) return value;
  return "cs";
}

/** Port of jsonResponse(): plain JSON body (no {ok,data} envelope). */
export function gramJsonResponse(data: unknown, code = 200): Response {
  return new Response(JSON.stringify(data), { status: code, headers: GRAM_HEADERS });
}

/** Port of config.php's OPTIONS→204 exit. */
export function gramPreflight(): Response {
  return new Response(null, { status: 204, headers: GRAM_HEADERS });
}

/** Port of input(): JSON body → array/object, anything else (incl. parse failure) → []. */
export function gramInput(bodyText: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (Array.isArray(parsed)) return parsed as unknown as Record<string, unknown>;
    if (parsed !== null && typeof parsed === "object") return parsed as Record<string, unknown>;
    return {};
  } catch {
    return {};
  }
}