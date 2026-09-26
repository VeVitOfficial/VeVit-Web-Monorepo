import { clientIp } from "@/lib/account-auth";
import { toolsRateLimit } from "@/lib/tools-rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stateless e-mail relay for the "VeVit Edu pro školy" interest form
// (/edu/skoly). Modeled on tools/api/feedback.php's Next.js port
// (src/app/tools/api/feedback.php/route.ts): same JSON shape, same
// fail-closed rate limiting via toolsRateLimit, same Resend delivery.
// Deliberately does NOT persist submissions anywhere (no new Supabase
// table): a school's interest just becomes one notification e-mail to
// VEVIT_FEEDBACK_EMAIL, same as the beta feedback form.

const SKOLY_TO = "info@vevit.cz";
const SKOLY_FROM = "no-reply@vevit.cz";
const NAME_MAX = 200;
const SCHOOL_MAX = 200;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 3000;
const RATE_WIN = 600; // 10 minut
const RATE_MAX = 5; // max 5 registrací zájmu / IP / okno

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(code: number, message: string): Response {
  return Response.json({ ok: false, message }, {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

interface Fields {
  name: string;
  school: string;
  email: string;
  message: string;
  cfTurnstile: string;
}

async function readFields(request: Request): Promise<Fields> {
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    raw = "";
  }

  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  let source: Record<string, unknown> = {};
  if (contentType.includes("application/json") || raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        source = parsed as Record<string, unknown>;
      }
    } catch {
      source = {};
    }
  } else {
    const params = new URLSearchParams(raw);
    source = Object.fromEntries(params.entries());
  }

  const str = (key: string): string => (typeof source[key] === "string" ? (source[key] as string) : "");
  return {
    name: str("name").trim(),
    school: str("school").trim(),
    email: str("email").trim(),
    message: str("message").trim(),
    cfTurnstile: str("cf_turnstile"),
  };
}

async function sendInterestEmail(body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[skoly-interest] RESEND_API_KEY is not configured, interest e-mail NOT sent");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: `VeVit Edu <${SKOLY_FROM}>`,
      to: process.env.VEVIT_FEEDBACK_EMAIL?.trim() || SKOLY_TO,
      subject: "VeVit Edu pro školy - nový zájem",
      text: body,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[skoly-interest] Resend delivery failed", res.status, detail.slice(0, 300));
    throw new Error(`resend ${res.status}`);
  }
}

async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return fail(405, "Pouze POST.");

  const fields = await readFields(request);

  if (fields.name === "" || [...fields.name].length > NAME_MAX) {
    return fail(400, "Vyplňte jméno.");
  }
  if (fields.school === "" || [...fields.school].length > SCHOOL_MAX) {
    return fail(400, "Vyplňte název školy.");
  }
  if (fields.email === "" || fields.email.length > EMAIL_MAX || !EMAIL_RE.test(fields.email)) {
    return fail(400, "Zadejte platný e-mail.");
  }
  if ([...fields.message].length > MESSAGE_MAX) {
    return fail(413, `Zpráva je příliš dlouhá (max. ${MESSAGE_MAX} znaků).`);
  }

  const ip = clientIp(request);

  if (!(await verifyTurnstile(fields.cfTurnstile, ip))) {
    return fail(400, "CAPTCHA ověření selhalo.");
  }

  // Sends mail with direct operating cost, fail closed on limiter storage
  // outage, same reasoning as feedback.php.
  const rate = await toolsRateLimit(ip, "skoly-interest", RATE_WIN, RATE_MAX);
  if (!rate.available) {
    return fail(503, "Odeslání je dočasně nedostupné. Zkuste to prosím později.");
  }
  if (!rate.allowed) {
    return fail(429, "Odeslali jste už příliš mnoho žádostí. Zkuste to za chvíli.");
  }

  const ua = (request.headers.get("user-agent") ?? "").slice(0, 200);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const body =
    "Nový zájem o VeVit Edu pro školy.\n\n" +
    "----------------------------------------\n" +
    `Jméno: ${fields.name}\n` +
    `Škola: ${fields.school}\n` +
    `E-mail: ${fields.email}\n` +
    `Zpráva: ${fields.message || "(nevyplněno)"}\n` +
    "----------------------------------------\n\n" +
    `IP: ${ip}\n` +
    `User-Agent: ${ua}\n` +
    `Čas: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}\n`;

  try {
    await sendInterestEmail(body);
    return Response.json({ ok: true, message: "Děkujeme! Ozveme se vám, jakmile budeme mít další informace." }, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return fail(500, "Zprávu se nepodařilo odeslat. Zkuste to prosím později.");
  }
}

export const POST = handler;
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
