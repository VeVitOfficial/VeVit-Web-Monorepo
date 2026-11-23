"use client";

import { useState } from "react";

/**
 * Port of store/assets/js/success-page.js — one-shot download tokens through
 * the (port pending) request-download endpoint; failures surface inline.
 */

interface Item { id: number; product_type: string }

export function RequestDownloadButtons({ orderId, items }: { orderId: string; items: Item[] }) {
  const digital = items.filter((item) => item.product_type === "digital");
  if (digital.length === 0) return null;
  return (
    <>
      {digital.map((item) => (
        <RequestDownloadButton key={item.id} orderId={orderId} itemId={item.id} />
      ))}
    </>
  );
}

function RequestDownloadButton({ orderId, itemId }: { orderId: string; itemId: number }) {
  const [label, setLabel] = useState("Připravit stažení");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function request() {
    setBusy(true);
    try {
      const response = await fetch("/store/api/request-download.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderId, item_id: itemId }),
      });
      const data: { error?: { message?: string } } = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || "Stažení není k dispozici.");
      setLabel("Stahování zahájeno");
      setBusy(false);
    } catch (exception) {
      setError(exception instanceof Error && exception.message ? exception.message : "Chyba při komunikaci. Zkuste to znovu.");
      setBusy(false);
    }
  }
  return (
    <span>
      <button className="request-download btn btn-primary btn-sm" type="button" onClick={request} disabled={busy} aria-live="polite">
        {busy ? "Připravuji…" : label}
      </button>
      <output className="block mt-2 text-on-surface-variant" aria-live="polite">{error}</output>
    </span>
  );
}