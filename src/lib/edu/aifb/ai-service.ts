import "server-only";

// Serverová část AI cvičení AIFB. Poskytovatel modelu se mění na jediném místě (callProvider)
// a výhradně přes prostředí: AIFB_AI_API_URL / AIFB_AI_API_KEY / AIFB_AI_MODEL, případně stávající
// EDU_AI_* (stejný OpenAI-kompatibilní formát jako vyhledávání ve Wikipedii). Bez klíče se vždy
// vrací uložená odpověď. Nic se neukládá ani nelogují se texty žáků; do odpovědi se nedostane
// označení modelu (pravidlo R8). Osobní údaje se kontrolují i zde (R2), nikdy jen na klientu.

import { toolsRateLimit } from "@/lib/tools-rate-limit";
import { AI_LESSONS, MAX_PROMPT_CHARS, MIN_PROMPT_CHARS, truncateWords, type AiLessonConfig } from "./ai-config";
import { detectPersonalData } from "./pii";

export type AiResult =
  | { status: 200; body: { ok: true; source: "live" | "stored"; text: string; plantedErrors?: string[] } }
  | { status: 400 | 404 | 422 | 429; body: { ok: false; error: string; kind?: string } };

const RATE_NAMESPACE = "aifb-ai";
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX = 20;

function providerSettings() {
  const key = (process.env.AIFB_AI_API_KEY ?? process.env.EDU_AI_API_KEY ?? "").trim();
  if (key === "") return null;
  return {
    key,
    url: (process.env.AIFB_AI_API_URL ?? process.env.EDU_AI_API_URL ?? "https://api.openai.com/v1/chat/completions").trim(),
    model: (process.env.AIFB_AI_MODEL ?? process.env.EDU_AI_MODEL ?? "gpt-4o-mini").trim(),
  };
}

/** Jediné místo, které mluví s poskytovatelem modelu. Vrací null při jakékoli chybě. */
async function callProvider(config: AiLessonConfig, prompt: string): Promise<string | null> {
  const settings = providerSettings();
  if (!settings) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(settings.url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.key}` },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: config.system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const text = data.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() !== "" ? truncateWords(text, config.maxWords) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function completeLesson(input: { lessonId: unknown; prompt: unknown; ip: string }): Promise<AiResult> {
  const lessonId = typeof input.lessonId === "string" ? input.lessonId : "";
  const config = AI_LESSONS[lessonId];
  if (!config) return { status: 404, body: { ok: false, error: "unknown_lesson" } };

  let prompt: string;
  if (config.fixedPrompt) {
    prompt = config.fixedPrompt;
  } else {
    if (typeof input.prompt !== "string") return { status: 400, body: { ok: false, error: "prompt_required" } };
    prompt = input.prompt.trim();
    if (prompt.length < MIN_PROMPT_CHARS || prompt.length > MAX_PROMPT_CHARS) return { status: 400, body: { ok: false, error: "prompt_length" } };
    const kind = detectPersonalData(prompt);
    if (kind) return { status: 422, body: { ok: false, error: "personal_data", kind } };
  }

  const stored = (): AiResult => ({
    status: 200,
    body: { ok: true, source: "stored", text: config.fallback, ...(config.plantedErrors ? { plantedErrors: config.plantedErrors } : {}) },
  });

  // Bez poskytovatele se nic neomezuje (uložená odpověď nic nestojí a nic neodesílá).
  if (!providerSettings()) return stored();

  const limit = await toolsRateLimit(input.ip, RATE_NAMESPACE, RATE_WINDOW_SECONDS, RATE_MAX);
  // Nedostupný limiter = žádný živý dotaz s náklady; žák dostane uloženou odpověď.
  if (!limit.available) return stored();
  if (!limit.allowed) return { status: 429, body: { ok: false, error: "rate_limited" } };

  const text = await callProvider(config, prompt);
  return text ? { status: 200, body: { ok: true, source: "live", text } } : stored();
}
