"use client";

import { useRef, useState } from "react";

// Port home/assets/js/support.js — initSupportForm. Formulář nemá data-ui-attr
// (placeholder je fixní český), takže je bezpečné použít controlled React state.
// Odesílá na formsubmit.co/ajax/info@vevit.cz se _subject složeným z aplikace
// a typu zprávy, _template=table — 1:1 s legacy.
export function SupportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState("");
  const [requestType, setRequestType] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    msg: string;
    ok: boolean;
    show: boolean;
  }>({ msg: "", ok: false, show: false });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload: Record<string, string> = {
      name,
      email,
      application,
      request_type: requestType,
      message,
    };
    payload._subject = `VeVit podpora: ${payload.application} / ${payload.request_type}`;
    payload._template = "table";

    setSubmitting(true);
    setStatus({ msg: "", ok: false, show: false });

    try {
      const response = await fetch("https://formsubmit.co/ajax/info@vevit.cz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && String(data.success) !== "true") {
        throw new Error("Request failed");
      }
      setStatus({
        msg: "Zpráva byla odeslána. Děkujeme.",
        ok: true,
        show: true,
      });
      form.reset();
      setName("");
      setEmail("");
      setApplication("");
      setRequestType("");
      setMessage("");
    } catch {
      setStatus({
        msg: "Zprávu se nepodařilo odeslat. Napište na info@vevit.cz.",
        ok: false,
        show: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="support-form"
      id="support-form"
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="support-form-grid">
        <div className="field">
          <label htmlFor="support-name">Jméno</label>
          <input
            id="support-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="support-email">E-mail</label>
          <input
            id="support-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="support-application">Aplikace</label>
          <select
            id="support-application"
            name="application"
            required
            value={application}
            onChange={(e) => setApplication(e.target.value)}
          >
            <option value="">Vyberte aplikaci</option>
            <option value="Obecný dotaz">Obecný dotaz</option>
            <option value="Account">Account</option>
            <option value="Tools">Tools</option>
            <option value="Edu">Edu</option>
            <option value="Services">Services</option>
            <option value="Studios">Studios</option>
            <option value="Art">Art</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="support-request-type">Typ zprávy</label>
          <select
            id="support-request-type"
            name="request_type"
            required
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
          >
            <option value="">Vyberte typ zprávy</option>
            <option value="Dotaz">Dotaz</option>
            <option value="Nahlášení chyby">Nahlášení chyby</option>
            <option value="Zpětná vazba">Zpětná vazba</option>
          </select>
        </div>
        <div className="field support-message-field">
          <label htmlFor="support-message">Zpráva</label>
          <textarea
            id="support-message"
            name="message"
            rows={6}
            required
            placeholder="Popište dotaz nebo chybu co nejpřesněji."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Odesílám..." : "Odeslat zprávu"}
      </button>
      <p
        className={`form-status${status.show ? (status.ok ? " is-success" : " is-error") : ""}`}
        id="support-status"
        role="status"
        aria-live="polite"
        hidden={!status.show}
      >
        {status.msg}
      </p>
    </form>
  );
}