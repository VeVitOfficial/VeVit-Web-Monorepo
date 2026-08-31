"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Port of store/logout.php — the store has no login/logout of its own; the
 * Account session owns identity. The PHP page called store_destroy_session()
 * and redirected to the store home; the React page revokes the central
 * Account session (POST /account/api/logout.php clears __Host-vvsession) and
 * redirect to /store mirrors header('Location: index.html').
 */
export default function StoreLogoutPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/account/api/logout.php", { method: "POST", credentials: "same-origin" });
      } catch {
        if (!cancelled) setError("Odhlášení se nezdařilo. Přesměrujeme zpět do obchodu.");
      }
      if (!cancelled) router.replace("/store");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  return <main className="store-main store-empty">{error === "" ? <p className="store-eyebrow">Odhlašuji…</p> : <p className="store-error">{error}</p>}</main>;
}