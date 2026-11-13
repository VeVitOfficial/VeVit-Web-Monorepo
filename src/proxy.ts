import { NextRequest, NextResponse } from "next/server";
import { isOidcProtocolPath } from "@/lib/office/paths";

/**
 * Host-based redirects for marketing subdomains.
 *
 * Subdomains that don't have their own app are 301-redirected to the
 * relevant section on the canonical main site (www.vevit.cz).
 *
 * studios.vevit.cz → the "explore" section on the home page, where the
 * VeVit Software Studios card lives. services.vevit.cz → VeVit Services,
 * which runs as a section of this app (/<locale>/services).
 */
const HOST_REDIRECTS: Record<string, string> = {
  "studios.vevit.cz": "https://www.vevit.cz/home#explore",
  "www.studios.vevit.cz": "https://www.vevit.cz/home#explore",
  "services.vevit.cz": "https://www.vevit.cz/cs/services",
  "www.services.vevit.cz": "https://www.vevit.cz/cs/services",
};

const locales = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);
const sections = new Set(["home", "account", "edu", "store", "tools", "services"]);
const publicFile = /\.(?:css|js|mjs|json|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|wasm|onnx|pdf|bin|data|traineddata|gz|bcmap|pfb|txt|mp3|wav|mp4|webm)$/i;
// Statické HTML v public/, které se servíruje přímo (bez locale prefixu).
const publicHtml = new Set(["/edu/sandbox-frame.html"]);

function preferredLocale(request: NextRequest) {
  // Čeština je výchozí jazyk webu bez ohledu na Accept-Language prohlížeče
  // (viz zásada 05 "Čeština od začátku"). Jiný jazyk se nastaví jen explicitní
  // volbou v přepínači CS/EN, která se persistuje do cookie `vevit-lang`.
  const cookie = request.cookies.get("vevit-lang")?.value;
  if (cookie && locales.has(cookie)) return cookie;
  return "cs";
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Host-based subdomain redirects (marketing subdomains → main site).
  const host = request.headers.get("host") ?? "";
  const target = HOST_REDIRECTS[host];
  if (target) {
    return NextResponse.redirect(new URL(target), { status: 301 });
  }

  // OIDC provider for VeVit Office: protocol endpoints live at fixed, locale-less URLs under the issuer
  // (https://vevit.cz/account). A locale redirect here would break discovery and token requests.
  if (isOidcProtocolPath(pathname)) return NextResponse.next();
  if (pathname.startsWith("/_next/") || pathname.startsWith("/assets/")) return NextResponse.next();
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml" || publicFile.test(pathname) || publicHtml.has(pathname)) return NextResponse.next();

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return redirect(request, `/${preferredLocale(request)}/home`);
  let locale: string | null = null;
  if (locales.has(parts[0])) locale = parts.shift() ?? null;
  const section = parts[0];
  if (!section || !sections.has(section)) return NextResponse.next();

  const sectionParts = parts.slice(1);
  const isApi = sectionParts[0] === "api" || sectionParts[0] === "php" || sectionParts[0] === "public";
  if (isApi) {
    if (!locale) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${section}/${sectionParts.join("/")}`;
    return NextResponse.rewrite(url);
  }
  if (!locale) return redirect(request, `/${preferredLocale(request)}${pathname}`);

  const suffix = sectionParts.join("/").replace(/\/+$/, "");
  if (section === "store") {
    if (suffix === "product.php") {
      const slug = searchParams.get("slug");
      if (slug) return redirect(request, `/${locale}/store/product/${encodeURIComponent(slug)}`);
    }
    const storePath = suffix.replace(/\.php$/, "").replace(/^index$/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/store${storePath ? `/${storePath}` : ""}`;
    return NextResponse.rewrite(url);
  }
  if (section === "tools") {
    // Celá tools sekce běží na React routách /tools/<locale> + /tools/<locale>/<tool>.
    // Locale je segment cesty (statické generování per jazyk), hlavička zůstává pro zpětnou kompatibilitu.
    const tool = suffix.replace(/\.php$/, "").replace(/\.html$/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/tools/${locale}${tool ? `/${tool}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (section === "home") {
    const soon = /^soon\/(mail|office|services|search|store)$/.exec(suffix);
    const page = soon ? soon[0] : suffix === "support" || suffix === "support.html" ? "support" : "";
    const url = request.nextUrl.clone();
    url.pathname = `/home/${locale}${page ? `/${page}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (section === "account") {
    const page = suffix.replace(/\.php$/, "").replace(/\.html$/, "");
    // Celá account sekce (auth obrazovky i dashboard) běží na React routách /account/*,
    // locale se předává hlavičkou x-vv-locale.
    const url = request.nextUrl.clone();
    url.pathname = `/account${page && page !== "index" ? `/${page}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (section === "services") {
    // VeVit Services (React routy /services/*), locale v hlavičce x-vv-locale.
    const url = request.nextUrl.clone();
    url.pathname = `/services${suffix ? `/${suffix}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (section === "edu") {
    // Edu React: /edu/<locale> + podstránky (dashboard, programovani, kurzy, lekce, hledat,
    // ai-gramotnost). Locale je segment cesty, hlavička zůstává pro zpětnou kompatibilitu.
    const url = request.nextUrl.clone();
    url.pathname = `/edu/${locale}${suffix ? `/${suffix}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
