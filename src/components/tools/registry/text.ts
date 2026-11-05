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


import ParagraphWriter from "@/components/tools/tools/paragraph-writer";
import SentenceRewriter from "@/components/tools/tools/sentence-rewriter";
import EssayWriter from "@/components/tools/tools/essay-writer";
import ArticleWriter from "@/components/tools/tools/article-writer";
import ParagraphCompleter from "@/components/tools/tools/paragraph-completer";
import ContentImprover from "@/components/tools/tools/content-improver";
import StoryGenerator from "@/components/tools/tools/story-generator";
import AiHumanizer from "@/components/tools/tools/ai-humanizer";
import ToneOfVoice from "@/components/tools/tools/tone-of-voice";
import FaqGenerator from "@/components/tools/tools/faq-generator";
import BusinessNameGenerator from "@/components/tools/tools/business-name-generator";
import BlogOutlineGenerator from "@/components/tools/tools/blog-outline-generator";
import BlogPostIdeas from "@/components/tools/tools/blog-post-ideas";
import InstagramCaption from "@/components/tools/tools/instagram-caption";
import LinkedinPost from "@/components/tools/tools/linkedin-post";
import FbHeadlineGenerator from "@/components/tools/tools/fb-headline-generator";
import YoutubeScript from "@/components/tools/tools/youtube-script";

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