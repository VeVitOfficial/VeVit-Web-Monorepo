import { clientIp } from "@/lib/account-auth";
import { toolsRateLimit } from "@/lib/tools-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of tools/api/feedback.php — error reports from the "Beta testing" banner.
//
// POST with {"message": "..."} (or form-encoded `message`). The ONLY field is
// the message text — no e-mail or name is collected; delivery goes to
// VEVIT_FEEDBACK_EMAIL (default info@vevit.cz) via Resend (the legacy mail()
// does not exist on Vercel). From address is fixed, never user input.

const FEEDBACK_TO = "info@vevit.cz";
const FEEDBACK_FROM = "no-reply@vevit.cz";
const FEEDBACK_MAX_CHARS = 5000;
const FEEDBACK_RATE_WIN = 600; // 10 minut
const FEEDBACK_RATE_MAX = 5; // max 5 hlášení / IP / okno

function fbFail(code: number, message: string): Response {
  return Response.json({ ok: false, message }, {
    status: code,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function sendFeedbackEmail(text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[tools-feedback] RESEND_API_KEY is not configured — feedback NOT sent");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: `VeVit Tools <${FEEDBACK_FROM}>`,
      to: process.env.VEVIT_FEEDBACK_EMAIL?.trim() || FEEDBACK_TO,
      subject: "VeVit Tools — hlášení chyby (Beta)",
      text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[tools-feedback] Resend delivery failed", res.status, detail.slice(0, 300));
    throw new Error(`resend ${res.status}`);
  }
}

async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return fbFail(405, "Pouze POST.");

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    raw = "";
  }

  let message = "";
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/json") || raw.startsWith("{")) {
    try {
      const body = JSON.parse(raw) as Record<string, unknown>;
      if (body && typeof body === "object" && !Array.isArray(body)) {
        message = typeof body.message === "string" ? body.message : "";
      }
    } catch {
      message = "";
    }
  } else {
    message = new URLSearchParams(raw).get("message") ?? "";
  }
  message = message.trim();

  if (message === "") return fbFail(400, "Zpráva je prázdná. Napište, co se nepovedlo.");
  if ([...message].length > FEEDBACK_MAX_CHARS) {
    return fbFail(413, `Zpráva je příliš dlouhá (max. ${FEEDBACK_MAX_CHARS} znaků).`);
  }

  // Feedback sends mail, therefore loss of limiter storage fails closed.
  const ip = clientIp(request);
  const rate = await toolsRateLimit(ip, "feedback", FEEDBACK_RATE_WIN, FEEDBACK_RATE_MAX);
  if (!rate.available) {
    return fbFail(503, "Odeslání hlášení je dočasně nedostupné. Zkuste to prosím později.");
  }
  if (!rate.allowed) {
    return fbFail(429, "Odeslali jste už příliš mnoho hlášení. Zkuste to za chvíli.");
  }

  const ua = (request.headers.get("user-agent") ?? "").slice(0, 200);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const body =
    "Nové hlášení z Beta testing formuláře VeVit Tools.\n\n" +
    "----------------------------------------\n" +
    message + "\n" +
    "----------------------------------------\n\n" +
    `IP: ${ip}\n` +
    `User-Agent: ${ua}\n` +
    `Čas: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}\n`;

  try {
    await sendFeedbackEmail(body);
    return Response.json({ ok: true, message: "Děkujeme! Hlášení bylo odesláno." }, {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return fbFail(500, "Zprávu se nepodařilo odeslat. Zkuste to prosím později.");
  }
}

export const POST = handler;
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;