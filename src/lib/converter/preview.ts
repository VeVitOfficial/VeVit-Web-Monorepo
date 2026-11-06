// Náhled první strany PDF a počet stran (pdf.js 6, vendorovaný — D7).
import { importStatic, CONVERTER_BASE } from "./assets.ts";
import type * as Pdfjs from "pdfjs-dist";

let lib: Promise<typeof Pdfjs> | null = null;

/** pdf.js s bezpečným nastavením: bez eval, bez skriptů v PDF, vlastní worker. */
export function loadPdfjs(): Promise<typeof Pdfjs> {
  lib ??= importStatic<typeof Pdfjs>("pdfjs/pdf.min.mjs").then((m) => {
    m.GlobalWorkerOptions.workerSrc = new URL("pdfjs/pdf.worker.min.mjs", new URL(CONVERTER_BASE, self.location.origin)).toString();
    return m;
  }).catch((e) => { lib = null; throw e; });
  return lib;
}

export function pdfjsDocumentParams(data: Uint8Array, password?: string) {
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
    // Odkazy a skripty v PDF se nikdy nespouštějí.
    stopAtErrors: false,
  };
}

export interface Preview { dataUrl: string; pages: number; width: number; height: number }

/** Vykreslí 1. stranu do PNG (šířka `cssWidth` × devicePixelRatio). */
export async function previewFirstPage(pdf: Blob, cssWidth = 360): Promise<Preview> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument(pdfjsDocumentParams(new Uint8Array(await pdf.arrayBuffer())));
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = (cssWidth * Math.min(2, self.devicePixelRatio || 1)) / base.width;
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    await page.render({ canvas, viewport: vp }).promise;
    return { dataUrl: canvas.toDataURL("image/png"), pages: doc.numPages, width: base.width, height: base.height };
  } finally {
    await task.destroy();
  }
}
