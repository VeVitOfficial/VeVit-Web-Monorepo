"use client";

// Sdílená chybová obrazovka pro error.tsx hlavních sekcí. Hranice chyb leží nad providery sekcí,
// proto se jazyk bere z URL (/<locale>/...) a barvy se dědí z tématu sekce (currentColor).
import { useEffect } from "react";

const TEXT = {
  cs: { title: "Něco se pokazilo", body: "Stránku se nepodařilo načíst. Zkuste to prosím znovu.", retry: "Zkusit znovu", home: "Na úvod" },
  sk: { title: "Niečo sa pokazilo", body: "Stránku sa nepodarilo načítať. Skúste to prosím znova.", retry: "Skúsiť znova", home: "Na úvod" },
  en: { title: "Something went wrong", body: "The page could not be loaded. Please try again.", retry: "Try again", home: "Home" },
} as const;

function locale(): keyof typeof TEXT | string {
  if (typeof window === "undefined") return "cs";
  return window.location.pathname.split("/")[1] || "cs";
}

export function ErrorView({ error, retry, homeHref }: { error: Error & { digest?: string }; retry: () => void; homeHref: string }) {
  useEffect(() => { console.error(error); }, [error]);
  const loc = locale();
  const t = loc === "cs" || loc === "sk" ? TEXT[loc] : TEXT.en;
  const prefix = /^[a-z]{2}$/.test(loc) ? `/${loc}` : "/cs";
  return (
    <main role="alert" style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "48px 16px", textAlign: "center" }}>
      <div style={{ maxWidth: "32rem" }}>
        <h1 style={{ margin: "0 0 12px", fontSize: "1.75rem" }}>{t.title}</h1>
        <p style={{ margin: "0 0 24px", opacity: 0.75, lineHeight: 1.6 }}>{t.body}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={() => retry()} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid currentColor", background: "transparent", color: "inherit", font: "inherit", fontWeight: 600, cursor: "pointer" }}>{t.retry}</button>
          <a href={`${prefix}${homeHref}`} style={{ padding: "10px 18px", borderRadius: "10px", border: "1px solid color-mix(in srgb, currentColor 30%, transparent)", textDecoration: "none", fontWeight: 600 }}>{t.home}</a>
        </div>
      </div>
    </main>
  );
}
