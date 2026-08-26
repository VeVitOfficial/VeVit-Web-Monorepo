import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based redirects for marketing subdomains.
 *
 * Subdomains that don't have their own app are 301-redirected to the
 * relevant section on the canonical main site (www.vevit.cz).
 *
 * studios.vevit.cz → the "explore" section on the home page, where the
 * VeVit Software Studios card lives.
 */
const HOST_REDIRECTS: Record<string, string> = {
  "studios.vevit.cz": "https://www.vevit.cz/home#explore",
  "www.studios.vevit.cz": "https://www.vevit.cz/home#explore",
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const target = HOST_REDIRECTS[host];
  if (target) {
    return NextResponse.redirect(new URL(target), { status: 301 });
  }
  return NextResponse.next();
}

// Run on everything except Next.js internal asset paths. The host check
// inside the middleware is cheap, and we want every path on a redirected
// subdomain (including /assets/*) to be caught.
export const matcher = ["/((?!_next/static|_next/image|favicon.ico).*)"];