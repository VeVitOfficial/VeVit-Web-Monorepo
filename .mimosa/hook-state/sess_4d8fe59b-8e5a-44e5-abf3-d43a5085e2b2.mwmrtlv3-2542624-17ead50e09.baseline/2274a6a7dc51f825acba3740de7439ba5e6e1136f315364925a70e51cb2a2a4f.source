"use client";

import { useMemo } from "react";
import { useSession } from "./session";

/**
 * Port of api() from account/assets/app.js — same-origin fetch against the
 * (ported) /account/api/*.php routes: 12 s timeout, CSRF header on writes,
 * 401 → redirect to login. The CSRF token comes from SessionProvider
 * (equivalent of sharedGetCsrfToken in app.js).
 */

export class AccountApiError extends Error {
  field: string;
  status: number;
  constructor(message: string, status: number, field = "") {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export type AccountApiClient = <T = Record<string, unknown>>(
  path: string,
  options?: { method?: string; body?: unknown; signal?: AbortSignal },
) => Promise<T>;

export function useAccountApi(): AccountApiClient {
  const { csrfToken } = useSession();
  // Stable identity while the CSRF token is unchanged — sections put this in
  // effect dependencies, a fresh closure per render would refetch forever.
  return useMemo(
    () => createAccountApiClient(csrfToken),
    [csrfToken],
  );
}

function createAccountApiClient(csrfToken: string): AccountApiClient {
  return async <T,>(
    path: string,
    { method = "GET", body, signal }: { method?: string; body?: unknown; signal?: AbortSignal } = {},
  ): Promise<T> => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const relayAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) controller.abort();
      else signal.addEventListener("abort", relayAbort, { once: true });
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    try {
      const response = await fetch(`/account/api/${path}`, {
        method,
        credentials: "same-origin",
        headers,
        signal: controller.signal,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      if (response.status === 401) {
        location.replace("/account/login");
        throw new AccountApiError("unauthorized", 401);
      }
      const payload: Record<string, unknown> = response.status === 204
        ? {}
        : await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new AccountApiError(
          (payload?.error as string | undefined) || "Požadavek se nepodařilo dokončit.",
          response.status,
          (payload?.field as string | undefined) || "",
        );
      }
      return payload as T;
    } finally {
      window.clearTimeout(timeout);
      if (signal) signal.removeEventListener("abort", relayAbort);
    }
  };
}