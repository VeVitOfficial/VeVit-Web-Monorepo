// Registr dev nástrojů — viz konvence v pdf.ts.
import dynamic from "next/dynamic";
import type { ToolComponent } from "@/components/tools/registry/data";
import { ToolBodySkeleton } from "@/components/tools/tool-skeleton";
const AiCodeExplainer = dynamic(() => import("@/components/tools/tools/ai-code-explainer"), { loading: ToolBodySkeleton });
const AiCommitMessage = dynamic(() => import("@/components/tools/tools/ai-commit-message"), { loading: ToolBodySkeleton });
const AiRegexGenerator = dynamic(() => import("@/components/tools/tools/ai-regex-generator"), { loading: ToolBodySkeleton });
const Base64Tool = dynamic(() => import("@/components/tools/tools/base64-tool"), { loading: ToolBodySkeleton });
const CodeDiff = dynamic(() => import("@/components/tools/tools/code-diff"), { loading: ToolBodySkeleton });
const ColorPaletteGenerator = dynamic(() => import("@/components/tools/tools/color-palette-generator"), { loading: ToolBodySkeleton });
const ContrastChecker = dynamic(() => import("@/components/tools/tools/contrast-checker"), { loading: ToolBodySkeleton });
const CronBuilder = dynamic(() => import("@/components/tools/tools/cron-builder"), { loading: ToolBodySkeleton });
const CssJsHtmlFormatter = dynamic(() => import("@/components/tools/tools/css-js-html-formatter"), { loading: ToolBodySkeleton });
const CsvJsonConverter = dynamic(() => import("@/components/tools/tools/csv-json-converter"), { loading: ToolBodySkeleton });
const FakeDataGenerator = dynamic(() => import("@/components/tools/tools/fake-data-generator"), { loading: ToolBodySkeleton });
const GitignoreGenerator = dynamic(() => import("@/components/tools/tools/gitignore-generator"), { loading: ToolBodySkeleton });
const GradientGen = dynamic(() => import("@/components/tools/tools/gradient-gen"), { loading: ToolBodySkeleton });
const JsonFormatter = dynamic(() => import("@/components/tools/tools/json-formatter"), { loading: ToolBodySkeleton });
const JwtDecoder = dynamic(() => import("@/components/tools/tools/jwt-decoder"), { loading: ToolBodySkeleton });
const JwtGenerator = dynamic(() => import("@/components/tools/tools/jwt-generator"), { loading: ToolBodySkeleton });
const OgMetaGenerator = dynamic(() => import("@/components/tools/tools/og-meta-generator"), { loading: ToolBodySkeleton });
const QrGenerator = dynamic(() => import("@/components/tools/tools/qr-generator"), { loading: ToolBodySkeleton });
const RegexTester = dynamic(() => import("@/components/tools/tools/regex-tester"), { loading: ToolBodySkeleton });
const TimestampConverter = dynamic(() => import("@/components/tools/tools/timestamp-converter"), { loading: ToolBodySkeleton });
const UrlEncoder = dynamic(() => import("@/components/tools/tools/url-encoder"), { loading: ToolBodySkeleton });
const UuidGen = dynamic(() => import("@/components/tools/tools/uuid-gen"), { loading: ToolBodySkeleton });
const YamlJsonConverter = dynamic(() => import("@/components/tools/tools/yaml-json-converter"), { loading: ToolBodySkeleton });


const CreateZip = dynamic(() => import("@/components/tools/tools/create-zip"), { loading: ToolBodySkeleton });
const SplitCsv = dynamic(() => import("@/components/tools/tools/split-csv"), { loading: ToolBodySkeleton });
const SplitExcel = dynamic(() => import("@/components/tools/tools/split-excel"), { loading: ToolBodySkeleton });
const CsvToExcel = dynamic(() => import("@/components/tools/tools/csv-to-excel"), { loading: ToolBodySkeleton });
const ExcelToCsv = dynamic(() => import("@/components/tools/tools/excel-to-csv"), { loading: ToolBodySkeleton });
const ExcelToXml = dynamic(() => import("@/components/tools/tools/excel-to-xml"), { loading: ToolBodySkeleton });
const XmlToExcel = dynamic(() => import("@/components/tools/tools/xml-to-excel"), { loading: ToolBodySkeleton });
const XmlToJson = dynamic(() => import("@/components/tools/tools/xml-to-json"), { loading: ToolBodySkeleton });
const JsonToXml = dynamic(() => import("@/components/tools/tools/json-to-xml"), { loading: ToolBodySkeleton });

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
  "create-zip": CreateZip,
  "split-csv": SplitCsv,
  "split-excel": SplitExcel,
  "csv-to-excel": CsvToExcel,
  "excel-to-csv": ExcelToCsv,
  "excel-to-xml": ExcelToXml,
  "xml-to-excel": XmlToExcel,
  "xml-to-json": XmlToJson,
  "json-to-xml": JsonToXml,

};

export default DEV;