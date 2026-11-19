import "server-only";

// Společné části zápisových endpointů AIFB (třídy, připojení, úpravy obsahu): jen ze stejného webu,
// jen přihlášený účet, CSRF token ze stránky, role vždy znovu z databáze (testovací role se zde
// nikdy nepoužije).

import { AccountBackendUnavailableError, loadSessionFromCookies } from "@/lib/account-session";
import { csrfValid } from "@/lib/billing";
import { getUserAccess } from "@/lib/permissions";
import { roleFromPermissions, type AifbRole } from "./access";

const HEADERS = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" } as const;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export type ApiActor = { userId: string; role: AifbRole };

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = new URL(origin).host;
    return host === new URL(request.url).host || host === request.headers.get("host");
  } catch {
    return false;
  }
}

/** Přihlášený autor požadavku, nebo hotová chybová odpověď (403 / 401 / 503). */
export async function apiActor(request: Request): Promise<ApiActor | Response> {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);
  try {
    const session = await loadSessionFromCookies();
    if (!session) return json({ ok: false, error: "login_required" }, 401);
    if (!csrfValid(request, session)) return json({ ok: false, error: "forbidden" }, 403);
    const access = await getUserAccess(session.user.id);
    return { userId: session.user.id, role: roleFromPermissions(access.permissions) };
  } catch (error) {
    if (error instanceof AccountBackendUnavailableError) return json({ ok: false, error: "unavailable" }, 503);
    throw error;
  }
}

export async function readBody(request: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    return data !== null && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
