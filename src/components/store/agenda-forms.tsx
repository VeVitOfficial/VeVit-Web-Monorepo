"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Ports of the legacy store/assets/js/customer-agenda.js handlers:
 * the CSRF header disappears (the ported APIs gate same-origin Origin),
 * every POST carries a fresh Idempotency-Key like the PHP page JS did.
 */

interface AgendaItem { order_item_id: number; name: string; maxQuantity: number }

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ClaimCreateForm({ orderId, items }: { orderId: string; items: AgendaItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<number, number>>(() => Object.fromEntries(items.map((item) => [item.order_item_id, 0])));
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const itemsPayload = items
        .filter((item) => (selected[item.order_item_id] ?? 0) > 0)
        .map((item) => ({ order_item_id: item.order_item_id, quantity: selected[item.order_item_id] }));
      const response = await fetch("/store/api/claims/create.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Idempotency-Key": randomKey() },
        body: JSON.stringify({
          order: orderId,
          reason_code: String(data.get("reason_code") ?? ""),
          problem_description: String(data.get("problem_description") ?? ""),
          requested_resolution: String(data.get("requested_resolution") ?? ""),
          items: itemsPayload,
        }),
      });
      if (!response.ok) throw new Error("rejected");
      const payload: { claim?: { id: string } } = await response.json();
      if (payload.claim?.id) router.push(`/store/claim?id=${encodeURIComponent(payload.claim.id)}`);
      else setOutput("Požadavek byl bezpečně uložen.");
    } catch {
      setOutput("Požadavek nelze odeslat. Zkontrolujte údaje a zkuste to znovu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="store-form" onSubmit={submit}>
      <p className="store-eyebrow">Zákaznická agenda</p>
      <p>Položky a množství server vždy znovu ověří proti objednávce.</p>
      {items.map((item) => (
        <div className="store-form-row" key={item.order_item_id}>
          <label>
            <span>
              <input
                type="checkbox"
                checked={(selected[item.order_item_id] ?? 0) > 0}
                onChange={(event) => setSelected((current) => ({ ...current, [item.order_item_id]: event.target.checked ? 1 : 0 }))}
              />{" "}
              {item.name}
            </span>
          </label>
          <label>
            Množství
            <input
              type="number"
              min={1}
              max={item.maxQuantity}
              value={selected[item.order_item_id] ?? 0}
              disabled={(selected[item.order_item_id] ?? 0) === 0}
              onChange={(event) => setSelected((current) => ({ ...current, [item.order_item_id]: Math.max(1, Math.min(item.maxQuantity, Number(event.target.value) || 0)) }))}
            />
          </label>
        </div>
      ))}
      <label>Důvod<input name="reason_code" required maxLength={64} /></label>
      <label>Popis<textarea name="problem_description" required maxLength={5000} /></label>
      <label>
        Požadované řešení
        <select name="requested_resolution" defaultValue="repair">
          <option value="repair">Oprava</option>
          <option value="replacement">Výměna</option>
          <option value="refund">Vrácení peněz</option>
          <option value="other">Jiné</option>
        </select>
      </label>
      <button className="store-button primary" type="submit" disabled={busy}>Odeslat reklamaci</button>
      <output aria-live="polite">{output}</output>
    </form>
  );
}

export function ReturnCreateForm({ orderId, items }: { orderId: string; items: AgendaItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<number, number>>(() => Object.fromEntries(items.map((item) => [item.order_item_id, 0])));
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const itemsPayload = items
        .filter((item) => (selected[item.order_item_id] ?? 0) > 0)
        .map((item) => ({ order_item_id: item.order_item_id, quantity: selected[item.order_item_id] }));
      const response = await fetch("/store/api/returns/create.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Idempotency-Key": randomKey() },
        body: JSON.stringify({ order: orderId, reason_code: String(data.get("reason_code") ?? ""), items: itemsPayload }),
      });
      if (!response.ok) throw new Error("rejected");
      const payload: { return?: { id: string } } = await response.json();
      if (payload.return?.id) router.push(`/store/return?id=${encodeURIComponent(payload.return.id)}`);
      else setOutput("Požadavek byl bezpečně uložen.");
    } catch {
      setOutput("Požadavek nelze odeslat. Zkontrolujte údaje a zkuste to znovu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="store-form" onSubmit={submit}>
      <p className="store-eyebrow">Zákaznická agenda</p>
      <p>Způsobilost a množství server vždy znovu ověří.</p>
      {items.map((item) => (
        <div className="store-form-row" key={item.order_item_id}>
          <label>
            <span>
              <input
                type="checkbox"
                checked={(selected[item.order_item_id] ?? 0) > 0}
                onChange={(event) => setSelected((current) => ({ ...current, [item.order_item_id]: event.target.checked ? 1 : 0 }))}
              />{" "}
              {item.name}
            </span>
          </label>
          <label>
            Množství
            <input
              type="number"
              min={1}
              max={item.maxQuantity}
              value={selected[item.order_item_id] ?? 0}
              disabled={(selected[item.order_item_id] ?? 0) === 0}
              onChange={(event) => setSelected((current) => ({ ...current, [item.order_item_id]: Math.max(1, Math.min(item.maxQuantity, Number(event.target.value) || 0)) }))}
            />
          </label>
        </div>
      ))}
      <label>Důvod<input name="reason_code" required maxLength={64} /></label>
      <button className="store-button primary" type="submit" disabled={busy}>Odeslat žádost</button>
      <output aria-live="polite">{output}</output>
    </form>
  );
}

export function AgendaMessageForm({ endpoint, caseId }: { endpoint: "claims" | "returns"; caseId: string }) {
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`/store/api/${endpoint}/message.php`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Idempotency-Key": randomKey() },
        body: JSON.stringify({ id: caseId, message }),
      });
      if (!response.ok) throw new Error("rejected");
      setMessage("");
      setOutput("Zpráva byla uložena.");
    } catch {
      setOutput("Zprávu nelze uložit.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="store-form" onSubmit={submit}>
      <label>Doplnit zprávu<textarea name="message" required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
      <button className="store-button" type="submit" disabled={busy}>Odeslat zprávu</button>
      <output className="store-eyebrow" aria-live="polite">{output}</output>
    </form>
  );
}

export function FavoriteRemoveButton({ productId, name }: { productId: number; name: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      const response = await fetch("/store/api/favorites/remove.php", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      if (!response.ok) throw new Error("rejected");
      window.location.reload();
    } catch {
      setError("Produkt nelze odebrat.");
      setBusy(false);
    }
  }
  return (
    <span>
      <button className="store-button" type="button" onClick={remove} disabled={busy} aria-label={`Odebrat ${name} z oblíbených`}>Odebrat</button>
      <output className="store-eyebrow" aria-live="polite">{error}</output>
    </span>
  );
}