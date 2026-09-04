// Registr textových nástrojů — mapuje slug → React komponenta.
// Viz konvence v pdf.ts / index.ts. Komponenty renderují pouze vnitřní tělo .tool-tool.
import type { ToolComponent } from "@/components/tools/registry/data";

import AiEmailWriter from "@/components/tools/tools/ai-email-writer";
import GrammarCheck from "@/components/tools/tools/grammar-check";
import LoremIpsum from "@/components/tools/tools/lorem-ipsum";
import MarkdownEditor from "@/components/tools/tools/markdown-editor";
import MindMap from "@/components/tools/tools/mind-map";
import RemoveDiacritics from "@/components/tools/tools/remove-diacritics";
import SummarizeText from "@/components/tools/tools/summarize-text";
import TextCaseConverter from "@/components/tools/tools/text-case-converter";
import TextCounter from "@/components/tools/tools/text-counter";
import TextLinesTool from "@/components/tools/tools/text-lines-tool";
import TextToSpeech from "@/components/tools/tools/text-to-speech";
import Translate from "@/components/tools/tools/translate";

const TEXT: Record<string, ToolComponent | undefined> = {
  "ai-email-writer": AiEmailWriter,
  "grammar-check": GrammarCheck,
  "lorem-ipsum": LoremIpsum,
  "markdown-editor": MarkdownEditor,
  "mind-map": MindMap,
  "remove-diacritics": RemoveDiacritics,
  "summarize-text": SummarizeText,
  "text-case-converter": TextCaseConverter,
  "text-counter": TextCounter,
  "text-lines-tool": TextLinesTool,
  "text-to-speech": TextToSpeech,
  "translate": Translate,
};

export default TEXT;