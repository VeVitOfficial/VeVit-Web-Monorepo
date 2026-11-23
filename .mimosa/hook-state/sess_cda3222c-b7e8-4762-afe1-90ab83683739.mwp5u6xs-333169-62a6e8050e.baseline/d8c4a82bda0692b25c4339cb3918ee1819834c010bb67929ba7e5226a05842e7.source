// Registr textových nástrojů — mapuje slug → React komponenta.
// Viz konvence v pdf.ts / index.ts. Komponenty renderují pouze vnitřní tělo .tool-tool.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";

const AiEmailWriter = dynamic(() => import("@/components/tools/tools/ai-email-writer"), { loading: ToolBodySkeleton });
const GrammarCheck = dynamic(() => import("@/components/tools/tools/grammar-check"), { loading: ToolBodySkeleton });
const LoremIpsum = dynamic(() => import("@/components/tools/tools/lorem-ipsum"), { loading: ToolBodySkeleton });
const MarkdownEditor = dynamic(() => import("@/components/tools/tools/markdown-editor"), { loading: ToolBodySkeleton });
const MindMap = dynamic(() => import("@/components/tools/tools/mind-map"), { loading: ToolBodySkeleton });
const RemoveDiacritics = dynamic(() => import("@/components/tools/tools/remove-diacritics"), { loading: ToolBodySkeleton });
const SummarizeText = dynamic(() => import("@/components/tools/tools/summarize-text"), { loading: ToolBodySkeleton });
const TextCaseConverter = dynamic(() => import("@/components/tools/tools/text-case-converter"), { loading: ToolBodySkeleton });
const TextCounter = dynamic(() => import("@/components/tools/tools/text-counter"), { loading: ToolBodySkeleton });
const TextLinesTool = dynamic(() => import("@/components/tools/tools/text-lines-tool"), { loading: ToolBodySkeleton });
const TextToSpeech = dynamic(() => import("@/components/tools/tools/text-to-speech"), { loading: ToolBodySkeleton });
const Translate = dynamic(() => import("@/components/tools/tools/translate"), { loading: ToolBodySkeleton });


const ParagraphWriter = dynamic(() => import("@/components/tools/tools/paragraph-writer"), { loading: ToolBodySkeleton });
const SentenceRewriter = dynamic(() => import("@/components/tools/tools/sentence-rewriter"), { loading: ToolBodySkeleton });
const EssayWriter = dynamic(() => import("@/components/tools/tools/essay-writer"), { loading: ToolBodySkeleton });
const ArticleWriter = dynamic(() => import("@/components/tools/tools/article-writer"), { loading: ToolBodySkeleton });
const ParagraphCompleter = dynamic(() => import("@/components/tools/tools/paragraph-completer"), { loading: ToolBodySkeleton });
const ContentImprover = dynamic(() => import("@/components/tools/tools/content-improver"), { loading: ToolBodySkeleton });
const StoryGenerator = dynamic(() => import("@/components/tools/tools/story-generator"), { loading: ToolBodySkeleton });
const AiHumanizer = dynamic(() => import("@/components/tools/tools/ai-humanizer"), { loading: ToolBodySkeleton });
const ToneOfVoice = dynamic(() => import("@/components/tools/tools/tone-of-voice"), { loading: ToolBodySkeleton });
const FaqGenerator = dynamic(() => import("@/components/tools/tools/faq-generator"), { loading: ToolBodySkeleton });
const BusinessNameGenerator = dynamic(() => import("@/components/tools/tools/business-name-generator"), { loading: ToolBodySkeleton });
const BlogOutlineGenerator = dynamic(() => import("@/components/tools/tools/blog-outline-generator"), { loading: ToolBodySkeleton });
const BlogPostIdeas = dynamic(() => import("@/components/tools/tools/blog-post-ideas"), { loading: ToolBodySkeleton });
const InstagramCaption = dynamic(() => import("@/components/tools/tools/instagram-caption"), { loading: ToolBodySkeleton });
const LinkedinPost = dynamic(() => import("@/components/tools/tools/linkedin-post"), { loading: ToolBodySkeleton });
const FbHeadlineGenerator = dynamic(() => import("@/components/tools/tools/fb-headline-generator"), { loading: ToolBodySkeleton });
const YoutubeScript = dynamic(() => import("@/components/tools/tools/youtube-script"), { loading: ToolBodySkeleton });

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
  "paragraph-writer": ParagraphWriter,
  "sentence-rewriter": SentenceRewriter,
  "essay-writer": EssayWriter,
  "article-writer": ArticleWriter,
  "paragraph-completer": ParagraphCompleter,
  "content-improver": ContentImprover,
  "story-generator": StoryGenerator,
  "ai-humanizer": AiHumanizer,
  "tone-of-voice": ToneOfVoice,
  "faq-generator": FaqGenerator,
  "business-name-generator": BusinessNameGenerator,
  "blog-outline-generator": BlogOutlineGenerator,
  "blog-post-ideas": BlogPostIdeas,
  "instagram-caption": InstagramCaption,
  "linkedin-post": LinkedinPost,
  "fb-headline-generator": FbHeadlineGenerator,
  "youtube-script": YoutubeScript,

};

export default TEXT;