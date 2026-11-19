import "server-only";

import { accountSupabase } from "@/lib/account-auth";
import type { AccountSession } from "@/lib/account-session";
import { csrfValid } from "@/lib/billing";
import { getUserAccess, hasPermission, type UserAccess } from "@/lib/permissions";

/**
 * Owner console guard + audit log. The console opens for `admin.console`
 * (moderator) or `*` (admin, owner). Destructive or privilege-changing
 * actions need `*`; owner and admin ranks can only be granted by an owner.
 */

export type ConsoleActor = {
  id: string;
  access: UserAccess;
  isOwner: boolean;
  isAdmin: boolean; // holds `*`
};

export async function consoleActor(session: AccountSession): Promise<ConsoleActor | null> {
  const access = await getUserAccess(session.user.id);
  if (!hasPermission(access, "admin.console")) return null;
  return {
    id: session.user.id,
    access,
    isOwner: access.ranks.includes("owner"),
    isAdmin: access.permissions.includes("*"),
  };
}

/** Unknown to non-staff: answer as if the route did not exist. */
export function consoleNotFound(): Response {
  return Response.json({ error: "Not found" }, { status: 404 });
}

export function consoleForbidden(message = "Na tuto akci nemáte oprávnění."): Response {
  return Response.json({ error: message }, { status: 403 });
}

/** Resolves the actor for a write: CSRF first, then console access. */
export async function consoleWriteActor(
  request: Request,
  session: AccountSession,
): Promise<ConsoleActor | Response> {
  if (!csrfValid(request, session)) return Response.json({ error: "Neplatný požadavek." }, { status: 403 });
  const actor = await consoleActor(session);
  return actor ?? consoleNotFound();
}

export async function audit(
  actorId: string,
  action: string,
  targetUserId: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await accountSupabase()
    .from("admin_audit_log")
    .insert({ actor_id: actorId, action, target_user_id: targetUserId, detail });
  if (error) console.error("[admin] audit insert failed", { action });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;
    return body !== null && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function int(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  return Number.isInteger(n) ? n : null;
}
