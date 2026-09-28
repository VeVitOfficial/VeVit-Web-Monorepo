"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SvcIcon } from "./icons";

// Drobné interaktivní prvky Services: záložka, uložení hledání, sdílení,
// automatické odeslání filtrů a panel filtrů na mobilu.

async function post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/services/api/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? "Něco se nepovedlo. Zkuste to znovu.");
  return data;
}

export function BookmarkButton({ requestId, initial, loginHref, compact = false }: { requestId: string; initial: boolean; loginHref: string | null; compact?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const label = saved ? "Uloženo" : "Uložit";
  async function toggle() {
    if (loginHref) {
      window.location.href = loginHref;
      return;
    }
    setBusy(true);
    try {
      const result = await post<{ saved: boolean }>("bookmarks", { request_id: requestId, saved: !saved });
      setSaved(result.saved);
    } catch {
      /* stav zůstane */
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      className={`svc-bookmark${saved ? " is-saved" : ""}${compact ? " svc-bookmark--compact" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Odebrat z uložených" : "Uložit poptávku"}
      title={saved ? "Odebrat z uložených" : "Uložit poptávku"}
      disabled={busy}
      onClick={toggle}
    >
      <SvcIcon name={saved ? "bookmark-check" : "bookmark"} size={16} />
      {compact ? null : <span>{label}</span>}
    </button>
  );
}

export function SaveSearchButton({ query, name, loginHref }: { query: string; name: string; loginHref: string | null }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  async function save() {
    if (loginHref) {
      window.location.href = loginHref;
      return;
    }
    setState("busy");
    try {
      await post("saved-searches", { query, name });
      setState("done");
      setMessage("Hlídáme. Nové poptávky vám pošleme e-mailem.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }
  return (
    <span className="svc-save-search">
      <button type="button" className="svc-btn svc-btn--sm" disabled={state === "busy" || state === "done"} onClick={save}>
        <SvcIcon name={state === "done" ? "bell-ring" : "bell"} size={15} />
        {state === "done" ? "Hlídací pes aktivní" : "Hlídat nové poptávky"}
      </button>
      {message ? <small className={state === "error" ? "svc-text-danger" : "svc-small"} role="status">{message}</small> : null}
    </span>
  );
}

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, url: absolute });
        return;
      }
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* zrušeno */
    }
  }
  return (
    <button type="button" className="svc-btn svc-btn--sm" onClick={share}>
      <SvcIcon name={copied ? "check" : "share-2"} size={15} /> {copied ? "Odkaz zkopírován" : "Sdílet"}
    </button>
  );
}

/** Odešle filtrační formulář hned po změně zaškrtávátka, výběru nebo rádia. */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement;
      if (target instanceof HTMLInputElement && (target.type === "text" || target.type === "search" || target.type === "number")) return;
      if (target.name === "obec") return;
      // Stránkování se při změně filtru vrací na první stranu.
      form.querySelector<HTMLInputElement>('input[name="strana"]')?.remove();
      form.requestSubmit();
    };
    form.addEventListener("change", onChange);
    // Změna města přichází ze skrytého pole našeptávače.
    const onCity = () => form.requestSubmit();
    form.addEventListener("svc:city", onCity);
    // Formulář mimo aside (řazení) přes atribut form=… posílá změny sem.
    const external = document.querySelectorAll<HTMLSelectElement>(`select[form="${formId}"]`);
    external.forEach((select) => select.addEventListener("change", onChange));
    return () => {
      form.removeEventListener("change", onChange);
      form.removeEventListener("svc:city", onCity);
      external.forEach((select) => select.removeEventListener("change", onChange));
    };
  }, [formId]);
  return null;
}

/** Na mobilu skrývá filtry za tlačítko, na desktopu jsou vidět vždy. */
export function FiltersPanel({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  return (
    <div className={`svc-filterpanel${open ? " is-open" : ""}`} ref={panel}>
      <button type="button" className="svc-btn svc-filterpanel__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <SvcIcon name="sliders-horizontal" size={16} /> Filtry{count ? ` (${count})` : ""}
        <SvcIcon name="chevron-down" size={16} className="svc-filterpanel__chevron" />
      </button>
      <div className="svc-filterpanel__body">{children}</div>
    </div>
  );
}

/** Přepínač e-mailů a smazání hlídacího psa v Moje zakázky. */
export function SavedSearchActions({ id, notify }: { id: string; notify: boolean }) {
  const [on, setOn] = useState(notify);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try {
      const result = await post<{ notify: boolean }>(`saved-searches/${id}`, { notify: !on });
      setOn(result.notify);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm("Smazat tohoto hlídacího psa?")) return;
    setBusy(true);
    try {
      await post(`saved-searches/${id}`, { delete: true });
      setGone(true);
      document.getElementById(`saved-${id}`)?.remove();
    } finally {
      setBusy(false);
    }
  }
  if (gone) return null;
  return (
    <span className="svc-row">
      <label className="svc-switch">
        <input type="checkbox" checked={on} disabled={busy} onChange={toggle} />
        <span>{on ? "E-maily zapnuté" : "E-maily vypnuté"}</span>
      </label>
      <button type="button" className="svc-btn svc-btn--sm svc-btn--danger" disabled={busy} onClick={remove}>
        <SvcIcon name="trash-2" size={14} /> Smazat
      </button>
    </span>
  );
}
