// Registr AI nástrojů — mapuje slug → React komponenta.
// Viz konvence v index.ts (batch agent: kategorie ai).
//
// ai-image-gen je `coming_soon` (v data.ts status coming_soon) — legacy
// tools/ai-image-gen.html nemá .tool-tool tělo ani JS (jen placeholder
// .tool-placeholder.tool-info-only). Shell (src/app/tools/[tool]/page.tsx)
// placeholder vykreslí sám, když je komponenta undefined, proto se zde
// registruje jako undefined.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";
const AiChat = dynamic(() => import("@/components/tools/tools/ai-chat"), { loading: ToolBodySkeleton });
const AiSeo = dynamic(() => import("@/components/tools/tools/ai-seo"), { loading: ToolBodySkeleton });
const AiSqlGen = dynamic(() => import("@/components/tools/tools/ai-sql-gen"), { loading: ToolBodySkeleton });
const AiTextQa = dynamic(() => import("@/components/tools/tools/ai-text-qa"), { loading: ToolBodySkeleton });
const AiVision = dynamic(() => import("@/components/tools/tools/ai-vision"), { loading: ToolBodySkeleton });

const AI: Record<string, ToolComponent | undefined> = {
  "ai-chat": AiChat,
  "ai-vision": AiVision,
  "ai-seo": AiSeo,
  "ai-sql-gen": AiSqlGen,
  "ai-text-qa": AiTextQa,
  // ai-image-gen: coming_soon — bez komponenty (placeholder dodává shell).
  "ai-image-gen": undefined,
  // coming_soon — specializované modely nejsou zatím hostované
  "ai-restore-photo": undefined,
  "ai-colorize": undefined,
  "ai-remove-object": undefined,

};

export default AI;