"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

// Pages of the VeVit Office integration (pairing, consent, device code, device management). Plain forms over the
// JSON endpoints in src/app/api/office and src/app/account/oidc; the session cookie and the CSRF token come from me.php.

const TEXT = {
  cs: {
    loading: "Načítám…", signin: "Přihlaste se…", error: "Něco se nepovedlo. Zkuste to prosím znovu.", tooMany: "Příliš mnoho pokusů. Počkejte chvíli.",
    linkTitle: "Propojit server VeVit Office", linkIntro: "Zadejte kód, který ukazuje váš server (Přístup odkudkoli), a zvolte adresu, na které bude dostupný.",
    code: "Kód ze serveru", name: "Název adresy", nameHint: "malá písmena, číslice a pomlčky, 3–40 znaků", display: "Popis serveru (volitelné)", link: "Propojit",
    linked: "Hotovo. Server je propojený a za chvíli se připojí na adresu", badCode: "Kód neexistuje nebo vypršel.", taken: "Tato adresa je obsazená.",
    badName: "Adresa nesplňuje pravidla (malá písmena, číslice, pomlčky, 3–40 znaků, ne rezervovaná slova).", reserved: "Tato adresa je rezervovaná.",
    consentTitle: "Přihlásit se na cizí server?", consentLead: "Přihlašujete se na server", ownedBy: "jehož vlastníkem je", share: "Serveru se předá vaše jméno a e-mail. Heslo ani jiné údaje se nepředávají.",
    allow: "Povolit", deny: "Zamítnout", consentGone: "Žádost vypršela. Vraťte se do aplikace a zkuste přihlášení znovu.",
    deviceTitle: "Přihlásit zařízení", deviceIntro: "Zadejte kód, který vidíte v aplikaci nebo na zařízení.", deviceDone: "Hotovo. Můžete se vrátit do aplikace.", deviceDenied: "Přihlášení zamítnuto.", deviceBad: "Kód neexistuje nebo vypršel.",
    devicesTitle: "Moje servery VeVit Office", none: "Zatím nemáte žádný spárovaný server.", rename: "Přejmenovat", unlink: "Odpojit", unlinkAsk: "Odpojit server? Zruší se jeho přístup i všechny souhlasy.",
    last: "naposledy aktivní", never: "zatím nikdy", consentsTitle: "Servery, na které jste se přihlásili", consentsNone: "Žádné souhlasy.", revoke: "Odvolat souhlas", ownerLabel: "vlastník", save: "Uložit", back: "Zpět na účet",
  },
  en: {
    loading: "Loading…", signin: "Sign in…", error: "Something went wrong. Please try again.", tooMany: "Too many attempts. Please wait a moment.",
    linkTitle: "Link a VeVit Office server", linkIntro: "Enter the code your server shows (Access from anywhere) and choose the address it will be reachable at.",
    code: "Code from the server", name: "Address name", nameHint: "lower-case letters, digits and hyphens, 3–40 characters", display: "Server description (optional)", link: "Link",
    linked: "Done. The server is linked and will connect shortly at", badCode: "The code does not exist or has expired.", taken: "That address is taken.",
    badName: "The address does not follow the rules (lower-case letters, digits, hyphens, 3–40 characters, no reserved words).", reserved: "That address is reserved.",
    consentTitle: "Sign in to someone else's server?", consentLead: "You are signing in to the server", ownedBy: "owned by", share: "The server receives your name and e-mail address. Your password and other data are not shared.",
    allow: "Allow", deny: "Deny", consentGone: "The request has expired. Go back to the app and sign in again.",
    deviceTitle: "Sign in a device", deviceIntro: "Enter the code shown in the app or on the device.", deviceDone: "Done. You can return to the app.", deviceDenied: "Sign-in denied.", deviceBad: "The code does not exist or has expired.",
    devicesTitle: "My VeVit Office servers", none: "You have no linked servers yet.", rename: "Rename", unlink: "Unlink", unlinkAsk: "Unlink this server? Its access and all consents are revoked.",
    last: "last active", never: "never", consentsTitle: "Servers you signed in to", consentsNone: "No consents.", revoke: "Revoke consent", ownerLabel: "owner", save: "Save", back: "Back to account",
  },
};
type Dict = (typeof TEXT)["cs"];

