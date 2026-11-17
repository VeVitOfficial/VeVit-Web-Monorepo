"use client";

// Přihlášený uživatel pro 3D scény (profilovka na Account). Jeden sdílený fetch na stránku.

import { useEffect, useState } from "react";
import { fetchMe, peekMe, type MeUser } from "@/lib/me-client";

export interface SessionUser {
  name: string;
  avatar: string;
}


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

function toSessionUser(u: MeUser | null | undefined): SessionUser | null {
  if (!u) return null;
  const name = [u.full_name, u.nickname, u.email].find((v) => typeof v === "string" && v.trim() !== "")?.trim() ?? "Account";
  return { name, avatar: avatarUrl(u.avatar_url) };
}

export function useSessionUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let active = true;
    // Okamžitě poslední známý stav ze sessionStorage, pak ověření na serveru.
    queueMicrotask(() => {
      const cached = peekMe();
      if (active && cached) setUser(toSessionUser(cached));
    });
    fetchMe().then((u) => { if (active) setUser(toSessionUser(u)); });
    return () => { active = false; };
  }, []);
  return user;
}

export function initials(name: string): string {
  return name.split(/\s+/u).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toLocaleUpperCase("cs-CZ")).join("") || "V";
}
