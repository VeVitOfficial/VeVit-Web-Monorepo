export const runtime = "nodejs";

// Dřív proxovalo cokoliv neznámého na Supabase Edge Function, která na
// neznámou cestu odpovídala 200 "API Edge Function is running" — klient tak
// nikdy nedostal chybu (audit, Fáze 1 bod 3). Všechny reálné cesty appky
// tools (ai/[tool], ssl-check.php, feedback.php) mají vlastní route a na
// tenhle catch-all nespoléhají, takže tady není co legitimně proxovat.
function notFound(): Response {
  return Response.json(
    { error: "not_found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const DELETE = notFound;
export const PATCH = notFound;
export const OPTIONS = notFound;
