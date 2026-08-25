import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

export const runtime = "nodejs";

const root = resolve(process.cwd(), "legacy-public");
const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function withVercelInsights(html: string) {
  const scripts = [
    '<script defer src="/_vercel/insights/script.js"></script>',
    '<script defer src="/_vercel/speed-insights/script.js"></script>'
  ].join("");
  return html.includes("</body>") ? html.replace("</body>", `${scripts}</body>`) : `${html}${scripts}`;
}

function withAbsoluteAssetPaths(html: string, section: string | undefined) {
  if (section === "home") {
    return html
      .replace(/\b(href|src)=(["'])assets\//g, "$1=$2/home/assets/")
      .replace(/\b(href|src)=(["'])images\//g, "$1=$2/home/images/");
  }

  if (section === "account") {
    return html
      .replace(/\b(href|src)=(["'])\.\/assets\//g, "$1=$2/account/assets/")
      .replace(/\b(href|src)=(["'])\.\/images\//g, "$1=$2/account/images/");
  }

  return html;
}

function prepareLegacyHtml(html: string, path: string[]) {
  return withVercelInsights(withAbsoluteAssetPaths(html, path[0]));
}

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const file = resolve(root, ...path);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const body = await readFile(file);
    const extension = extname(file).toLowerCase();
    const content = extension === ".html" ? prepareLegacyHtml(body.toString("utf8"), path) : body;
    return new Response(content, {
      headers: {
        "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-VeVit-Renderer": "nextjs-legacy-bridge"
      }
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }
    console.error("Legacy document read failed", error);
    return new Response("Service temporarily unavailable", { status: 503 });
  }
}
