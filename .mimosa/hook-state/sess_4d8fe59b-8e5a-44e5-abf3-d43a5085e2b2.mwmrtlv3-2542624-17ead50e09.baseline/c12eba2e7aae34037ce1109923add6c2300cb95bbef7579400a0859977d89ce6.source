// Parametry getDocument pro pdf.js 6 (okno i worker): bez eval, bez XFA, data z vendorovaných URL.
import { CONVERTER_BASE } from "./assets.ts";

export function pdfjsDocumentParams(data: Uint8Array, password?: string, opts: { worker?: boolean } = {}) {
  const base = new URL("pdfjs/", new URL(CONVERTER_BASE, self.location.origin)).toString();
  return {
    data,
    password,
    isEvalSupported: false,
    // Jména fontů (PostScript) pro mapování na plné fonty v DOCX.
    fontExtraProperties: true,
    enableXfa: false,
    cMapUrl: base + "cmaps/",
    cMapPacked: true,
    standardFontDataUrl: base + "standard_fonts/",
    wasmUrl: base + "wasm/",
    iccUrl: base + "iccs/",
    // Ve workeru není `document`: fonty se nenačítají jako FontFace (pro extrakci nejsou potřeba).
    disableFontFace: !!opts.worker,
    // Výchozí hodnota se odvozuje z document.baseURI (ve workeru neexistuje); data stahuje worker pdf.js.
    // Obrázky jako surová data (ne VideoFrame/ImageBitmap): WebKit z VideoFrame pixely nevydá.
    ...(opts.worker ? { useWorkerFetch: true, isImageDecoderSupported: false, isOffscreenCanvasSupported: false } : {}),
    // Odkazy a skripty v PDF se nikdy nespouštějí.
    stopAtErrors: false,
  };
}

