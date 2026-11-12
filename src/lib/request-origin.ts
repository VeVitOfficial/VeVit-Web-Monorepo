/**
 * CSRF defence for cookie-authenticated JSON writes: a browser always sends
 * Sec-Fetch-Site / Origin on cross-site requests, so anything that says it
 * came from another site is rejected. Requests without either header
 * (server-to-server, curl) carry no ambient browser cookies and pass.
 */
export function isCrossSiteRequest(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
