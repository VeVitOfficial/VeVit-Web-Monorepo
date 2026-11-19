// Volání zápisových endpointů VeVit Edu pro školy z prohlížeče (/edu/api/school/*). CSRF token
// posílá stránka; odpověď je vždy { ok, error?, ... }.

import type { ApiResult } from "../aifb/api-client";

export async function postSchool(path: "vstup" | "sprava" | "ucitel", body: Record<string, unknown>, csrfToken: string | null): Promise<ApiResult> {
  try {
    const response = await fetch(`/edu/api/school/${path}`, {
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
