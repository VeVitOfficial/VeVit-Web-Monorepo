import { handleQuizRequest } from "@/lib/edu-quiz-lib";
import { sbFindOne } from "@/lib/edu-quiz-supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Port of edu/ai-gramotnost/certificate.php — HTML certificate page for the
 * "Skeptik s certifikátem" badge (granted only by the server-verified
 * final-6 milestone). Error replies are text/plain like the PHP original.
 */

/** PHP htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'). */
// Styl certifikátu (dříve sdílený styles.css vanilla aplikace).
const CERTIFICATE_CSS = "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0f;color:#f9fafb;font-family:system-ui,-apple-system,sans-serif;line-height:1.6}"
  + ".card{max-width:900px;margin:3rem auto;padding:2.5rem;text-align:center;background:#101014;border:1px solid rgba(255,255,255,.08);border-radius:16px}"
  + "h1{font-size:clamp(1.8rem,4vw,2.6rem);margin:.5rem 0}h2{color:#10b981;margin:.75rem 0}p{color:rgba(255,255,255,.7)}"
  + ".btn{display:inline-block;margin-top:1rem;padding:.6rem 1.1rem;border-radius:12px;background:#10b981;color:#04130d;font-weight:600;text-decoration:none}";

function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** PHP (string) cast over a Supabase cell. */
function strval(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "";
  return "";
}

/** PHP null coalescing across the two profile columns with (string) cast. */
function displayName(user: Record<string, unknown>): string {
  for (const key of ["nickname", "name"]) {
    const value = user[key];
    if (value !== null && value !== undefined) return strval(value);
  }
  return "Uživatel VeVit";
}

async function handler(session: { user: Record<string, unknown> }): Promise<Response> {
  const userId = session.user.id;
  const badge =
    typeof userId === "string" && userId !== ""
      ? await sbFindOne<{ awarded_at?: unknown }>(
          "edu_quiz_badge",
          { user_id: userId, badge_key: "skeptik-s-certifikatem" },
          "awarded_at,meta",
        )
      : { data: null, error: "identity" };

  if (badge.error !== null) {
    return new Response("Certifikát je dočasně nedostupný.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (badge.data === null || typeof badge.data !== "object") {
    return new Response("Certifikát bude dostupný po úspěšném závěrečném testu.", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const awardedAt = badge.data.awarded_at;
  const awarded = awardedAt !== null && awardedAt !== undefined
    ? strval(awardedAt)
    : new Date().toISOString().replace("Z", "+00:00");

  const name = displayName(session.user);
  const html = `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certifikát AI gramotnosti</title><style>${CERTIFICATE_CSS}</style></head><body><main class="container"><article class="card quiz-certificate"><p>VeVit Edu</p><h1>Certifikát AI gramotnosti</h1><p>Potvrzujeme, že</p><h2>${htmlEscape(name)}</h2><p>úspěšně dokončil(a) závěrečný test kurzu AI gramotnost a získal(a) odznak Skeptik s certifikátem.</p><p>Vydáno ${htmlEscape(awarded.slice(0, 10))}</p><p><a class="btn btn-primary" href="/edu/ai-gramotnost/kurz">Zpět do kurzu</a></p></article></main></body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  return handleQuizRequest(request, handler);
}