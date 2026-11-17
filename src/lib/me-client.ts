// Klientská kontrola přihlášení (/account/api/me.php) sdílená hlavičkami webu.
// - jeden request na stránku, i když se ptá víc komponent (dedupe),
// - poslední výsledek v sessionStorage → hlavička se vykreslí hned a ověření běží na pozadí.
// Ukládá se jen to, co hlavičky zobrazují (žádné citlivé údaje profilu).

export type MeUser = {
  nickname?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

const STORAGE_KEY = "vv-me";
const SNAPSHOT_TTL_MS = 5 * 60_000;

// Dedupe jen v krátkém okně: komponenty jedné stránky sdílí request, ale po klientské
// navigaci (např. odhlášení v obchodě) se stav ověří znovu.
const DEDUPE_MS = 10_000;
let pending: Promise<MeUser | null> | null = null;
let pendingAt = 0;

/** Poslední známý stav: uživatel, null = nepřihlášen, undefined = nevíme. */
export function peekMe(): MeUser | null | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const snap = JSON.parse(raw) as { at: number; user: MeUser | null };
    if (typeof snap.at !== "number" || Date.now() - snap.at > SNAPSHOT_TTL_MS) return undefined;
    return snap.user;
  } catch {
    return undefined;
  }
}

function remember(user: MeUser | null) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), user }));
  } catch {
    /* privátní okno / zablokované úložiště — jen bez okamžitého vykreslení */
  }
}

export function forgetMe() {
  pending = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Aktuální uživatel ze serveru (jednou na stránku). Při výpadku vrátí poslední známý stav. */
export function fetchMe(): Promise<MeUser | null> {
  if (pending && Date.now() - pendingAt < DEDUPE_MS) return pending;
  pendingAt = Date.now();
  pending = fetch("/account/api/me.php", { credentials: "same-origin" })
    .then(async (r) => {
      if (r.status === 401) {
        remember(null);
        return null;
      }
      if (!r.ok) return peekMe() ?? null;
      const data = (await r.json()) as { user?: MeUser };
      const u = data.user;
      const user = u
        ? { nickname: u.nickname, email: u.email, full_name: u.full_name, avatar_url: u.avatar_url }
        : null;
      remember(user);
      return user;
    })
    .catch(() => peekMe() ?? null);
  return pending;
}
