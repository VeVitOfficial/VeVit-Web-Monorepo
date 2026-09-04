// Registr dev nástrojů — viz konvence v pdf.ts.
import type { ToolComponent } from "@/components/tools/registry/data";
import AiCodeExplainer from "@/components/tools/tools/ai-code-explainer";
import AiCommitMessage from "@/components/tools/tools/ai-commit-message";
import AiRegexGenerator from "@/components/tools/tools/ai-regex-generator";
import Base64Tool from "@/components/tools/tools/base64-tool";
import CodeDiff from "@/components/tools/tools/code-diff";
import ColorPaletteGenerator from "@/components/tools/tools/color-palette-generator";
import ContrastChecker from "@/components/tools/tools/contrast-checker";
import CronBuilder from "@/components/tools/tools/cron-builder";
import CssJsHtmlFormatter from "@/components/tools/tools/css-js-html-formatter";
import CsvJsonConverter from "@/components/tools/tools/csv-json-converter";
import FakeDataGenerator from "@/components/tools/tools/fake-data-generator";
import GitignoreGenerator from "@/components/tools/tools/gitignore-generator";
import GradientGen from "@/components/tools/tools/gradient-gen";
import JsonFormatter from "@/components/tools/tools/json-formatter";
import JwtDecoder from "@/components/tools/tools/jwt-decoder";
import JwtGenerator from "@/components/tools/tools/jwt-generator";
import OgMetaGenerator from "@/components/tools/tools/og-meta-generator";
import QrGenerator from "@/components/tools/tools/qr-generator";
import RegexTester from "@/components/tools/tools/regex-tester";
import TimestampConverter from "@/components/tools/tools/timestamp-converter";
import UrlEncoder from "@/components/tools/tools/url-encoder";
import UuidGen from "@/components/tools/tools/uuid-gen";
import YamlJsonConverter from "@/components/tools/tools/yaml-json-converter";

const DEV: Record<string, ToolComponent | undefined> = {
  "ai-code-explainer": AiCodeExplainer,
  "ai-commit-message": AiCommitMessage,
  "ai-regex-generator": AiRegexGenerator,
  "base64-tool": Base64Tool,
  "code-diff": CodeDiff,
  "color-palette-generator": ColorPaletteGenerator,
  "contrast-checker": ContrastChecker,
  "cron-builder": CronBuilder,
  "css-js-html-formatter": CssJsHtmlFormatter,
  "csv-json-converter": CsvJsonConverter,
  "fake-data-generator": FakeDataGenerator,
  "gitignore-generator": GitignoreGenerator,
  "gradient-gen": GradientGen,
  "json-formatter": JsonFormatter,
  "jwt-decoder": JwtDecoder,
  "jwt-generator": JwtGenerator,
  "og-meta-generator": OgMetaGenerator,
  "qr-generator": QrGenerator,
  "regex-tester": RegexTester,
  "timestamp-converter": TimestampConverter,
  "url-encoder": UrlEncoder,
  "uuid-gen": UuidGen,
  "yaml-json-converter": YamlJsonConverter,
};

export default DEV;