import "server-only";

/**
 * fetch pro serverové Supabase klienty s pevným limitem. Když databáze nestíhá, request
 * skončí chybou do pár sekund (→ 503 „služba nedostupná“) místo 30s timeoutu funkce na Vercelu.
 */
export function timeoutFetch(ms: number): typeof fetch {
  return (input, init) => {
    const timeout = AbortSignal.timeout(ms);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(input, { ...init, signal });
  };
}

/** Kontrola přihlášení a běžné dotazy účtu. */
export const SUPABASE_TIMEOUT_MS = 5_000;
