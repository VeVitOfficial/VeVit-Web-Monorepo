import { vevitWikipediaSanitizeHtml, phpHtmlEntityDecode, phpMbSubstr, phpStripTags } from "@/lib/edu-wikipedia-sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/api/wikipedia.php: JSON/HTML proxy over Wikipedia REST + parse
// APIs with a byte-capped fetch and server-side sanitization. GET params
// mirror the PHP $_GET surface: action, lang, q, limit, key, title.

const BASE_HEADERS: Record<string, string> = {
  "Cache-Control": "public, max-age=300",
  "X-Content-Type-Options": "nosniff",
};

const ALLOWED_LANGUAGES = ["cs", "en", "de", "uk", "es"];
const ALLOWED_ACTIONS = ["search", "article", "parse"];

function wikipediaError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { "Content-Type": "application/json; charset=utf-8", ...BASE_HEADERS } },
  );
}

function phpIntCast(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

type FetchOk = { ok: true; body: string; contentType: string };
type FetchErr = { ok: false; status: number; message: string };

// Port of wikipedia_fetch: no redirects (curl FOLLOWLOCATION=false), 6s
// total timeout (curl CONNECTTIMEOUT/TIMEDOUT pair), HTTPS-only URL built
// from validated params, byte hard cap aborting the stream.
async function wikipediaFetch(url: string, maxBytes: number, accept: string): Promise<FetchOk | FetchErr> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      headers: { Accept: accept, "User-Agent": "VeVitEdu/1.0 (+https://vevit.cz/edu)" },
      redirect: "manual",
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (response.status < 200 || response.status >= 300) {
      return { ok: false, status: response.status === 404 ? 404 : 502, message: "Wikipedia vrátila chybu." };
    }
    let total = 0;
    const chunks: Uint8Array[] = [];
    const reader = response.body?.getReader();
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          try { await reader.cancel(); } catch {}
          return { ok: false, status: 502, message: "Odpověď Wikipedie překročila povolenou velikost." };
        }
        chunks.push(value);
      }
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, body: Buffer.from(merged).toString("utf8"), contentType };
  } catch {
    return { ok: false, status: 503, message: "Wikipedia je dočasně nedostupná." };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const action = params.get("action") ?? "";
  if (!ALLOWED_ACTIONS.includes(action)) {
    return wikipediaError("Neplatná akce proxy.", 400);
  }
  const language = (params.get("lang") ?? "cs").trim().toLowerCase();
  if (!ALLOWED_LANGUAGES.includes(language)) {
    return wikipediaError("Nepovolený jazyk Wikipedie.", 400);
  }

  if (action === "search") {
    const query = (params.get("q") ?? "").trim();
    if (query === "" || [...query].length > 200) {
      return wikipediaError("Neplatný vyhledávací dotaz.", 400);
    }
    const limitParam = params.get("limit");
    const limit = Math.max(1, Math.min(5, limitParam === null ? 1 : phpIntCast(limitParam)));
    const result = await wikipediaFetch(
      `https://${language}.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=${limit}`,
      512 * 1024,
      "application/json",
    );
    if (!result.ok) return wikipediaError(result.message, result.status);
    if (!result.contentType.toLowerCase().includes("json")) {
      return wikipediaError("Wikipedia vrátila neplatná data.", 502);
    }
    try {
      if (JSON.parse(result.body) === null) return wikipediaError("Wikipedia vrátila neplatná data.", 502);
    } catch {
      return wikipediaError("Wikipedia vrátila neplatná data.", 502);
    }
    return new Response(result.body, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", ...BASE_HEADERS },
    });
  }

  if (action === "article") {
    const key = (params.get("key") ?? "").trim();
    if (key === "" || [...key].length > 300 || /[\x00-\x1f]/.test(key)) {
      return wikipediaError("Neplatný klíč článku.", 400);
    }
    const result = await wikipediaFetch(
      `https://${language}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(key)}`,
      2 * 1024 * 1024,
      "text/html",
    );
    if (!result.ok) return wikipediaError(result.message, result.status);
    if (!result.contentType.toLowerCase().includes("html")) {
      return wikipediaError("Wikipedia vrátila neočekávaný formát.", 502);
    }
    return new Response(vevitWikipediaSanitizeHtml(result.body), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", ...BASE_HEADERS },
    });
  }

  // action === "parse"
  const title = (params.get("title") ?? "").trim();
  if (title === "" || [...title].length > 300 || /[\x00-\x1f]/.test(title)) {
    return wikipediaError("Neplatný název článku.", 400);
  }
  const result = await wikipediaFetch(
    `https://${language}.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}`
      + "&prop=text%7Csections%7Cdisplaytitle&mobileformat=1&format=json&redirects=1",
    2 * 1024 * 1024,
    "application/json",
  );
  if (!result.ok) return wikipediaError(result.message, result.status);
  let decoded: unknown = null;
  if (!result.contentType.toLowerCase().includes("json")) {
    return wikipediaError("Wikipedia vrátila neplatná data.", 502);
  }
  try {
    decoded = JSON.parse(result.body);
  } catch {
    return wikipediaError("Wikipedia vrátila neplatná data.", 502);
  }
  const parsed = decoded !== null && typeof decoded === "object"
    ? (decoded as Record<string, unknown>)
    : {};
  if (
    Object.prototype.hasOwnProperty.call(parsed, "error")
    || !(parsed.parse instanceof Object)
    || (parsed.parse as Record<string, unknown>).text === null
    || typeof (parsed.parse as Record<string, unknown>).text !== "object"
  ) {
    return wikipediaError("Článek nebyl nalezen.", 404);
  }
  const parseData = parsed.parse as Record<string, unknown>;
  const rawSections = Array.isArray(parseData.sections) ? (parseData.sections as unknown[]) : [];
  const sections = rawSections
    .filter((section): section is Record<string, unknown> => section !== null && typeof section === "object")
    .map((section) => ({
      anchor: phpMbSubstr(phpStripTags(String(section.anchor ?? "")), 0, 300),
      line: phpMbSubstr(phpHtmlEntityDecode(phpStripTags(String(section.line ?? ""))), 0, 500),
      toclevel: Number.isFinite(Number(section.toclevel)) ? Math.trunc(Number(section.toclevel)) : 0,
    }));
  const pageTitle = phpMbSubstr(
    phpHtmlEntityDecode(phpStripTags(String(parseData.displaytitle ?? title))),
    0,
    500,
  );
  const textPayload = (parseData.text as Record<string, unknown>)["*"];
  const content = vevitWikipediaSanitizeHtml(typeof textPayload === "string" ? textPayload : "");
  return new Response(
    JSON.stringify({
      title: pageTitle,
      content,
      sections,
      pageid: Object.prototype.hasOwnProperty.call(parseData, "pageid")
        ? Math.trunc(Number(parseData.pageid))
        : null,
      lang: language,
    }),
    { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", ...BASE_HEADERS } },
  );
}