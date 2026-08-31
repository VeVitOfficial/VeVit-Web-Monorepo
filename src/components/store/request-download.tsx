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
    <div>
      {digital.map((item) => (
        <RequestDownloadButton key={item.id} orderId={orderId} itemId={item.id} />
      ))}
    </div>
  );
}

function RequestDownloadButton({ orderId, itemId }: { orderId: string; itemId: number }) {
  const [label, setLabel] = useState("Připravit stažení");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function request() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/store/api/request-download.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderId, item_id: itemId }),
      });
      if (!response.ok) throw new Error("Stažení není k dispozici.");
      setLabel("Stahování zahájeno");
    } catch (exception) {
      setError(exception instanceof Error && exception.message !== "Stažení není k dispozici." ? exception.message : "Chyba při komunikaci. Zkuste to znovu.");
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="store-eyebrow">Digitální soubor je připraven ke stažení. Odkaz k jednorázovému stažení bude vygenerován po kliknutí na tlačítko.</p>
      <button className="store-button primary" type="button" onClick={request} disabled={busy}>{busy ? "Připravuji…" : label}</button>
      <output className="store-eyebrow" aria-live="polite">{error}</output>
    </div>
  );
}