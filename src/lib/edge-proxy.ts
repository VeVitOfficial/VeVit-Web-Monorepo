import "server-only";

type ProxyKind = "auth" | "api" | "stripe";

const targetVariables: Record<ProxyKind, string> = {
  auth: "SUPABASE_AUTH_FUNCTION_URL",
  api: "SUPABASE_API_FUNCTION_URL",
  stripe: "SUPABASE_STRIPE_WEBHOOK_URL"
};

const forwardedRequestHeaders = new Set([
  "accept", "accept-language", "authorization", "content-type", "cookie",
  "idempotency-key", "stripe-signature", "user-agent", "x-csrf-token",
  "x-requested-with"
]);
const removedResponseHeaders = new Set(["connection", "content-encoding", "content-length", "transfer-encoding"]);

export async function proxyEdgeFunction(request: Request, path: string[], kind: ProxyKind) {
  const base = process.env[targetVariables[kind]]?.replace(/\/+$/, "");
  if (!base) {
    return Response.json(
      { error: "Server integration is not configured", code: "EDGE_FUNCTION_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(`${base}/${path.map(encodeURIComponent).join("/")}`);
  target.search = incoming.search;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (forwardedRequestHeaders.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("x-vevit-original-path", incoming.pathname);
  headers.set("x-forwarded-host", incoming.host);
  if (process.env.VEVIT_EDGE_PROXY_SECRET) {
    headers.set("x-vevit-proxy-secret", process.env.VEVIT_EDGE_PROXY_SECRET);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual"
    });
  } catch (error) {
    console.error("Edge Function request failed", { kind, path, error });
    return Response.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const header of removedResponseHeaders) responseHeaders.delete(header);
  responseHeaders.set("Cache-Control", request.method === "GET" && kind === "api" ? "private, no-cache" : "no-store");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
