import "server-only";

// Úpravy obsahu AIFB v databázi (tabulka aifb_content_edits, migrace 025). Platné úpravy se drží
// v paměti instance nejvýš TTL_MS; po uložení se obnoví hned. Bez databáze (nebo před migrací)
// platí obsah z repozitáře a stránky fungují dál.

import { accountSupabase } from "@/lib/account-auth";
import { isEditDoc, type EditDoc, type StoredEdit } from "./edits";

const TTL_MS = 10_000;

type Snapshot = { at: number; version: number; key: string; byDoc: Map<EditDoc, StoredEdit[]> };

let snapshot: Snapshot = { at: 0, version: 0, key: "", byDoc: new Map() };
let pending: Promise<void> | null = null;

async function load(): Promise<void> {
  try {
    const { data, error } = await accountSupabase().from("aifb_content_current").select("doc,path,value").order("id");
    if (error) throw error;
    const rows = (data ?? []) as { doc: string; path: string; value: unknown }[];
    const key = JSON.stringify(rows);
    if (key === snapshot.key) {
      snapshot = { ...snapshot, at: Date.now() };
      return;
    }
    const byDoc = new Map<EditDoc, StoredEdit[]>();
    for (const row of rows) {
      if (!isEditDoc(row.doc) || row.value === null) continue;
      byDoc.set(row.doc, [...(byDoc.get(row.doc) ?? []), { path: row.path, value: row.value }]);
    }
    snapshot = { at: Date.now(), version: snapshot.version + 1, key, byDoc };
  } catch {
    // Poslední známé úpravy zůstávají; další pokus po TTL.
    snapshot = { ...snapshot, at: Date.now() };
  }
}

export async function refreshContentEdits(force = false): Promise<void> {
  if (!force && Date.now() - snapshot.at < TTL_MS) return;
  if (!pending) pending = load().finally(() => (pending = null));
  return pending;
}

export function editsFor(doc: EditDoc): StoredEdit[] {
  return snapshot.byDoc.get(doc) ?? [];
}

/** Mění se jen při změně úprav (pro mezipaměť upraveného obsahu). */
export function editsVersion(): number {
  return snapshot.version;
}

export type EditHistoryEntry = { id: number; value: unknown; note: string | null; author: string | null; createdAt: string };

export async function editHistory(doc: EditDoc, path: string, limit = 20): Promise<EditHistoryEntry[]> {
  const { data, error } = await accountSupabase()
    .from("aifb_content_edits")
    .select("id,value,note,created_at,users(nickname)")
    .eq("doc", doc)
    .eq("path", path)
    .order("id", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((row) => {
    const user = row.users as { nickname?: string | null } | { nickname?: string | null }[] | null;
    const nickname = Array.isArray(user) ? user[0]?.nickname : user?.nickname;
    return { id: row.id as number, value: row.value, note: (row.note as string | null) ?? null, author: nickname ?? null, createdAt: row.created_at as string };
  });
}

/** Naposledy upravené jednotky (přehled úprav). */
export async function recentEdits(limit = 15): Promise<{ doc: EditDoc; path: string; reverted: boolean; createdAt: string }[]> {
  const { data, error } = await accountSupabase()
    .from("aifb_content_edits")
    .select("doc,path,value,created_at")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? [])
    .filter((row) => isEditDoc(row.doc))
    .map((row) => ({ doc: row.doc as EditDoc, path: row.path as string, reverted: row.value === null, createdAt: row.created_at as string }));
}

export async function saveEdit(input: { doc: EditDoc; path: string; value: unknown; note: string | null; authorId: string }): Promise<boolean> {
  const { error } = await accountSupabase().from("aifb_content_edits").insert({
    doc: input.doc,
    path: input.path,
    value: input.value,
    note: input.note,
    author_id: input.authorId,
  });
  if (error) return false;
  await refreshContentEdits(true);
  return true;
}
