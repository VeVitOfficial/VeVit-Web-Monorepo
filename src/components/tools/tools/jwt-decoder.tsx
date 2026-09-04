"use client";

// JWT dekodér — port legacy jwt-decoder.js.
// base64url decode + volitelné ověření HS256 přes Web Crypto.
import { useCallback, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { toastSuccess, toastError } from "@/components/tools/tool-runtime";

function b64urlDecode(str: string): Uint8Array {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function b64urlStr(str: string): string {
  return new TextDecoder("utf-8").decode(b64urlDecode(str));
}
function pretty(json: string): string {
  try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
}

async function verifyHs256(msgB64url: string, sigB64url: string, secretStr: string): Promise<boolean> {
  const keyData = new TextEncoder().encode(secretStr);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const sig = b64urlDecode(sigB64url);
  const msg = new TextEncoder().encode(msgB64url);
  return crypto.subtle.verify("HMAC", key, sig as BufferSource, msg);
}

export default function JwtDecoder({ locale }: ToolComponentProps) {
  void locale;
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [alg, setAlg] = useState("—");
  const [status, setStatus] = useState("—");
  const [statusColor, setStatusColor] = useState<string | undefined>(undefined);
  const [header, setHeader] = useState("—");
  const [payload, setPayload] = useState("—");
  const [err, setErr] = useState<string | null>(null);

  const decode = useCallback(() => {
    setErr(null);
    const raw = token.trim();
    if (!raw) { setAlg("—"); setStatus("—"); setStatusColor(undefined); setHeader("—"); setPayload("—"); return; }
    const parts = raw.split(".");
    if (parts.length < 2) { setErr("JWT musí mít alespoň 2 části oddělené tečkou (header.payload)."); return; }
    try {
      const h = JSON.parse(b64urlStr(parts[0]));
      const p = JSON.parse(b64urlStr(parts[1]));
      setAlg(h.alg || "—");
      setHeader(pretty(JSON.stringify(h)));
      setPayload(pretty(JSON.stringify(p)));
      const now = Math.floor(Date.now() / 1000);
      const st: string[] = [];
      let col: string | undefined = "var(--color-emerald)";
      if (p.exp) { if (now >= p.exp) { st.push("vypršel " + new Date(p.exp * 1000).toLocaleString("cs-CZ")); col = "var(--color-red)"; } else st.push("platný do " + new Date(p.exp * 1000).toLocaleString("cs-CZ")); }
      else st.push("bez exp");
      if (p.nbf && now < p.nbf) { st.push("ještě neplatný"); col = "var(--color-amber)"; }
      setStatus(st.join(" · "));
      setStatusColor(col);
    } catch {
      setErr("Nelze dekódovat — neplatný JWT (špatný base64url).");
    }
  }, [token]);

  const doVerify = async () => {
    setErr(null);
    const parts = token.trim().split(".");
    if (parts.length < 3) { setErr("Pro ověření podpisu je potřeba token se 3 částmi (header.payload.signature)."); return; }
    if (!secret) { setErr("Zadejte tajný klíč pro ověření HS256."); return; }
    try {
      const h = JSON.parse(b64urlStr(parts[0]));
      if (h.alg !== "HS256") { setErr("Ověření podporováno jen pro HS256 (token používá " + (h.alg || "?") + ")."); return; }
      const ok = await verifyHs256(parts[0] + "." + parts[1], parts[2], secret);
      if (ok) { toastSuccess("Podpis je platný"); setStatus("Podpis platný ✓"); setStatusColor("var(--color-emerald)"); }
      else { toastError("Podpis NEPLATNÝ"); setStatus("Podpis NEPLATNÝ ✗"); setStatusColor("var(--color-red)"); }
    } catch (e) {
      setErr("Ověření selhalo: " + ((e as Error).message || e));
    }
  };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="jd-token">JWT token</label>
        <textarea className="textarea mono" id="jd-token" rows={4} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" value={token} onChange={(e) => { setToken(e.target.value); Promise.resolve().then(decode); }} />
      </div>
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label" htmlFor="jd-secret">Tajný klíč (pro HS256 ověření)</label>
          <input className="input mono" id="jd-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        </div>
        <div className="stack-sm">
          <label className="field-label">Algoritmus / Stav</label>
          <div className="kv"><span className="k">Alg</span><span className="v mono" id="jd-alg">{alg}</span></div>
          <div className="kv"><span className="k">Stav</span><span className="v" id="jd-status" style={statusColor ? { color: statusColor } : undefined}>{status}</span></div>
        </div>
      </div>
      <button className="btn btn-primary" id="jd-verify" type="button" onClick={doVerify}>Ověřit podpis (HS256)</button>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="two-col">
        <div className="stack-sm">
          <label className="field-label">Header</label>
          <textarea className="textarea mono" id="jd-header" rows={6} readOnly value={header} />
        </div>
        <div className="stack-sm">
          <label className="field-label">Payload</label>
          <textarea className="textarea mono" id="jd-payload" rows={6} readOnly value={payload} />
        </div>
      </div>
    </div>
  );
}