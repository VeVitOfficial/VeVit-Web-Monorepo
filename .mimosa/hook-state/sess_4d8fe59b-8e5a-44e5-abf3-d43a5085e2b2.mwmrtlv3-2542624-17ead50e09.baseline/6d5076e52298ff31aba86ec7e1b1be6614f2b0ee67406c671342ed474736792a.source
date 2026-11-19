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
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";

const PdfMerge = dynamic(() => import("@/components/tools/tools/pdf-merge"), { loading: ToolBodySkeleton });
const PdfPassword = dynamic(() => import("@/components/tools/tools/pdf-password"), { loading: ToolBodySkeleton });
const PdfSplit = dynamic(() => import("@/components/tools/tools/pdf-split"), { loading: ToolBodySkeleton });
const PdfCompress = dynamic(() => import("@/components/tools/tools/pdf-compress"), { loading: ToolBodySkeleton });
const PdfRotate = dynamic(() => import("@/components/tools/tools/pdf-rotate"), { loading: ToolBodySkeleton });
const PdfOrganize = dynamic(() => import("@/components/tools/tools/pdf-organize"), { loading: ToolBodySkeleton });
const PdfWatermark = dynamic(() => import("@/components/tools/tools/pdf-watermark"), { loading: ToolBodySkeleton });
const PdfPageNumbers = dynamic(() => import("@/components/tools/tools/pdf-page-numbers"), { loading: ToolBodySkeleton });
const PdfExtractText = dynamic(() => import("@/components/tools/tools/pdf-extract-text"), { loading: ToolBodySkeleton });
const PdfToImages = dynamic(() => import("@/components/tools/tools/pdf-to-images"), { loading: ToolBodySkeleton });
const PdfToWord = dynamic(() => import("@/components/tools/tools/pdf-to-word"), { loading: ToolBodySkeleton });
const ImagesToPdf = dynamic(() => import("@/components/tools/tools/images-to-pdf"), { loading: ToolBodySkeleton });
const HtmlToPdf = dynamic(() => import("@/components/tools/tools/html-to-pdf"), { loading: ToolBodySkeleton });
const InvoiceGen = dynamic(() => import("@/components/tools/tools/invoice-gen"), { loading: ToolBodySkeleton });


const PdfRemovePages = dynamic(() => import("@/components/tools/tools/pdf-remove-pages"), { loading: ToolBodySkeleton });
const PdfExtractPages = dynamic(() => import("@/components/tools/tools/pdf-extract-pages"), { loading: ToolBodySkeleton });
const PdfCrop = dynamic(() => import("@/components/tools/tools/pdf-crop"), { loading: ToolBodySkeleton });
const PdfRedact = dynamic(() => import("@/components/tools/tools/pdf-redact"), { loading: ToolBodySkeleton });
const PdfSign = dynamic(() => import("@/components/tools/tools/pdf-sign"), { loading: ToolBodySkeleton });
const PdfForms = dynamic(() => import("@/components/tools/tools/pdf-forms"), { loading: ToolBodySkeleton });
const PdfRepair = dynamic(() => import("@/components/tools/tools/pdf-repair"), { loading: ToolBodySkeleton });
const ScanToPdf = dynamic(() => import("@/components/tools/tools/scan-to-pdf"), { loading: ToolBodySkeleton });
const PdfCompare = dynamic(() => import("@/components/tools/tools/pdf-compare"), { loading: ToolBodySkeleton });
const PdfToMarkdown = dynamic(() => import("@/components/tools/tools/pdf-to-markdown"), { loading: ToolBodySkeleton });
const WordToPdf = dynamic(() => import("@/components/tools/tools/word-to-pdf"), { loading: ToolBodySkeleton });
const ExcelToPdf = dynamic(() => import("@/components/tools/tools/excel-to-pdf"), { loading: ToolBodySkeleton });
const PdfToExcel = dynamic(() => import("@/components/tools/tools/pdf-to-excel"), { loading: ToolBodySkeleton });
const PptxToPdf = dynamic(() => import("@/components/tools/tools/pptx-to-pdf"), { loading: ToolBodySkeleton });
const PdfToPptx = dynamic(() => import("@/components/tools/tools/pdf-to-pptx"), { loading: ToolBodySkeleton });
const TranslatePdf = dynamic(() => import("@/components/tools/tools/translate-pdf"), { loading: ToolBodySkeleton });
const OcrPdf = dynamic(() => import("@/components/tools/tools/ocr-pdf"), { loading: ToolBodySkeleton });
const PdfEdit = dynamic(() => import("@/components/tools/tools/pdf-edit"), { loading: ToolBodySkeleton });

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