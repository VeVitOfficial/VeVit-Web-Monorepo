"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

// Klientské části Services: volání API, formuláře, tlačítka akcí a konverzace.

type ApiError = { error?: { message?: string } };

export async function servicesPost<T = unknown>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`/services/api/${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(data.error?.message ?? "Něco se nepovedlo. Zkuste to znovu.");
  return data;
}

function Alert({ message, kind = "error" }: { message: string; kind?: "error" | "ok" }) {
  return message ? <p className={`svc-alert svc-alert--${kind}`} role={kind === "error" ? "alert" : "status"}>{message}</p> : null;
}

function formValue(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

/** Tlačítko jedné akce (přijmout, stáhnout, zrušit, hotovo…) s potvrzením. */
export function ActionButton({ path, label, confirm, variant = "primary", done }: {
  path: string;
  label: string;
  confirm?: string;
  variant?: "primary" | "ghost" | "danger";
  done?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setError("");
    try {
      await servicesPost(path);
      if (done) window.alert(done);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  const cls = variant === "primary" ? "svc-btn svc-btn--primary svc-btn--sm" : variant === "danger" ? "svc-btn svc-btn--danger svc-btn--sm" : "svc-btn svc-btn--sm";
  return (
    <span className="svc-stack" style={{ gap: 6 }}>
      <button type="button" className={cls} disabled={busy} onClick={run}>{busy ? "Moment…" : label}</button>
      <Alert message={error} />
    </span>
  );
}

export function OfferForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await servicesPost(`requests/${requestId}/offers`, {
        price: formValue(form, "price"),
        delivery: formValue(form, "delivery"),
        message: formValue(form, "message"),
      });
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="svc-form" onSubmit={submit}>
      <div className="svc-fields-2">
        <label className="svc-field">
          <span>Cena (Kč)</span>
          <input className="svc-input" name="price" required inputMode="numeric" pattern="[0-9 ]+" />
        </label>
        <label className="svc-field">
          <span>Termín dodání</span>
          <input className="svc-input" name="delivery" maxLength={120} placeholder="Např. do 14 dní" />
        </label>
      </div>
      <label className="svc-field">
        <span>Zpráva zadavateli</span>
        <textarea className="svc-textarea" name="message" required minLength={10} maxLength={2000} rows={4} placeholder="Jak zakázku uděláte a proč právě vy." />
      </label>
      <Alert message={error} />
      <div><button className="svc-btn svc-btn--primary" type="submit" disabled={busy}>{busy ? "Odesílám…" : "Poslat nabídku"}</button></div>
    </form>
  );
}

type Message = { id: number; sender_id: string; body: string; created_at: string };

export function Conversation({ offerId, me, initial, closed }: { offerId: string; me: string; initial: Message[]; closed?: boolean }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    if (closed) return;
    const timer = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`/services/api/offers/${offerId}/messages`, { credentials: "same-origin" });
        if (response.ok) setMessages(((await response.json()) as { messages: Message[] }).messages);
      } catch {
        /* příště */
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, [offerId, closed]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      const result = await servicesPost<{ messages: Message[] }>(`offers/${offerId}/messages`, { body: draft });
      setMessages(result.messages);
      setDraft("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="svc-thread" ref={threadRef} aria-live="polite">
        {messages.length === 0 ? <p className="svc-small">Zatím žádné zprávy.</p> : messages.map((message) => (
          <div key={message.id} className={`svc-msg${message.sender_id === me ? " svc-msg--me" : ""}`}>
            {message.body}
            <time dateTime={message.created_at}>
              {new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}
            </time>
          </div>
        ))}
      </div>
      {closed ? <p className="svc-small">Konverzace je uzavřená.</p> : (
        <form className="svc-compose" onSubmit={send}>
          <label className="svc-field" style={{ flex: 1 }}>
            <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Zpráva</span>
            <textarea className="svc-textarea" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Napište zprávu…" />
          </label>
          <button className="svc-btn svc-btn--primary" type="submit" disabled={busy || !draft.trim()}>Odeslat</button>
        </form>
      )}
      <Alert message={error} />
    </div>
  );
}

export function ReviewForm({ requestId, subject }: { requestId: string; subject: string }) {
  const router = useRouter();
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await servicesPost(`requests/${requestId}/review`, { stars, body });
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setBusy(false);
    }
  }
  return (
    <form className="svc-form" onSubmit={submit}>
      <fieldset className="svc-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <span>Jak hodnotíte spolupráci s {subject}?</span>
        <div className="svc-chips">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="svc-chip">
              <input type="radio" name="stars" checked={stars === value} onChange={() => setStars(value)} />
              {"★".repeat(value)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="svc-field">
        <span>Komentář</span>
        <textarea className="svc-textarea" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={3} placeholder="Nepovinné" />
      </label>
      <Alert message={error} />
      <div><button className="svc-btn svc-btn--primary" type="submit" disabled={busy}>Odeslat hodnocení</button></div>
    </form>
  );
}

export function ReportButton({ kind, target }: { kind: "request" | "provider" | "message" | "offer"; target: string }) {
  const [state, setState] = useState<ReactNode>(null);
  async function report() {
    const reason = window.prompt("Proč obsah nahlašujete? (aspoň 5 znaků)");
    if (!reason) return;
    try {
      await servicesPost("reports", { kind, target, reason });
      setState("Děkujeme, podíváme se na to.");
    } catch (error) {
      setState(error instanceof Error ? error.message : String(error));
    }
  }
  return state ? <span className="svc-small">{state}</span> : <button type="button" className="svc-link" onClick={report}>Nahlásit</button>;
}
