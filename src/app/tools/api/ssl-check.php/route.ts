import { clientIp } from "@/lib/account-auth";
import { toolsRateLimit } from "@/lib/tools-rate-limit";
import { sslCheckHost, type SslCertificateInfo } from "@/lib/tools-ssl-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of tools/api/ssl-check.php — TLS certificate inspection with
// DNS-rebinding-safe direct-IP transport (see src/lib/tools-ssl-check.ts).

function sslReply(code: number, payload: Record<string, unknown>): Response {
  return Response.json(payload, {
    status: code,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const FAILURE_MESSAGES: Record<string, string> = {
  invalid_hostname: "Zadejte platný název veřejné domény bez protokolu a portu.",
  dns_rejected: "Doména nevede výhradně na veřejně dostupný cíl.",
  hostname_mismatch: "Certifikát neodpovídá zadanému názvu domény.",
  untrusted_chain: "Certifikační řetězec se nepodařilo ověřit.",
  expired: "Certifikát již není platný.",
  unreachable: "K veřejnému TLS serveru se nyní nelze připojit.",
  verification_unavailable: "Ověření TLS není na tomto serveru dostupné.",
};

async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return sslReply(405, { status: "invalid_request", message: "Pouze GET." });
  }

  const rate = await toolsRateLimit(clientIp(request), "ssl-check", 60, 10);
  if (!rate.available) {
    return sslReply(503, { status: "verification_unavailable", message: "Kontrolu certifikátu se nyní nepodařilo bezpečně spustit." });
  }
  if (!rate.allowed) {
    return sslReply(429, { status: "rate_limited", message: "Příliš mnoho kontrol. Zkuste to prosím za chvíli." });
  }

  const domain = new URL(request.url).searchParams.get("domain") ?? "";
  const check = await sslCheckHost(domain);
  const status = check.status;
  if (status !== "verified" && status !== "expires_soon") {
    const code = status === "invalid_hostname" || status === "dns_rejected" ? 400
      : status === "verification_unavailable" ? 503 : 502;
    return sslReply(code, { status, message: FAILURE_MESSAGES[status] ?? "Kontrola certifikátu selhala." });
  }

  if (!("certificate" in check)) {
    return sslReply(502, { status: "unreachable", message: "Certifikát nebylo možné přečíst." });
  }
  const parsed: SslCertificateInfo = check.certificate;
  const daysLeft = Math.floor((parsed.validToTime * 1000 - Date.now()) / 86_400_000);
  return sslReply(200, {
    status,
    subject: parsed.subject,
    issuer: parsed.issuer,
    validFrom: parsed.validFrom,
    validTo: parsed.validTo,
    daysLeft,
    serialNumber: parsed.serialNumber,
    version: parsed.version ?? "—",
    signatureType: parsed.signatureType,
    san: parsed.san,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;