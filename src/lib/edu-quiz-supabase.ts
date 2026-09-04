import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AccountBackendUnavailableError } from "@/lib/account-session";

/**
 * Port of account/lib/supabase-rest.php (the sb_* helpers) over the shared
 * supabase-js client. Every function keeps the PHP result shape
 * { data, error? } so route code can mirror the isset($result['error']) checks.
 */

export interface SbResult<T> {
  data: T | null;
  error: string | null;
}

export function eduSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) throw new AccountBackendUnavailableError("Supabase server configuration is missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function err(error: { message: string } | null): string | null {
  return error ? error.message : null;
}

/**
 * sb_get(): select with eq filters and optional limit.
 * `select` has no default on purpose — these queries run under the
 * service-role key (RLS bypassed), so an accidental "*" would silently
 * return every column, including ones a caller shouldn't see.
 */
export async function sbGet<T = Record<string, unknown>>(
  table: string,
  eq: Record<string, unknown>,
  select: string,
  limit?: number,
): Promise<SbResult<T[]>> {
  let query = eduSupabase().from(table).select(select);
  for (const [column, value] of Object.entries(eq)) {
    query = query.eq(column, value as string);
  }
  if (limit !== undefined) query = query.limit(limit);
  const { data, error } = await query;
  return { data: (data as T[]) ?? null, error: err(error) };
}

/** sb_insert(): single row insert, returns the inserted row. */
export async function sbInsert<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
): Promise<SbResult<T>> {
  const { data, error } = await eduSupabase().from(table).insert(row).select().single();
  return { data: (data as T) ?? null, error: err(error) };
}

/** sb_update(): patch rows matching eq. */
export async function sbUpdate<T = Record<string, unknown>>(
  table: string,
  eq: Record<string, unknown>,
  patch: Record<string, unknown>,
): Promise<SbResult<T[]>> {
  let query = eduSupabase().from(table).update(patch);
  for (const [column, value] of Object.entries(eq)) {
    query = query.eq(column, value as string);
  }
  const { data, error } = await query.select();
  return { data: (data as T[]) ?? null, error: err(error) };
}

/** sb_rpc(): call a Postgres RPC. */
export async function sbRpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<SbResult<T>> {
  const { data, error } = await eduSupabase().rpc(fn, args);
  return { data: (data as T) ?? null, error: err(error) };
}

/** sb_find_one(): single row or null. `select` has no default — see sbGet(). */
export async function sbFindOne<T = Record<string, unknown>>(
  table: string,
  eq: Record<string, unknown>,
  select: string,
): Promise<SbResult<T | null>> {
  let query = eduSupabase().from(table).select(select);
  for (const [column, value] of Object.entries(eq)) {
    query = query.eq(column, value as string);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  return { data: (data as T) ?? null, error: err(error) };
}