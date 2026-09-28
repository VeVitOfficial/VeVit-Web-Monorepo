"use client";

import { useEffect, useState } from "react";

/**
 * Whether the signed-in customer's tier ships free (Silver+). Display only:
 * the checkout snapshot decides the real shipping on the server.
 */
export function useFreeShipping(): boolean {
  const [free, setFree] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/store/api/me.php", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { perks?: { free_shipping?: boolean } } | null) => {
        if (active) setFree(data?.perks?.free_shipping === true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return free;
}
