import { phpMbSubstr } from "@/lib/edu-wikipedia-sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of edu/php/ai-proxy.php: server-side LLM call for the smart
// Wikipedia search, so the API key never reaches the client.
// OpenAI-compatible endpoint configured via env:
//   EDU_AI_API_KEY (required), EDU_AI_API_URL, EDU_AI_MODEL.

const API_URL = process.env.EDU_AI_API_URL?.trim() || "https://api.openai.com/v1/chat/completions";
const API_KEY = process.env.EDU_AI_API_KEY?.trim() ?? "";
const MODEL = process.env.EDU_AI_MODEL?.trim() || "gpt-4o-mini";
const MAX_CTX = 12000;

const RESPONSE_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonOut(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: RESPONSE_HEADERS });
}

const SYSTEM_PROMPT = "Jsi asistent, který odpovídá na otázky výhradně na základě dodaného textu z Wikipedie. "
  + "Najdi v textu co nejpřesnější odpověď. "
  + "Odpověz POUZE platným JSON objektem (bez markdownu, bez prose kolem) se dvěma klíči:\n"
  + "- answer_text: stručná odpověď na otázku (1–2 věty, ve stejném jazyce jako otázka).\n"
  + "- exact_quote: přesná věta nebo souvislá pasáž VERBATIM (opřená doslovně z dodaného textu), "
  + "ve které se odpověď nachází (max ~300 znaků).\n"
  + "Pokud v textu odpověď jednoznačně nenajdeš, vrať {\"answer_text\":\"\",\"exact_quote\":\"\"}.";

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(await request.text());
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch {
    body = {};
  }
  const question = String(body.question ?? "").trim();
  let context = String(body.context ?? "").trim();
  if (question === "" || context === "") {
    return jsonOut({ error: "missing question/context" }, 400);
  }
  if (API_KEY === "") {
    return jsonOut({ error: "API_KEY není nastaven v php/ai-proxy.php" }, 500);
  }
  context = phpMbSubstr(context, 0, MAX_CTX);

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `OTÁZKA:\n${question}\n\nTEXT Z WIKIPEDIE:\n${context}` },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "User-Agent": "VeVit-Edu-AI-Search/1.0 (contact: admin@vevit.cz)",
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "connection failed";
    return jsonOut({ error: `upstream error: ${message}` }, 502);
  }

  let raw = "";
  try {
    raw = await response.text();
  } catch {
    return jsonOut({ error: "upstream error: read failed" }, 502);
  }
  const code = response.status;
  if (code >= 400) {
    return jsonOut({ error: `upstream HTTP ${code}`, upstream: phpMbSubstr(raw, 0, 500) }, 502);
  }

  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }
  let content = "";
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const choices = (data as Record<string, unknown>).choices;
    if (Array.isArray(choices)) {
      const first = choices[0];
      if (first !== null && typeof first === "object" && !Array.isArray(first)) {
        const message = (first as Record<string, unknown>).message;
        if (message !== null && typeof message === "object" && !Array.isArray(message)) {
          content = String((message as Record<string, unknown>).content ?? "");
        }
      }
    }
  }

  let parsed: Record<string, unknown> | null = null;
  try {
    const candidate = JSON.parse(content);
    if (candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)) parsed = candidate;
  } catch {
    const match = /\{[\s\S]*\}/.exec(content);
    if (match) {
      try {
        const candidate = JSON.parse(match[0]);
        if (candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)) parsed = candidate;
      } catch {
        parsed = null;
      }
    }
  }

  return jsonOut({
    answer_text: parsed ? String(parsed.answer_text ?? "") : "",
    exact_quote: parsed ? String(parsed.exact_quote ?? "") : "",
  });
}