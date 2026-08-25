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

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const file = resolve(root, ...path);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const body = await readFile(file);
    const extension = extname(file).toLowerCase();
    const content = extension === ".html" ? withVercelInsights(body.toString("utf8")) : body;
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
