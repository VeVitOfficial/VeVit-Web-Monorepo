"use client";

import { useState } from "react";
import type { PacketaPoint } from "@/lib/checkout/checkout-input";
import { PACKETA_VENDORS, pointFromWidget } from "@/lib/checkout/packeta-point";

const LIBRARY_URL = "https://widget.packeta.com/v6/www/js/library.js";

type WidgetPick = (apiKey: string, callback: (point: unknown) => void, options: Record<string, unknown>) => void;

declare global {
  interface Window {
    Packeta?: { Widget?: { pick: WidgetPick } };
  }
}

let libraryPromise: Promise<WidgetPick> | null = null;

/** Loads Packeta's integration library on first use, so pages without the picker never contact Packeta. */
function loadLibrary(): Promise<WidgetPick> {
  const ready = window.Packeta?.Widget?.pick;
  if (ready) return Promise.resolve(ready);
  libraryPromise ??= new Promise<WidgetPick>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = LIBRARY_URL;
    script.async = true;
    script.onload = () => {
      const pick = window.Packeta?.Widget?.pick;
      if (pick) resolve(pick);
      else reject(new Error("widget_missing"));
    };
    script.onerror = () => reject(new Error("widget_blocked"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    libraryPromise = null;
    throw error;
  });
  return libraryPromise;
}

export function PacketaPicker({ value, onChange }: { value: PacketaPoint | null; onChange: (point: PacketaPoint | null) => void }) {
  const [error, setError] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_PACKETA_API_KEY ?? "";

  async function open() {
    setError("");
    if (!apiKey) {
      setError("Výběr výdejního místa teď není dostupný. Zvol doručení na adresu nebo to zkus později.");
      return;
    }
    try {
      const pick = await loadLibrary();
      pick(
        apiKey,
        (raw) => {
          // null = the customer closed the map; keep the previous choice.
          if (raw === null || raw === undefined) return;
          const point = pointFromWidget(raw);
          if (point === null) setError("Toto výdejní místo nelze vybrat. Zvol prosím jiné.");
          else onChange(point);
        },
        { vendors: PACKETA_VENDORS, language: "cs" },
      );
    } catch {
      setError("Mapu Zásilkovny se nepodařilo načíst. Zkus to prosím znovu.");
    }
  }

  return (
    <div className="store-packeta">
      {value && (
        <p className="store-packeta__chosen">
          ✓ {value.kind === "zbox" ? "Z-BOX" : "Výdejní místo"}: <strong>{value.name}</strong>, {value.street}, {value.city}
        </p>
      )}
      <button type="button" className="store-button" onClick={open}>
        {value ? "Změnit výdejní místo" : "Vybrat výdejní místo na mapě"}
      </button>
      {error && <p className="store-error" role="alert">{error}</p>}
    </div>
  );
}
