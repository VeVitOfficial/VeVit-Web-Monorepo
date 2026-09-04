"use client";

// JWT generátor (HS256) — port legacy jwt-generator.js.
// Podepisuje přes Web Crypto HMAC SHA-256. Čistě client-side.
import { useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { useCopy, Icon, toastSuccess } from "@/components/tools/tool-runtime";

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(str: string): string {
  return b64url(new TextEncoder().encode(str));
}

export default function JwtGenerator({ locale }: ToolComponentProps) {
  void locale;
  const { copied, copy } = useCopy(locale);
  const [secret, setSecret] = useState("");
  const [payload, setPayload] = useState('{\n  "sub": "1234567890",\n  "name": "Jan Novák",\n  "iat": 1516239022\n}');
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const generate = async () => {
    setErr(null);
    if (!secret) { setErr("Zadejte tajný klíč (HMAC)."); return; }
    let obj: unknown;
    try { obj = JSON.parse(payload); }
    catch (e) { setErr("Payload není platný JSON: " + (e as Error).message); return; }
    let key: CryptoKey;
    try {
      key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    } catch {
      setErr("Tajný klíč nelze použít.");
      return;
    }
    try {
      const header = b64urlStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const body = b64urlStr(JSON.stringify(obj));
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(header + "." + body));
      const sig = b64url(new Uint8Array(sigBuf));
      setOut(header + "." + body + "." + sig);
    } catch (e) {
      setErr("Generování selhalo: " + (e as Error).message);
    }
  };

  const onCopy = async () => { if (out) { const ok = await copy(out); if (ok) toastSuccess("Zkopírováno"); } };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="jwg-secret">Tajný klíč (HMAC)</label>
        <input className="input mono" id="jwg-secret" type="text" value={secret}
          onChange={(e) => setSecret(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void generate(); } }} />
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="jwg-payload">Payload (JSON)</label>
        <textarea className="textarea mono" id="jwg-payload" rows={8} value={payload} onChange={(e) => setPayload(e.target.value)} />
      </div>
      <button className="btn btn-primary" id="jwg-gen" type="button" onClick={generate}>Vygenerovat JWT</button>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <div className="stack-sm">
        <label className="field-label" htmlFor="jwg-out">Token</label>
        <textarea className="textarea mono" id="jwg-out" rows={5} readOnly value={out} />
        <button className="btn btn-secondary" id="jwg-copy" type="button" disabled={!out} onClick={onCopy}>
          {copied ? <Icon name="Check" size={16} /> : <Icon name="Copy" size={16} />} Kopírovat
        </button>
      </div>
    </div>
  );
}