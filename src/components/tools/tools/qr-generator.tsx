"use client";

// QR generátor (text/URL/Wi-Fi/vCard) — port legacy qr-generator.js.
// qrcode-generator lazy-load, canvas/table rendering. Čistě client-side.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { loadScript } from "@/components/tools/tool-runtime";

type QType = "text" | "url" | "wifi" | "vcard";

function esc(s: string): string { return String(s).replace(/([\\;,:])/g, "\\$1"); }

export default function QrGenerator({ locale }: ToolComponentProps) {
  void locale;
  const [type, setType] = useState<QType>("text");
  const [ec, setEc] = useState<"L" | "M" | "Q" | "H">("M");
  const [size, setSize] = useState(6);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const libReadyRef = useRef(false);

  // vstupy
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [ssid, setSsid] = useState("");
  const [wpass, setWpass] = useState("");
  const [enc, setEnc] = useState("WPA");
  const [hidden, setHidden] = useState(false);
  const [vn, setVn] = useState("");
  const [vp, setVp] = useState("");
  const [vt, setVt] = useState("");
  const [ve, setVe] = useState("");
  const [vu, setVu] = useState("");

  const buildData = useCallback((): string => {
    if (type === "text") return text;
    if (type === "url") return url;
    if (type === "wifi") {
      const t = enc.indexOf("WPA") !== -1 ? "WPA" : enc === "WEP" ? "WEP" : "nopass";
      return "WIFI:T:" + t + ";S:" + esc(ssid) + ";P:" + esc(wpass) + (hidden ? ";H:true" : "") + ";;";
    }
    return "BEGIN:VCARD\nVERSION:3.0\nN:" + vp + ";" + vn + ";;;\nFN:" + vn + " " + vp + "\nTEL:" + vt + "\nEMAIL:" + ve + "\nURL:" + vu + "\nEND:VCARD";
  }, [type, text, url, ssid, wpass, enc, hidden, vn, vp, vt, ve, vu]);

  const ensureLib = useCallback(async () => {
    if (libReadyRef.current) return true;
    try {
      await loadScript("/tools/assets/js/lib/qrcode-generator.min.js");
      libReadyRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const gen = useCallback(async () => {
    setErr(null);
    const data = buildData();
    if (!data || !data.trim()) { setQrUrl(null); return; }
    const ok = await ensureLib();
    if (!ok) { setErr("Knihovnu qrcode se nepodařilo načíst."); return; }
    const qrcode = (window as unknown as { qrcode?: (typeNumber: number, ec: string) => { addData: (d: string) => void; make: () => void; createDataURL: (cellSize: number, margin: number) => string } }).qrcode;
    if (!qrcode) { setErr("Knihovnu qrcode se nepodařilo načíst."); return; }
    try {
      const qr = qrcode(0, ec);
      qr.addData(data);
      qr.make();
      setQrUrl(qr.createDataURL(size || 6, 2));
    } catch (e) {
      setErr("Nelze vygenerovat (pravděpodobně příliš dlouhá data): " + (e as Error).message);
      setQrUrl(null);
    }
  }, [buildData, ensureLib, ec, size]);

  useEffect(() => { Promise.resolve().then(() => { void gen(); }); }, [type, ec, size, text, url, ssid, wpass, enc, hidden, vn, vp, vt, ve, vu, gen]);

  const onDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl; a.download = "qr-code.png"; a.click();
  };

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="seg" id="qr-type" role="tablist" aria-label="Typ QR kódu">
        {(["text", "url", "wifi", "vcard"] as QType[]).map((t) => (
          <button key={t} type="button" role="tab" data-type={t} aria-selected={type === t}
            className={type === t ? "active" : ""} onClick={() => setType(t)}>
            {t === "text" ? "Text" : t === "url" ? "URL" : t === "wifi" ? "Wi-Fi" : "vCard"}
          </button>
        ))}
      </div>

      {type === "text" ? (
        <div className="stack-sm"><label className="field-label" htmlFor="qr-text">Text</label>
          <textarea className="textarea" id="qr-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Zadejte text…" /></div>
      ) : null}
      {type === "url" ? (
        <div className="stack-sm"><label className="field-label" htmlFor="qr-url">URL</label>
          <input className="input" id="qr-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" /></div>
      ) : null}
      {type === "wifi" ? (
        <>
          <div className="stack-sm"><label className="field-label" htmlFor="qr-ssid">SSID (název sítě)</label>
            <input className="input" id="qr-ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} /></div>
          <div className="stack-sm"><label className="field-label" htmlFor="qr-wpass">Heslo</label>
            <input className="input" id="qr-wpass" value={wpass} onChange={(e) => setWpass(e.target.value)} /></div>
          <div className="row" style={{ gap: "0.75rem", alignItems: "end" }}>
            <div className="stack-sm"><label className="field-label" htmlFor="qr-enc">Šifrování</label>
              <select className="select" id="qr-enc" value={enc} onChange={(e) => setEnc(e.target.value)}>
                <option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Žádné</option>
              </select></div>
            <label className="row" style={{ gap: "0.5rem", alignItems: "center", fontSize: "0.875rem" }}>
              <input type="checkbox" id="qr-hidden" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Skrytá síť
            </label>
          </div>
        </>
      ) : null}
      {type === "vcard" ? (
        <div className="two-col">
          <div className="stack-sm"><label className="field-label" htmlFor="qr-vn">Jméno</label>
            <input className="input" id="qr-vn" value={vn} onChange={(e) => setVn(e.target.value)} /></div>
          <div className="stack-sm"><label className="field-label" htmlFor="qr-vp">Příjmení</label>
            <input className="input" id="qr-vp" value={vp} onChange={(e) => setVp(e.target.value)} /></div>
          <div className="stack-sm"><label className="field-label" htmlFor="qr-vt">Telefon</label>
            <input className="input" id="qr-vt" value={vt} onChange={(e) => setVt(e.target.value)} /></div>
          <div className="stack-sm"><label className="field-label" htmlFor="qr-ve">E-mail</label>
            <input className="input" id="qr-ve" value={ve} onChange={(e) => setVe(e.target.value)} /></div>
          <div className="stack-sm" style={{ gridColumn: "span 2" }}><label className="field-label" htmlFor="qr-vu">URL</label>
            <input className="input" id="qr-vu" value={vu} onChange={(e) => setVu(e.target.value)} /></div>
        </div>
      ) : null}

      <div className="row" style={{ gap: "0.75rem", alignItems: "end" }}>
        <div className="stack-sm"><label className="field-label" htmlFor="qr-ec">Korekce chyb</label>
          <select className="select" id="qr-ec" value={ec} onChange={(e) => setEc(e.target.value as "L" | "M" | "Q" | "H")}>
            <option value="L">L (7%)</option><option value="M">M (15%)</option><option value="Q">Q (25%)</option><option value="H">H (30%)</option>
          </select></div>
        <div className="stack-sm"><label className="field-label" htmlFor="qr-size">Velikost buněk</label>
          <input className="input" id="qr-size" type="number" min={1} max={20} value={size} style={{ width: "5rem" }} onChange={(e) => setSize(parseInt(e.target.value, 10) || 6)} /></div>
      </div>

      {err ? <p className="error-text" role="alert">{err}</p> : null}

      {qrUrl ? (
        <div className="stack-sm" style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL z qrcode knihovny, next/image není vhodné */}
          <img id="qr-img" src={qrUrl} alt="QR kód" style={{ maxWidth: "100%", borderRadius: "0.5rem" }} />
          <button className="btn btn-secondary" id="qr-dl" type="button" onClick={onDownload}>Stáhnout PNG</button>
        </div>
      ) : null}
    </div>
  );
}