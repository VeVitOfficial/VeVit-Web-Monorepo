export const runtime = "nodejs";

// Legacy cesta bez přípony — dřív bez vlastního handleru propadala do
// catch-allu /tools/api/[...path] a dostávala tichou 200 od Supabase Edge
// Function (Fáze 1, bod 3 zadání: audit "dvě cesty ke stejnému API").
// Skutečný handler žije v /tools/api/ai/[tool]/route.ts — sem přesměrováváme
// 308, ať se zachová metoda i tělo požadavku.
async function handler(request: Request): Promise<Response> {
  let tool = "ai-chat";
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    if (typeof body?.tool === "string" && body.tool.trim() !== "") tool = body.tool.trim();
  } catch {
    /* tělo chybí/není JSON — použij výchozí tool */
  }
  const target = new URL(`/tools/api/ai/${encodeURIComponent(tool)}`, request.url);
  return Response.redirect(target, 308);
}

export const POST = handler;
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
