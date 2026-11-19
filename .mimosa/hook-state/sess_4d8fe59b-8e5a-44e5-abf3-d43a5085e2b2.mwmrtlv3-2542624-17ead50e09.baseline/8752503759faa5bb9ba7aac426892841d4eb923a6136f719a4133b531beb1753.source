"use client";
/* eslint-disable @next/next/no-img-element -- náhled stránky výsledného PDF je dataURL */

// HTML → PDF.
//  • Vysoká věrnost (výchozí): HTML se pošle na server a vykreslí v headless Chromiu (Playwright) →
//    vektorový text, CSS grid/flexbox, gradienty, stíny, zaoblení, fonty, SVG i JavaScript, stránkování jako v prohlížeči.
//  • Lokálně v prohlížeči: HTML se vykreslí v izolovaném iframe (skripty ano, síť ne), DOM se uloží jako SVG foreignObject
//    (vykresluje ho samotný prohlížeč, takže CSS sedí) a po stránkách přenese do PDF (jsPDF) jako obrázky.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ToolComponentProps, ToolUiI18n } from "@/components/tools/registry/data";
import { useToolUi, loadScript, toastSuccess, toastInfo, useToolState, fmtSize } from "@/components/tools/tool-runtime";
import { PdfLightbox, openPdf, renderPdfPage } from "@/components/tools/file-preview";

interface JsPdf {
  addImage(data: string, fmt: string, x: number, y: number, w: number, h: number): void;
  addPage(size?: [number, number], orientation?: string): void;
  output(type: "blob"): Blob;
}
interface JsPdfCtor { new (opts: unknown): JsPdf }
function jsPdfCtor(): JsPdfCtor { return ((window as unknown as { jspdf?: { jsPDF: JsPdfCtor } }).jspdf?.jsPDF ?? (window as unknown as { jsPDF?: JsPdfCtor }).jsPDF!); }

const DEFAULT_HTML = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 0; background: #f4f6fb; color: #1f2937; }
  .hero { padding: 36px; background: linear-gradient(135deg, #6366f1, #ec4899); color: #fff; border-radius: 0 0 28px 28px; box-shadow: 0 10px 30px rgba(0,0,0,.25); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 22px; }
  .card { background: #fff; border: 2px solid #6366f1; border-radius: 14px; padding: 14px; box-shadow: 0 4px 12px rgba(0,0,0,.12); }
  .row { display: flex; justify-content: space-between; padding: 0 22px 22px; }
  .pill { background: #10b981; color: #fff; padding: 4px 12px; border-radius: 999px; }
</style>
</head>
<body>
  <div class="hero"><h1>Ahoj, VeVit!</h1><p>Přechody, stíny, zaoblené rohy, grid i flexbox se zachovají.</p></div>
  <div class="grid"><div class="card">Grid 1</div><div class="card">Grid 2</div><div class="card">Grid 3</div></div>
  <div class="row"><span class="pill">flex A</span><span class="pill">flex B</span></div>
  <div id="js" style="padding:0 22px"></div>
  <script>document.getElementById('js').innerHTML = '<b style="color:#e11d48">Tento řádek vygeneroval JavaScript.</b>';</script>
</body>
</html>`;

type Engine = "server" | "local";
type Format = "A5" | "A4" | "A3" | "Letter" | "Legal" | "Tabloid";
const MM: Record<Format, [number, number]> = { A5: [148, 210], A4: [210, 297], A3: [297, 420], Letter: [215.9, 279.4], Legal: [215.9, 355.6], Tabloid: [279.4, 431.8] };
const PT_PER_MM = 72 / 25.4;
const PX_PER_MM = 96 / 25.4;

interface Settings {
  format: Format; landscape: boolean; margin: number; printBackground: boolean; media: "screen" | "print";
  preferCssPageSize: boolean; layoutWidth: number; pageMode: "paged" | "single"; waitMs: number; javascript: boolean; pageNumbers: boolean;
}

/** Izolovaný iframe (bez allow-same-origin → neprůhledný origin), pošle serializované DOM a výšku. */
function snapshotInIframe(html: string, width: number, waitMs: number, javascript: boolean): Promise<{ xhtml: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const id = `snap-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts"); // bez allow-same-origin → neprůhledný origin, nemá přístup k stránce ani úložišti
    iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:800px;border:0;visibility:hidden`;
    const probe = `<script>(function(){function go(){var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);
      parent.postMessage({id:${JSON.stringify(id)},xhtml:new XMLSerializer().serializeToString(document.documentElement),w:document.documentElement.clientWidth,h:h},"*");}
      function ready(){var f=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();f.then(function(){setTimeout(go,${Math.max(0, Math.round(waitMs))});});}
      if(document.readyState==="complete")ready();else addEventListener("load",ready);})();<\/script>`;
    // „Bez JavaScriptu“: skripty uživatele se odstraní, běží jen naše sonda, která vrátí DOM.
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' data:; img-src data: blob:; font-src data:; script-src 'unsafe-inline'; form-action 'none'">`;
    let doc = javascript ? html : html.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
    if (/<head[^>]*>/i.test(doc)) doc = doc.replace(/<head[^>]*>/i, (m) => m + csp);
    else doc = csp + doc;
    doc += probe;
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("Vykreslení v prohlížeči neodpovědělo (timeout).")); }, 25_000 + waitMs);
    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow || !e.data || e.data.id !== id) return;
      cleanup();
      resolve({ xhtml: String(e.data.xhtml), width: Number(e.data.w) || width, height: Math.max(1, Number(e.data.h) || 1) });
    };
    const cleanup = () => { window.clearTimeout(timer); window.removeEventListener("message", onMsg); iframe.remove(); };
    window.addEventListener("message", onMsg);
    iframe.srcdoc = doc;
    document.body.appendChild(iframe);
  });
}

