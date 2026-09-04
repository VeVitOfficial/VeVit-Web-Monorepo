// Registr AI nástrojů — mapuje slug → React komponenta.
// Viz konvence v index.ts (batch agent: kategorie ai).
//
// ai-image-gen je `coming_soon` (v data.ts status coming_soon) — legacy
// tools/ai-image-gen.html nemá .tool-tool tělo ani JS (jen placeholder
// .tool-placeholder.tool-info-only). Shell (src/app/tools/[tool]/page.tsx)
// placeholder vykreslí sám, když je komponenta undefined, proto se zde
// registruje jako undefined.
import type { ToolComponent } from "@/components/tools/registry/data";
import AiChat from "@/components/tools/tools/ai-chat";
import AiSeo from "@/components/tools/tools/ai-seo";
import AiSqlGen from "@/components/tools/tools/ai-sql-gen";
import AiTextQa from "@/components/tools/tools/ai-text-qa";
import AiVision from "@/components/tools/tools/ai-vision";

const AI: Record<string, ToolComponent | undefined> = {
  "ai-chat": AiChat,
  "ai-vision": AiVision,
  "ai-seo": AiSeo,
  "ai-sql-gen": AiSqlGen,
  "ai-text-qa": AiTextQa,
  // ai-image-gen: coming_soon — bez komponenty (placeholder dodává shell).
  "ai-image-gen": undefined,
};

export default AI;