function useT(): Dict {
  const [lang, setLang] = useState<"cs" | "en">("cs");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the language is only known in the browser; the server renders Czech
  useEffect(() => { if (navigator.language.toLowerCase().startsWith("en")) setLang("en"); }, []);
  return TEXT[lang];
}

/** The signed-in person's CSRF token, or a redirect to the login page that comes back here. */
function useCsrf(): string | null {
  const [csrf, setCsrf] = useState<string | null>(null);
  useEffect(() => {
    fetch("/account/api/me.php", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) { window.location.replace(`/cs/account/login?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
        const j = await r.json();
        setCsrf(typeof j?.csrf_token === "string" ? j.csrf_token : "");
      })
      .catch(() => setCsrf(""));
  }, []);
  return csrf;
}

async function call(method: string, url: string, csrf: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  const r = await fetch(url, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  try { data = r.status === 204 ? null : await r.json(); } catch { /* empty */ }
  return { status: r.status, data };
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 560, margin: "64px auto", padding: "0 20px" }}>
      <div className="card" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 22, marginTop: 0 }}>{title}</h1>
        {children}
      </div>
    </main>
  );
}

function errorText(t: Dict, status: number): string {
  return status === 429 ? t.tooMany : t.error;
}

export function LinkPage() {
  const t = useT();
  const csrf = useCsrf();
  const [code, setCode] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("code") ?? ""));
  const [name, setName] = useState("");
  const [display, setDisplay] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);
  if (csrf === null) return <Shell title={t.linkTitle}><p>{t.loading}</p></Shell>;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const { status, data } = await call("POST", "/api/office/link/confirm", csrf, { code, name, display_name: display });
    const body = data as { device?: { host: string }; error?: string; reason?: string } | null;
    if (status === 200 && body?.device) { setHost(body.device.host); return; }
    if (status === 404) setMsg(t.badCode);
    else if (status === 409 && body?.error === "name_taken") setMsg(t.taken);
    else if (status === 422) setMsg(body?.reason === "reserved" ? t.reserved : t.badName);
    else setMsg(errorText(t, status));
  };
  if (host) return <Shell title={t.linkTitle}><p>{t.linked} <strong>{host}</strong>.</p><p><a href="/cs/account">{t.back}</a></p></Shell>;
  return (
    <Shell title={t.linkTitle}>
      <p>{t.linkIntro}</p>
      <form onSubmit={submit}>
        <label>{t.code}<input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" required /></label>
        <label style={{ display: "block", marginTop: 12 }}>{t.name}
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={40} required />
            <span>.office.vevit.cz</span>
          </span>
          <small>{t.nameHint}</small>
        </label>
        <label style={{ display: "block", marginTop: 12 }}>{t.display}<input className="input" value={display} onChange={(e) => setDisplay(e.target.value)} maxLength={60} /></label>
        {msg && <p role="alert" style={{ color: "#ff8a80" }}>{msg}</p>}
        <button className="btn" type="submit" style={{ marginTop: 16 }}>{t.link}</button>
      </form>
    </Shell>
  );
}

export function ConsentPage() {
  const t = useT();
  const csrf = useCsrf();
  const [req] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("req") ?? ""));
  const [info, setInfo] = useState<{ server: string; host: string; owner: string } | "gone" | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!csrf && csrf !== "") return;
    fetch(`/account/oidc/consent?req=${encodeURIComponent(req)}`, { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => setInfo(r.ok ? await r.json() : "gone"))
      .catch(() => setInfo("gone"));
  }, [csrf, req]);
  const decide = useCallback(async (decision: "allow" | "deny") => {
    if (csrf === null) return;
    setBusy(true);
    const { status, data } = await call("POST", "/account/oidc/consent", csrf, { req, decision });
    const to = (data as { redirect?: unknown } | null)?.redirect;
    if (status === 200 && typeof to === "string") window.location.assign(to);
    else { setInfo("gone"); setBusy(false); }
  }, [csrf, req]);
  if (info === null) return <Shell title={t.consentTitle}><p>{t.loading}</p></Shell>;
  if (info === "gone") return <Shell title={t.consentTitle}><p>{t.consentGone}</p></Shell>;
  return (
    <Shell title={t.consentTitle}>
      <p>{t.consentLead} <strong>{info.server}</strong> ({info.host}){info.owner ? <> {t.ownedBy} <strong>{info.owner}</strong></> : null}.</p>
      <p>{t.share}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn" disabled={busy} onClick={() => decide("allow")}>{t.allow}</button>
        <button className="btn" disabled={busy} onClick={() => decide("deny")}>{t.deny}</button>
      </div>
    </Shell>
  );
}

export function DevicePage() {
  const t = useT();
  const csrf = useCsrf();
  const [code, setCode] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("code") ?? ""));
  const [state, setState] = useState<"form" | "approved" | "denied">("form");
  const [msg, setMsg] = useState<string | null>(null);
  if (csrf === null) return <Shell title={t.deviceTitle}><p>{t.loading}</p></Shell>;
  const send = async (decision: "allow" | "deny") => {
    setMsg(null);
    const { status } = await call("POST", "/account/oidc/device/approve", csrf, { user_code: code, decision });
    if (status === 200) setState(decision === "allow" ? "approved" : "denied");
    else setMsg(status === 404 ? t.deviceBad : errorText(t, status));
  };
  if (state === "approved") return <Shell title={t.deviceTitle}><p>{t.deviceDone}</p></Shell>;
  if (state === "denied") return <Shell title={t.deviceTitle}><p>{t.deviceDenied}</p></Shell>;
  return (
    <Shell title={t.deviceTitle}>
      <p>{t.deviceIntro}</p>
      <input className="input" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" placeholder="XXXX-XXXX" />
      {msg && <p role="alert" style={{ color: "#ff8a80" }}>{msg}</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button className="btn" onClick={() => send("allow")}>{t.allow}</button>
        <button className="btn" onClick={() => send("deny")}>{t.deny}</button>
      </div>
    </Shell>
  );
}

type Dev = { id: string; name: string; host: string; display_name: string; created_at: string; last_seen_at: string | null };
type Cons = { id: string; server: string; host: string; owner: string; granted_at: string };

export function DevicesPage() {
  const t = useT();
  const csrf = useCsrf();
  const [devices, setDevices] = useState<Dev[] | null>(null);
  const [consents, setConsents] = useState<Cons[] | null>(null);
  const reload = useCallback(async (c: string) => {
    const [d, k] = await Promise.all([call("GET", "/api/office/devices", c), call("GET", "/api/office/consents", c)]);
    setDevices((d.data as { devices?: Dev[] } | null)?.devices ?? []);
    setConsents((k.data as { consents?: Cons[] } | null)?.consents ?? []);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the lists once the session is known
  useEffect(() => { if (csrf !== null) void reload(csrf); }, [csrf, reload]);
  if (csrf === null || devices === null || consents === null) return <Shell title={t.devicesTitle}><p>{t.loading}</p></Shell>;
  return (
    <Shell title={t.devicesTitle}>
      {devices.length === 0 && <p>{t.none}</p>}
      {devices.map((d) => (
        <div key={d.id} style={{ borderTop: "1px solid #232323", padding: "12px 0" }}>
          <strong>{d.display_name}</strong> · {d.host}
          <div><small>{t.last}: {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : t.never}</small></div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={async () => {
              const v = window.prompt(t.rename, d.display_name);
              if (v && v.trim()) { await call("PATCH", `/api/office/devices/${d.id}`, csrf, { display_name: v }); await reload(csrf); }
            }}>{t.rename}</button>
            <button className="btn" onClick={async () => {
              if (window.confirm(t.unlinkAsk)) { await call("DELETE", `/api/office/devices/${d.id}`, csrf); await reload(csrf); }
            }}>{t.unlink}</button>
          </div>
        </div>
      ))}
      <h2 style={{ fontSize: 17, marginTop: 28 }}>{t.consentsTitle}</h2>
      {consents.length === 0 && <p>{t.consentsNone}</p>}
      {consents.map((c) => (
        <div key={c.id} style={{ borderTop: "1px solid #232323", padding: "12px 0" }}>
          <strong>{c.server}</strong> · {c.host}{c.owner ? <> · {t.ownerLabel}: {c.owner}</> : null}
          <div style={{ marginTop: 8 }}><button className="btn" onClick={async () => { await call("DELETE", `/api/office/consents/${c.id}`, csrf); await reload(csrf); }}>{t.revoke}</button></div>
        </div>
      ))}
    </Shell>
  );
}
