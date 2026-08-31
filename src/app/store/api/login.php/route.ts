export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of store/api/login.php — intentionally disabled endpoint. Password
 * login lives exclusively in account.vevit.cz; the store UI redirects there.
 */

function disabledResponse(): Response {
  return new Response(JSON.stringify({
    error: {
      code: "login_disabled",
      message: "Přihlášení přes tento endpoint je zakázáno. Přihlaste se přes VeVit Account.",
    },
  }), {
    status: 410,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(): Promise<Response> {
  return disabledResponse();
}

export async function POST(): Promise<Response> {
  return disabledResponse();
}