// Registr PDF nástrojů — mapuje slug → React komponenta.
//
// Každý nástroj žije v src/components/tools/tools/<slug>.tsx a exportuje
// default React komponentu s props { locale: Locale }. Komponenta renderuje
// POUZE vnitřní tělo nástroje (obsah .tool-tool) — shell dodává stránka
// src/app/tools/[tool]/page.tsx. ClassName zůstávají totožné s legacy HTML,
// aby src/styles/tools.css styl fungoval.
//
// UMD knihovny (pdf-lib, pdf.js + worker, jszip, jspdf, html2canvas,
// qrcode-generator, html-pdf-sanitize) se načítají líně z /tools/assets/js/lib/
// přes loadScript() — žádné npm závislosti.
//
import type { ToolComponent } from "@/components/tools/registry/data";

import PdfMerge from "@/components/tools/tools/pdf-merge";
import PdfPassword from "@/components/tools/tools/pdf-password";
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


import PdfRemovePages from "@/components/tools/tools/pdf-remove-pages";
import PdfExtractPages from "@/components/tools/tools/pdf-extract-pages";
import PdfCrop from "@/components/tools/tools/pdf-crop";
import PdfRedact from "@/components/tools/tools/pdf-redact";
import PdfSign from "@/components/tools/tools/pdf-sign";
import PdfForms from "@/components/tools/tools/pdf-forms";
import PdfRepair from "@/components/tools/tools/pdf-repair";
import ScanToPdf from "@/components/tools/tools/scan-to-pdf";
import PdfCompare from "@/components/tools/tools/pdf-compare";
import PdfToMarkdown from "@/components/tools/tools/pdf-to-markdown";
import WordToPdf from "@/components/tools/tools/word-to-pdf";
import ExcelToPdf from "@/components/tools/tools/excel-to-pdf";
import PdfToExcel from "@/components/tools/tools/pdf-to-excel";
import PptxToPdf from "@/components/tools/tools/pptx-to-pdf";
import PdfToPptx from "@/components/tools/tools/pdf-to-pptx";
import TranslatePdf from "@/components/tools/tools/translate-pdf";
import OcrPdf from "@/components/tools/tools/ocr-pdf";
import PdfEdit from "@/components/tools/tools/pdf-edit";

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
  "pdf-password": PdfPassword,
  "pdf-remove-pages": PdfRemovePages,
  "pdf-extract-pages": PdfExtractPages,
  "pdf-crop": PdfCrop,
  "pdf-redact": PdfRedact,
  "pdf-sign": PdfSign,
  "pdf-forms": PdfForms,
  "pdf-repair": PdfRepair,
  "scan-to-pdf": ScanToPdf,
  "pdf-compare": PdfCompare,
  "pdf-to-markdown": PdfToMarkdown,
  "word-to-pdf": WordToPdf,
  "excel-to-pdf": ExcelToPdf,
  "pdf-to-excel": PdfToExcel,
  "pptx-to-pdf": PptxToPdf,
  "pdf-to-pptx": PdfToPptx,
  "translate-pdf": TranslatePdf,
  "ocr-pdf": OcrPdf,
  "pdf-edit": PdfEdit,
  // coming_soon — bez komponenty (placeholder dodává shell)
  "pdf-to-pdfa": undefined,
  "epub-to-mobi": undefined,
  "epub-to-azw3": undefined,

};

export default PDF;