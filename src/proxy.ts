import { NextRequest, NextResponse } from "next/server";

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

const locales = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);
const sections = new Set(["home", "account", "edu", "store", "tools"]);
const publicFile = /\.(?:css|js|mjs|json|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|wasm|pdf|bin|data|mp3|wav|mp4|webm)$/i;

function preferredLocale(request: NextRequest) {
  // Čeština je výchozí jazyk webu bez ohledu na Accept-Language prohlížeče
  // (viz zásada 05 "Čeština od začátku"). Jiný jazyk se nastaví jen explicitní
  // volbou v přepínači CS/EN, která se persistuje do cookie `vevit-lang`.
  const cookie = request.cookies.get("vevit-lang")?.value;
  if (cookie && locales.has(cookie)) return cookie;
  return "cs";
}

function legacyRewrite(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = `/legacy-render/${path}`;
  return NextResponse.rewrite(url);
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

  if (pathname.startsWith("/legacy-render/") || pathname.startsWith("/_next/") || pathname.startsWith("/assets/")) return NextResponse.next();
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml" || publicFile.test(pathname)) return NextResponse.next();

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return redirect(request, `/${preferredLocale(request)}/home`);
  let locale: string | null = null;
  if (locales.has(parts[0])) locale = parts.shift() ?? null;
  const section = parts[0];
  if (!section || !sections.has(section)) return NextResponse.next();

  const sectionParts = parts.slice(1);
  const isApi = sectionParts[0] === "api" || sectionParts[0] === "php" || sectionParts[0] === "public";
  // Legacy edu app (static pages + its ported MariaDB API under edu/legacy/...)
  // is served directly by the app router / public assets — never rewritten.
  if (sectionParts[0] === "legacy") return NextResponse.next();
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
    // Celá tools sekce běží na React routách /tools + /tools/<tool>,
    // locale se předává hlavičkou x-vv-locale (stejný vzor jako account).
    const tool = suffix.replace(/\.php$/, "").replace(/\.html$/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/tools${tool ? `/${tool}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  if (section === "home") {
    const page = suffix === "support" || suffix === "support.html" ? "support" : "";
    const url = request.nextUrl.clone();
    url.pathname = `/home${page ? `/${page}` : ""}`;
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
  if (section === "edu") {
    // Edu React SPA: /edu + podstránky (dashboard, programovani, kurzy, lekce, hledat),
    // locale se předává hlavičkou x-vv-locale. ai-gramotnost zůstává legacy PHP.
    const isAiLiteracy = suffix === "ai-gramotnost" || suffix.startsWith("ai-gramotnost/");
    if (isAiLiteracy) return legacyRewrite(request, "edu/ai-gramotnost/index.html");
    const url = request.nextUrl.clone();
    url.pathname = `/edu${suffix ? `/${suffix}` : ""}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-vv-locale", locale);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
