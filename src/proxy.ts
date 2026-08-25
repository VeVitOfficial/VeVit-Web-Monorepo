import { NextRequest, NextResponse } from "next/server";

const locales = new Set(["cs", "en", "de", "es", "uk", "fr", "sk"]);
const sections = new Set(["home", "account", "edu", "store", "tools"]);
const publicFile = /\.(?:css|js|mjs|json|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|wasm|pdf|bin|data|mp3|wav|mp4|webm)$/i;

function preferredLocale(request: NextRequest) {
  const cookie = request.cookies.get("vevit-lang")?.value;
  if (cookie && locales.has(cookie)) return cookie;
  const accepted = request.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const language of accepted.split(",")) {
    const candidate = language.trim().split(";")[0]?.split("-")[0];
    if (candidate && locales.has(candidate)) return candidate;
  }
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
    const tool = suffix.replace(/\.php$/, "");
    return legacyRewrite(request, `${locale}/tools/${tool ? `${tool}.html` : "index.html"}`);
  }
  if (section === "home") {
    const page = suffix === "support" || suffix === "support.html" ? "support.html" : "index.html";
    return legacyRewrite(request, `home/${page}`);
  }
  if (section === "account") {
    const page = suffix.replace(/\.php$/, "").replace(/\.html$/, "") || "index";
    const allowed = new Set(["index", "login", "register", "forgot-password", "reset-password"]);
    return legacyRewrite(request, `account/${allowed.has(page) ? page : "index"}.html`);
  }
  if (section === "edu") {
    const isAiLiteracy = suffix === "ai-gramotnost" || suffix.startsWith("ai-gramotnost/");
    return legacyRewrite(request, isAiLiteracy ? "edu/ai-gramotnost/index.html" : "edu/index.html");
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
