import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { handleAccountRequest } from "@/lib/account-route";
import { ACCOUNT_LEGACY_SESSION_COOKIE, ACCOUNT_SESSION_COOKIE } from "@/lib/account-session";
import { accountSupabase } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Port of account/api/sessions-list.php: active sessions with masked IP,
// browser-family device label and is_current detection via the token hash
// (the plaintext token never leaves the server).

const SESSION_TOKEN_RE = /^[0-9a-f]{64}$/i;

function maskIp(ip: string): string {
  if (/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(ip)) {
    const parts = ip.split(".");
    if (parts.every((p) => Number(p) <= 255)) return `${parts[0]}.${parts[1]}.*.*`;
    return "Neuvedeno";
  }
  if (ip.includes(":")) return ip.slice(0, 6) + "…";
  return "Neuvedeno";
}

function deviceLabel(agent: string): string {
  if (agent.includes("Firefox")) return "Firefox";
  if (agent.includes("Edg/")) return "Edge";
  if (agent.includes("Chrome")) return "Chrome";
  if (agent.includes("Safari")) return "Safari";
  return "Webové zařízení";
}

export async function GET() {
  return handleAccountRequest(async (session) => {
    const store = await cookies();
    const rawToken = store.get(ACCOUNT_SESSION_COOKIE)?.value ?? store.get(ACCOUNT_LEGACY_SESSION_COOKIE)?.value;
    const currentHash = rawToken && SESSION_TOKEN_RE.test(rawToken)
      ? createHash("sha256").update(rawToken).digest("hex")
      : "";

    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const { data, error } = await accountSupabase()
      .from("sessions")
      .select("id,token_hash,created_at,expires_at,ip_address,user_agent,last_seen_at,revoked_at")
      .eq("user_id", session.user.id)
      .limit(200);
    if (error) return Response.json({ error: "Chyba načítání relací." }, { status: 500 });

    const rows = (data as Record<string, string | null>[])
      .filter((s) => String(s.expires_at) > nowIso && s.revoked_at === null)
      .map((s) => ({
        id: s.id,
        created_at: s.created_at,
        expires_at: s.expires_at,
        last_seen_at: s.last_seen_at ?? s.created_at,
        ip_address: maskIp(String(s.ip_address ?? "")),
        device: deviceLabel(String(s.user_agent ?? "")),
        is_current: currentHash !== "" && currentHash === String(s.token_hash ?? ""),
      }));

    return Response.json(
      { sessions: rows, count: rows.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}

export async function POST(): Promise<Response> {
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "GET" } });
}