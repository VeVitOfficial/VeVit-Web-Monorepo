export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/csp-report.php. The legacy endpoint stored normalized
// violation reports into a filesystem directory; Vercel's filesystem is
// ephemeral, so this port validates and acks the reports (204) without
// persisting them — the browser only needs a fast 2xx to stop retrying.

export async function POST(request: Request) {
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 65536) return new Response(null, { status: 413, headers });

  const contentType = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!["application/csp-report", "application/reports+json", "application/json"].includes(contentType)) {
    return new Response(null, { status: 415, headers });
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return new Response(null, { status: 400, headers });
  }
  if (raw.length > 65536) return new Response(null, { status: 413, headers });

  try {
    JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400, headers });
  }
  return new Response(null, { status: 204, headers });
}

export async function GET(): Promise<Response> {
  return new Response(null, { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
}