// Registr PDF nástrojů — mapuje slug → React komponenta.
//
// Každý nástroj žije v src/components/tools/tools/<slug>.tsx a exportuje
// default React komponentu s props { locale: Locale }. Komponenta renderuje
// POUZE vnitřní tělo nástroje (obsah .tool-tool) — shell dodává stránka
// src/app/tools/[tool]/page.tsx. ClassName zůstávají totožné s legacy HTML,
// aby public/tools/assets/css/style.css styl fungoval.
//
// UMD knihovny (pdf-lib, pdf.js + worker, jszip, jspdf, html2canvas,
// qrcode-generator, html-pdf-sanitize) se načítají líně z /tools/assets/js/lib/
// přes loadScript() — žádné npm závislosti.
//
// pdf-password: legacy nemá klientský JS (vyžaduje qpdf na serveru/VPS),
// proto je registrován jako undefined — shell zobrazí placeholder.
import type { ToolComponent } from "@/components/tools/registry/data";

import PdfMerge from "@/components/tools/tools/pdf-merge";
import PdfSplit from "@/components/tools/tools/pdf-split";
import PdfCompress from "@/components/tools/tools/pdf-compress";
import PdfRotate from "@/components/tools/tools/pdf-rotate";
import PdfOrganize from "@/components/tools/tools/pdf-organize";
import PdfWatermark from "@/components/tools/tools/pdf-watermark";
import PdfPageNumbers from "@/components/tools/tools/pdf-page-numbers";
import PdfExtractText from "@/components/tools/tools/pdf-extract-text";
import PdfToImages from "@/components/tools/tools/pdf-to-images";
import PdfToWord from "@/components/tools/tools/pdf-to-word";
import ImagesToPdf from "@/components/tools/tools/images-to-pdf";
import HtmlToPdf from "@/components/tools/tools/html-to-pdf";
import InvoiceGen from "@/components/tools/tools/invoice-gen";

const PDF: Record<string, ToolComponent | undefined> = {
  "pdf-merge": PdfMerge,
  "pdf-split": PdfSplit,
  "pdf-compress": PdfCompress,
  "pdf-rotate": PdfRotate,
  "pdf-organize": PdfOrganize,
  "pdf-watermark": PdfWatermark,
  "pdf-page-numbers": PdfPageNumbers,
  "pdf-extract-text": PdfExtractText,
  "pdf-to-images": PdfToImages,
  "pdf-to-word": PdfToWord,
  "images-to-pdf": ImagesToPdf,
  "html-to-pdf": HtmlToPdf,
  "invoice-gen": InvoiceGen,
  // pdf-password vyžaduje qpdf (shell_exec) na VPS — legacy JS neexistuje.
  "pdf-password": undefined,
};

export default PDF;