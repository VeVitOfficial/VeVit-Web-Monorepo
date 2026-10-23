// Volání zápisových endpointů AIFB z prohlížeče (třídy, připojení, úpravy). CSRF token posílá
// stránka (server ho zná z přihlášení); odpověď je vždy { ok, error?, ... }.

export type ApiResult = { ok: boolean; error?: string; errors?: string[]; [key: string]: unknown };

export async function postAifb(path: string, body: Record<string, unknown>, csrfToken: string | null): Promise<ApiResult> {
  try {
    const response = await fetch(`/edu/api/aifb/${path}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiResult;
    return { ...data, ok: response.ok && data.ok === true };
  } catch {
    return { ok: false, error: "network" };
  }
}
