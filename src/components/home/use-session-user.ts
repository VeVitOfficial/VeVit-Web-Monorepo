"use client";

// Přihlášený uživatel pro 3D scény (profilovka na Account). Jeden sdílený fetch na stránku.

import { useEffect, useState } from "react";

export interface SessionUser {
  name: string;
  avatar: string;
}

interface MeUser {
  full_name?: string;
  nickname?: string;
  email?: string;
  avatar_url?: string;
}

let pending: Promise<SessionUser | null> | null = null;

function avatarUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  const value = raw.trim();
  if (value.startsWith("storage:")) return `/account/api/avatar.php?v=${encodeURIComponent(value)}`;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "https:" || url.origin === window.location.origin ? url.href : "";
  } catch {
    return "";
  }
}

function load(): Promise<SessionUser | null> {
  pending ??= fetch("/account/api/me.php", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { user?: MeUser } | null) => {
      const u = data?.user;
      if (!u) return null;
      const name = [u.full_name, u.nickname, u.email].find((v) => typeof v === "string" && v.trim() !== "")?.trim() ?? "Account";
      return { name, avatar: avatarUrl(u.avatar_url) };
    })
    .catch(() => null);
  return pending;
}

export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let active = true;
    load().then((u) => { if (active) setUser(u); });
    return () => { active = false; };
  }, []);
  return user;
}

export function initials(name: string): string {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toLocaleUpperCase("cs-CZ")).join("") || "V";
}
