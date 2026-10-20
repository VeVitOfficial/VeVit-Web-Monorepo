"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { DRAFT_KEY, parseDraft, type CheckoutDraft } from "@/lib/checkout/checkout-draft";

export type { CheckoutDraft };

const EVENT = "checkoutdraftchange";

function read(): string {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

// sessionStorage can be unavailable (private mode, blocked storage): keep the draft in memory then.
let memory = "";
let storageWorks = true;

function write(value: string | null) {
  memory = value ?? "";
  try {
    if (value === null) sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, value);
  } catch {
    storageWorks = false;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot(): string {
  return storageWorks ? read() : memory;
}

/** Draft of steps 2-3. Returns [draft, patch, clear]; the last one deletes the draft after payment. */
export function useCheckoutDraft(): [CheckoutDraft, (patch: Partial<CheckoutDraft>) => void, () => void] {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const draft = useMemo(() => parseDraft(raw === "" ? null : raw), [raw]);
  const patch = useCallback((change: Partial<CheckoutDraft>) => {
    const current = parseDraft(snapshot() === "" ? null : snapshot());
    write(JSON.stringify({ ...current, ...change }));
  }, []);
  const clear = useCallback(() => write(null), []);
  return [draft, patch, clear];
}
