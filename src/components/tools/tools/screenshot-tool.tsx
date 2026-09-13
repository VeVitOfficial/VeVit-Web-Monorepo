"use client";

// Screenshot URL — server-side nástroj přes Browserbase (Vercel Marketplace
// integrace, viz src/app/tools/api/screenshot/route.ts). Screenshot
// libovolné cizí stránky nejde spolehlivě udělat čistě v prohlížeči
// (frame-ancestors/CSP blokuje embedding na většině webů), proto na rozdíl
// od ostatních nástrojů v hubu URL skutečně opustí prohlížeč — patička to
// říká na rovinu, žádné tvrzení o lokálním zpracování.
import { useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { fmtSize, toastSuccess } from "@/components/tools/tool-runtime";

export default function ScreenshotTool(_props: ToolComponentProps) {
  const [url, setUrl] = useState("");
  const [fullPage, setFullPage] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ size: number } | null>(null);
  const [blobUrl, setBlobUrl] = useState("");
  const blobUrlRef = useRef<string>("");

  const run = async () => {
    const trimmed = url.trim();
    if (trimmed === "") { setError("Zadejte URL stránky."); return; }
    setError(""); setResult(null); setRunning(true);
    try {
      const res = await fetch("/tools/api/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, fullPage }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(d.message || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const next = URL.createObjectURL(blob);
      blobUrlRef.current = next;
      setBlobUrl(next);
      setResult({ size: blob.size });
      toastSuccess("Screenshot je hotový");
    } catch (e) {
      setError((e as Error)?.message || "Screenshot se nepodařilo pořídit.");
    } finally {
      setRunning(false);
    }
  };

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    const host = (() => { try { return new URL(url.trim()).hostname; } catch { return "screenshot"; } })();
    a.href = blobUrl; a.download = `${host}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="stack" style={{ maxWidth: "42rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="st-url">URL stránky</label>
        <input
          id="st-url" className="input" type="url" inputMode="url" placeholder="https://example.com"
          value={url} onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !running) run(); }}
        />
      </div>

      <label className="row" style={{ alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={fullPage} onChange={(e) => setFullPage(e.target.checked)} />
        <span>Celá stránka (ne jen viditelná část)</span>
      </label>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" type="button" disabled={running} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-9A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-9" /><path d="m21 3-9 9" /><path d="M15 3h6v6" /></svg> {running ? "Pořizuji screenshot…" : "Pořídit screenshot"}
        </button>
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}

      {result && (
        <div className="stack" style={{ gap: "0.5rem" }}>
          <img src={blobUrl} alt="Screenshot stránky" style={{ maxWidth: "100%", borderRadius: "0.5rem", border: "1px solid var(--border)" }} />
          <div className="result-card">
            <span className="rc-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg></span>
            <div className="rc-meta">
              <span className="rc-title">screenshot.png</span>
              <span className="rc-sub">{fmtSize(result.size)}</span>
            </div>
            <button className="btn btn-primary" type="button" onClick={download}>Stáhnout</button>
          </div>
        </div>
      )}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg> Zadaná URL se otevře na serveru (vzdálený prohlížeč) a jen výsledný obrázek se pošle zpět. Stránka samotná se na váš počítač nestahuje.</div>
    </div>
  );
}
