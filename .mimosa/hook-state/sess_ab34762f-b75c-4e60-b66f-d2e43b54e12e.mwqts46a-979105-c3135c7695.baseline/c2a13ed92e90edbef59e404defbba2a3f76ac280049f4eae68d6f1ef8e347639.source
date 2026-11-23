"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * React port of the account shell session plumbing: in app.js the bootstrap
 * `<div id="vv-bootstrap">` + /assets/shared/session.js provided the current
 * user and CSRF token. Here the server layout loads both (loadSessionFromCookies
 * + HMAC CSRF) and passes them through this provider.
 */

export type AccountUser = {
  id: string;
  email: string;
  nickname: string;
  full_name: string;
  tier: string;
  tier_expires: string | null;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  birth_date: string | null;
  bio: string | null;
  language: string;
  [key: string]: unknown;
};

type SessionValue = {
  user: AccountUser;
  csrfToken: string;
  setUser: (user: AccountUser) => void;
  showToast: (message: string, kind?: "success" | "error") => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({
  user,
  csrfToken,
  children,
}: {
  user: AccountUser;
  csrfToken: string;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState(user);
  const [toast, setToast] = useState<{ message: string; kind: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const setUser = useCallback((next: AccountUser) => setCurrentUser(next), []);
  const showToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ message, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);
  // Mirrors the legacy `vevit:locale-basechange` contract: base language is
  // stored in DB by the preferences save; consumers read it from session.user.
  const value = useMemo<SessionValue>(
    () => ({ user: currentUser, csrfToken, setUser, showToast }),
    [currentUser, csrfToken, setUser, showToast],
  );
  return (
    <SessionContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="toast"
        data-kind={toast?.kind ?? ""}
        hidden={!toast}
      >
        {toast?.message ?? ""}
      </div>
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}