/** SVG foreignObject → canvas (vykreslí prohlížeč, tedy se zachovají barvy, gradienty, stíny, grid, flexbox). */
async function rasterize(xhtml: string, width: number, height: number, scale: number): Promise<HTMLCanvasElement> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`;
  const img = new Image();
  img.decoding = "sync";
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("Prohlížeč nedokázal HTML vykreslit do obrázku. Zkuste režim Vysoká věrnost (server)."));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  const maxSide = 16000;
  const s = Math.min(scale, maxSide / width, maxSide / height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * s)); canvas.height = Math.max(1, Math.round(height * s));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  try { ctx.getImageData(0, 0, 1, 1); } catch { throw new Error("Prohlížeč zablokoval export vykresleného HTML (Safari). Použijte režim Vysoká věrnost (server)."); }
  return canvas;
}

export default function HtmlToPdf({ locale }: ToolComponentProps) {
  const { t } = useToolUi(locale);
  const { setState: setToolState, rootRef } = useToolState("idle");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [engine, setEngine] = useState<Engine>("server");
  const [s, setS] = useState<Settings>({ format: "A4", landscape: false, margin: 10, printBackground: true, media: "screen", preferCssPageSize: true, layoutWidth: 0, pageMode: "paged", waitMs: 600, javascript: true, pageNumbers: false });
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pdf, setPdf] = useState<{ file: File; url: string; used: Engine; pages: number } | null>(null);
  const [firstPage, setFirstPage] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));

  useEffect(() => { rootRef.current = document.getElementById("tool-root") as HTMLDivElement | null; }, [rootRef]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);
  const announce = useCallback((msg: string) => { const live = document.getElementById("tool-live-status"); if (!live) return; live.textContent = ""; window.setTimeout(() => { live.textContent = msg; }, 20); }, []);
  const setState = useCallback((st: "idle" | "ready" | "processing" | "success" | "error", msg?: string) => { setToolState(st); announce(msg ?? t(`state_${st}` as keyof ToolUiI18n)); }, [setToolState, announce, t]);

  // Náhled 1. strany výsledku.
  useEffect(() => {
    if (!pdf) return;
    let off = false;
    openPdf(pdf.file).then((d) => renderPdfPage(d, 1, 420, 540, 0.9)).then((u) => { if (!off) setFirstPage(u); }, () => { /* náhled je doplňkový */ });
    return () => { off = true; };
  }, [pdf]);

  // Živý náhled editoru (izolovaný iframe; síť pro skripty zakázaná).
  const previewDoc = useMemo(() => {
    const csp = `<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; form-action 'none'">`;
    return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + csp) : csp + html;
  }, [html]);

  const runServer = async (): Promise<Blob> => {
    const res = await fetch("/api/tools/html-to-pdf", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, ...s }),
    });
    if (!res.ok) {
      let code = "failed", message = "Převod na serveru selhal.";
      try { const j = await res.json(); code = j.error?.code ?? code; message = j.error?.message ?? message; } catch { /* odpověď není JSON */ }
      throw Object.assign(new Error(message), { code });
    }
    return res.blob();
  };

  const runLocal = async (): Promise<Blob> => {
    await loadScript("/tools/assets/js/lib/jspdf.umd.min.js");
    const [pwMm, phMm] = MM[s.format];
    const wMm = s.landscape ? phMm : pwMm, hMm = s.landscape ? pwMm : phMm;
    const marginMm = s.pageMode === "single" ? 0 : s.margin;
    const innerPx = (wMm - 2 * marginMm) * PX_PER_MM;
    const layoutW = s.layoutWidth > 0 ? s.layoutWidth : Math.round(innerPx);
    const snap = await snapshotInIframe(html, layoutW, s.waitMs, s.javascript);
    const canvas = await rasterize(snap.xhtml, layoutW, snap.height, scale);
    const wPt = wMm * PT_PER_MM, hPt = hMm * PT_PER_MM, mPt = marginMm * PT_PER_MM;
    if (s.pageMode === "single") {
      const hSingle = (canvas.height / canvas.width) * wPt;
      const doc = new (jsPdfCtor())({ orientation: "p", unit: "pt", format: [wPt, hSingle] });
      doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, wPt, hSingle);
      return doc.output("blob");
    }
    const contentW = wPt - 2 * mPt, contentH = hPt - 2 * mPt;
    const sliceH = Math.max(1, Math.floor(canvas.width * (contentH / contentW)));
    const doc = new (jsPdfCtor())({ orientation: s.landscape ? "l" : "p", unit: "pt", format: [wPt, hPt] });
    for (let y = 0, first = true; y < canvas.height; y += sliceH, first = false) {
      const h = Math.min(sliceH, canvas.height - y);
      const slice = document.createElement("canvas");
      slice.width = canvas.width; slice.height = h;
      const sc = slice.getContext("2d")!;
      sc.fillStyle = "#fff"; sc.fillRect(0, 0, slice.width, h);
      sc.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (!first) doc.addPage([wPt, hPt], s.landscape ? "l" : "p");
      doc.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", mPt, mPt, contentW, (h / canvas.width) * contentW);
    }
    return doc.output("blob");
  };

  const run = async () => {
    if (!html.trim()) { setError("Zadejte HTML obsah."); return; }
    setError(""); setNotice(""); setBusy(true); setPdf(null); setFirstPage(""); setState("processing");
    try {
      let blob: Blob, used: Engine = engine;
      if (engine === "server") {
        try { blob = await runServer(); }
        catch (e) {
          const code = (e as { code?: string }).code;
          if (code === "unavailable" || code === "busy" || e instanceof TypeError) {
            setNotice(code === "busy" ? "Server je vytížený — HTML jsem vykreslil lokálně v prohlížeči (méně věrně)." : "Serverové vykreslení (Chromium) teď není dostupné — HTML jsem vykreslil lokálně v prohlížeči (méně věrně).");
            toastInfo("Použit lokální režim");
            blob = await runLocal(); used = "local";
          } else throw e;
        }
      } else {
        blob = await runLocal();
      }
      const file = new File([blob], "html.pdf", { type: "application/pdf" });
      const doc = await openPdf(file);
      setPdf({ file, url: URL.createObjectURL(file), used, pages: doc.numPages });
      setState("success");
      toastSuccess("HTML bylo převedeno na PDF");
    } catch (e) {
      const m = (e as Error).message || "Převod HTML selhal.";
      setError(m); setState("error", m);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2_000_000) { setError("Soubor je příliš velký (max 2 MB)."); return; }
    setHtml(await f.text()); setError(""); setPdf(null);
  };

  const download = () => { if (pdf) { const a = document.createElement("a"); a.href = pdf.url; a.download = "html.pdf"; document.body.appendChild(a); a.click(); a.remove(); } };
  const serverOnly = engine === "local";

  return (
    <div className="stack" style={{ maxWidth: "62rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <span className="field-label">Způsob vykreslení</span>
        <div className="seg" role="tablist" id="hp-engine">
          <button type="button" role="tab" aria-selected={engine === "server"} className={engine === "server" ? "active" : ""} onClick={() => setEngine("server")}>Vysoká věrnost (server, Chromium)</button>
          <button type="button" role="tab" aria-selected={engine === "local"} className={engine === "local" ? "active" : ""} onClick={() => setEngine("local")}>Lokálně v prohlížeči</button>
        </div>
        <p className="muted" style={{ fontSize: ".8rem", margin: 0 }}>
          {engine === "server"
            ? "HTML se odešle na server (AWS), vykreslí v Chromiu a smaže. Vektorový text, přesné CSS (grid, flexbox, gradienty, stíny), fonty, SVG, JavaScript i stránkování."
            : "Nic se neodesílá. Stránka se vykreslí v izolovaném okně prohlížeče a do PDF se vloží jako obrázek (text nejde označit). Externí soubory (obrázky, fonty, styly z webu) se nenačtou — vkládejte je přímo do HTML (data:)."}
        </p>
      </div>

      <div className="hp-edit">
        <div>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: ".25rem" }}>
            <label className="field-label" htmlFor="hp-html" style={{ margin: 0 }}>HTML obsah</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>Načíst .html soubor</button>
            <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" aria-hidden="true" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          <textarea id="hp-html" className="textarea" value={html} onChange={(e) => setHtml(e.target.value)} rows={16} spellCheck={false} style={{ fontFamily: "var(--mono, monospace)", fontSize: "0.8rem", width: "100%" }} />
        </div>
        <div>
          <span className="field-label">Živý náhled</span>
          <iframe className="hp-preview" title="Náhled HTML" sandbox="allow-scripts" srcDoc={previewDoc} />
        </div>
      </div>

      <div className="hp-opts">
        <div><label className="field-label" htmlFor="hp-size">Formát</label>
          <select id="hp-size" className="select" value={s.format} onChange={(e) => set("format", e.target.value as Format)}>
            {(Object.keys(MM) as Format[]).map((f) => <option key={f} value={f}>{f}</option>)}
          </select></div>
        <div><label className="field-label" htmlFor="hp-orient">Orientace</label>
          <select id="hp-orient" className="select" value={s.landscape ? "l" : "p"} onChange={(e) => set("landscape", e.target.value === "l")}>
            <option value="p">Na výšku</option><option value="l">Na šířku</option>
          </select></div>
        <div><label className="field-label" htmlFor="hp-margin">Okraje: {s.margin} mm</label>
          <input id="hp-margin" type="range" min={0} max={40} value={s.margin} onChange={(e) => set("margin", +e.target.value)} style={{ width: "100%" }} disabled={s.pageMode === "single"} /></div>
        <div><label className="field-label" htmlFor="hp-mode">Stránkování</label>
          <select id="hp-mode" className="select" value={s.pageMode} onChange={(e) => set("pageMode", e.target.value as "paged" | "single")}>
            <option value="paged">Na stránky podle formátu</option><option value="single">Jedna dlouhá stránka</option>
          </select></div>
        <div><label className="field-label" htmlFor="hp-lw">Šířka rozvržení (px)</label>
          <select id="hp-lw" className="select" value={s.layoutWidth} onChange={(e) => set("layoutWidth", +e.target.value)}>
            <option value={0}>Podle šířky strany</option><option value={1024}>1024 (tablet)</option><option value={1280}>1280 (notebook)</option><option value={1440}>1440</option><option value={1920}>1920 (desktop)</option>
          </select></div>
        <div><label className="field-label" htmlFor="hp-wait">Čekání na skripty: {s.waitMs} ms</label>
          <input id="hp-wait" type="range" min={0} max={5000} step={100} value={s.waitMs} onChange={(e) => set("waitMs", +e.target.value)} style={{ width: "100%" }} /></div>
        {engine === "local" ? (
          <div><label className="field-label" htmlFor="hp-scale">Ostrost (měřítko)</label>
            <select id="hp-scale" className="select" value={scale} onChange={(e) => setScale(+e.target.value)}>
              <option value={1}>1× (rychlejší)</option><option value={2}>2× (ostré)</option><option value={3}>3× (nejostřejší)</option>
            </select></div>
        ) : (
          <div><label className="field-label" htmlFor="hp-media">Styly</label>
            <select id="hp-media" className="select" value={s.media} onChange={(e) => set("media", e.target.value as "screen" | "print")}>
              <option value="screen">Jako na obrazovce</option><option value="print">Tiskové (@media print)</option>
            </select></div>
        )}
        <label className="checkbox-row"><input type="checkbox" checked={s.printBackground} onChange={(e) => set("printBackground", e.target.checked)} disabled={serverOnly} /> <span>Tisknout barvy a pozadí</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={s.javascript} onChange={(e) => set("javascript", e.target.checked)} /> <span>Spouštět JavaScript</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={s.preferCssPageSize} onChange={(e) => set("preferCssPageSize", e.target.checked)} disabled={serverOnly} /> <span>Respektovat <code>@page</code> z CSS</span></label>
        <label className="checkbox-row"><input type="checkbox" checked={s.pageNumbers} onChange={(e) => set("pageNumbers", e.target.checked)} disabled={serverOnly || s.pageMode === "single"} /> <span>Čísla stránek</span></label>
      </div>

      <div className="row" style={{ flexWrap: "wrap" }}>
        <button className="btn btn-primary btn-touch" id="hp-run" type="button" disabled={!html.trim() || busy} onClick={run}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg> {busy ? "Převádím…" : "Převést na PDF"}
        </button>
      </div>

      {busy && <p className="progress-label" role="status">Vykresluji{engine === "server" ? " na serveru" : " v prohlížeči"}…</p>}
      {notice && <p className="muted" role="status" style={{ fontSize: ".85rem" }}>{notice}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}

      {pdf && (
        <div className="hp-result" id="hp-result">
          {firstPage ? (
            <button type="button" className="hp-result-img" onClick={() => setLightbox(true)} aria-label="Zvětšit náhled PDF"><img src={firstPage} alt="1. strana výsledného PDF" /></button>
          ) : null}
          <div className="stack-sm" style={{ flex: 1, minWidth: 0 }}>
            <strong>html.pdf</strong>
            <span className="muted">{pdf.pages} {pdf.pages === 1 ? "strana" : pdf.pages < 5 ? "strany" : "stran"} · {fmtSize(pdf.file.size)} · {pdf.used === "server" ? "vykresleno v Chromiu (vektorový text)" : "vykresleno v prohlížeči (obrázky)"}</span>
            <span className="muted" style={{ fontSize: ".8rem" }}>Klik na náhled ho zvětší, šipky listují stránkami.</span>
            <button className="btn btn-primary" type="button" onClick={download}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg> Stáhnout PDF
            </button>
          </div>
        </div>
      )}
      {pdf && lightbox ? <PdfLightbox file={pdf.file} locale={locale} onClose={() => setLightbox(false)} /> : null}

      <div className="privacy-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg> {engine === "server" ? "Vysoká věrnost: HTML se přenese šifrovaně na server k vykreslení a hned po převodu se zahodí. Citlivý obsah převádějte lokálně." : "Lokální režim: HTML opouští jen izolované okno prohlížeče, na server se neodesílá."}</div>
    </div>
  );
}
