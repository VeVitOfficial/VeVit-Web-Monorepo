// Agregátor registru nástrojů — mapuje slug → React komponenta.
//
// ── KONVENCE PRO BATCH AGENTY ──────────────────────────────────────────
// Každý nástroj žije v src/components/tools/tools/<slug>.tsx a exportuje
// default React komponentu s props { locale: string }. Komponenta renderuje
// POUZE vnitřní tělo nástroje (obsah .tool-tool) — shell (header, breadcrumb,
// tool-header, tool-trust, footer) dodává stránka src/app/tools/[tool]/page.tsx.
//
// Registrace: komponenta se importuje a přidá do příslušného kategoriového
// part souboru (pdf.ts / image.ts / media.ts / text.ts / ai.ts / dev.ts /
// security.ts / calc.ts) jako:
//   "bmi-calc": BmiCalc,
//
// Tento soubor (index.ts) NIKDY needitujte — jen agreguje part soubory,
// aby paralelní agenti pracovali izolovaně. ClassName zůstávají totožné
// s legacy HTML, aby public/tools/assets/css/style.css styl fungoval.
//
// Těžké legacy UMD knihovny (pdf-lib, pdf.js, qrcode-generator, marked,
// purify, md5, ffmpeg…) se načítají z existujících public URL přes
// loadScript() helper z tool-runtime.tsx — žádné npm závislosti se nepřidávají.

import type { ToolComponent } from "@/components/tools/registry/data";
import PDF from "@/components/tools/registry/pdf";
import IMAGE from "@/components/tools/registry/image";
import MEDIA from "@/components/tools/registry/media";
import TEXT from "@/components/tools/registry/text";
import AI from "@/components/tools/registry/ai";
import DEV from "@/components/tools/registry/dev";
import SECURITY from "@/components/tools/registry/security";
import CALC from "@/components/tools/registry/calc";

export type { ToolComponent } from "@/components/tools/registry/data";

/** Slug → React komponenta nástroje (nebo undefined, pokud ještě neportováno). */
export const TOOL_COMPONENTS: Record<string, ToolComponent | undefined> = {
  ...PDF,
  ...IMAGE,
  ...MEDIA,
  ...TEXT,
  ...AI,
  ...DEV,
  ...SECURITY,
  ...CALC,
};