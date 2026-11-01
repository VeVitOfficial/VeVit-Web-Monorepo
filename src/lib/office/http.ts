export function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", pragma: "no-cache", ...extra },
  });
}

export function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store" } });
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(h);
  return m ? m[1]! : null;
}

export async function readJson(req: Request, maxBytes = 8192): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function readForm(req: Request, maxBytes = 8192): Promise<URLSearchParams | null> {
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/x-www-form-urlencoded")) return null;
  const text = await req.text();
  return text.length > maxBytes ? null : new URLSearchParams(text);
}
