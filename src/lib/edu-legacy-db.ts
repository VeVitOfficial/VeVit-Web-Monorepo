import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

// Port of edu/legacy/api/config.php: MariaDB connection, JSON envelope,
// CORS and legacy vevit_auth cookie session for the old edu API.

export const CERT_SECRET = process.env.EDU_CERT_SECRET?.trim() || "vevit-certs-2025";

const LEGACY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Type": "application/json; charset=utf-8",
};

const ALLOWED_ORIGINS = ["https://vevit.cz", "https://www.vevit.cz", "http://localhost:5500", "http://localhost:8080"];

export class LegacyApiError extends Error {
  readonly response: Response;

  constructor(response: Response) {
    super("legacy-api-error");
    this.response = response;
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  return {};
}

function legacyJson(request: Request, body: unknown, status: number): Response {
  return new Response(JSON.stringify(body, null, 0), {
    status,
    headers: { ...LEGACY_HEADERS, ...corsHeaders(request) },
  });
}

// Port of chyba(): throw and let the shared catch convert it to a Response.
export function legacyChyba(request: Request, zprava: string, status = 400): never {
  throw new LegacyApiError(legacyJson(request, { ok: false, error: zprava }, status));
}

// Port of odpoved().
export function legacyOdpoved(request: Request, data: unknown, status = 200): Response {
  return legacyJson(request, { ok: true, data }, status);
}

// Raw JSON response that bypasses the ok/data envelope but keeps the shared
// headers (used for the rate-limit 429 and premium-required 403 payloads).
export function legacyRawJson(request: Request, body: unknown, status: number): Response {
  return legacyJson(request, body, status);
}

export function legacyPreflight(request: Request): Response {
  return new Response(null, { status: 204, headers: { ...LEGACY_HEADERS, ...corsHeaders(request) } });
}

let eduPool: Pool | null = null;
let accountPool: Pool | null = null;

function makePool(database: string, user: string, password: string): Pool {
  return createPool({
    host: process.env.EDU_LEGACY_DB_HOST?.trim() || "md396.wedos.net",
    port: Number(process.env.EDU_LEGACY_DB_PORT ?? 3306),
    database,
    user,
    password,
    charset: "utf8",
    connectionLimit: 5,
    enableKeepAlive: false,
    dateStrings: false,
  });
}

// Port of db(): edu database (courses, lessons, quizzes, user_progress).
export function legacyEduDb(): Pool {
  if (eduPool === null) {
    eduPool = makePool(
      process.env.EDU_LEGACY_DB_NAME?.trim() || "d390994_edu",
      process.env.EDU_LEGACY_DB_USER?.trim() || "d390994_edu",
      process.env.EDU_LEGACY_DB_PASSWORD?.trim() ?? "",
    );
  }
  return eduPool;
}

// Port of dbAccount(): account database (users table).
export function legacyAccountDb(): Pool {
  if (accountPool === null) {
    accountPool = makePool(
      process.env.EDU_LEGACY_ACCOUNT_DB_NAME?.trim() || "d390994_account",
      process.env.EDU_LEGACY_ACCOUNT_DB_USER?.trim() || "d390994_account",
      process.env.EDU_LEGACY_ACCOUNT_DB_PASSWORD?.trim() ?? "",
    );
  }
  return accountPool;
}

export async function legacyQuery<T extends RowDataPacket = RowDataPacket>(
  db: Pool,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await db.query<T[]>(sql, params);
  return rows;
}

// Port of esc().
export function legacyEsc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Port of getVevitUser(): reads the legacy vevit_auth cookie (URL-encoded
// JSON blob written by the old account system).
export function legacyGetVevitUser(request: Request): Record<string, unknown> | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1 || trimmed.slice(0, separator) !== "vevit_auth") continue;
    try {
      const decoded = decodeURIComponent(trimmed.slice(separator + 1));
      const user = JSON.parse(decoded) as unknown;
      if (user === null || typeof user !== "object" || Array.isArray(user)) return null;
      const record = user as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(record, "id")) return null;
      return record;
    } catch {
      return null;
    }
  }
  return null;
}

// Port of vyzadujPrihlaseni().
export function legacyVyzadujPrihlaseni(request: Request): Record<string, unknown> {
  const user = legacyGetVevitUser(request);
  if (user === null) legacyChyba(request, "Přihlášení vyžadováno", 401);
  return user as Record<string, unknown>;
}

export function legacyStringField(user: Record<string, unknown>, key: string): string {
  return typeof user[key] === "string" ? (user[key] as string) : "";
}

// Wrap handler bodies so thrown LegacyApiError responses pass through and
// PDO-style failures render as the Czech 500 messages.
export async function legacyCatch(request: Request, error: unknown, message: string): Promise<Response> {
  if (error instanceof LegacyApiError) return error.response;
  console.error("legacy edu api error:", error instanceof Error ? error.message : error);
  return legacyJson(request, { ok: false, error: message }, 500);
}