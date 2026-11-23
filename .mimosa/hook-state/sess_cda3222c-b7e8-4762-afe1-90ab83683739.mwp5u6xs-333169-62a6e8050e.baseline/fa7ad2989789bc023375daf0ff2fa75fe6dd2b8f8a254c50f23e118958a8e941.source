// AWS Bedrock provider pro AI endpoint (/tools/api/ai/[tool]).
// Produkuje stejný NDJSON proud jako Ollama /api/generate (řádky
// {response: token}…{done: true}), takže klientské čtecí smyčky zůstávají
// beze změny (_ai-shared.tsx i legacy ai-tool.js).
//
// Aktivace: nastavte AWS_REGION + AWS_BEDROCK_MODEL_ID (a credentials přes
// standardní AWS chain — na Vercelu role/keys). Jinak route spadne na Ollama.
// Detaily: docs/tools/AWS-BEDROCK.md
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type Message,
  type ImageFormat,
} from "@aws-sdk/client-bedrock-runtime";

const BEDROCK_TIMEOUT_MS = 60_000;

let cachedClient: BedrockRuntimeClient | null = null;
let cachedRegion = "";

function bedrockClient(region: string): BedrockRuntimeClient {
  if (cachedClient && cachedRegion === region) return cachedClient;
  cachedClient = new BedrockRuntimeClient({ region });
  cachedRegion = region;
  return cachedClient;
}

export function bedrockConfigured(): boolean {
  const region = process.env.AWS_REGION?.trim();
  const modelId = process.env.AWS_BEDROCK_MODEL_ID?.trim();
  return Boolean(region && modelId);
}

/** Rozpozná obrazový formát z base64 magic bytes (Converse API ho vyžaduje). */
function sniffImageFormat(base64: string): ImageFormat {
  const head = Buffer.from(base64.slice(0, 32), "base64");
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return "png";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8) return "jpeg";
  if (head.length >= 3 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) return "gif";
  if (head.length >= 12 && head.toString("ascii", 8, 12) === "WEBP") return "webp";
  return "png";
}

export interface BedrockRequest {
  prompt: string;
  system: string | null;
  /** base64 (bez data: prefixu) obrázky — jen vision */
  images: string[];
  /** volitelná override model ID (např. vision model pro ai-vision);
   * default = AWS_BEDROCK_MODEL_ID */
  modelId?: string;
}

/**
 * Zavolá Bedrock ConverseStream a vrátí ReadableStream NDJSON řádků
 * kompatibilních s Ollama formátem, který čtou klienti:
 *   {"response":"token"} … {"done":true}
 */
export function bedrockStream(req: BedrockRequest): Promise<ReadableStream<Uint8Array>> {
  const region = process.env.AWS_REGION!.trim();
  const modelId = (req.modelId ?? process.env.AWS_BEDROCK_MODEL_ID!).trim();
  const client = bedrockClient(region);

  const content: Message["content"] = [{ text: req.prompt }];
  for (const b64 of req.images) {
    content.push({
      image: {
        format: sniffImageFormat(b64),
        source: { bytes: Buffer.from(b64, "base64") },
      },
    });
  }

  const command = new ConverseStreamCommand({
    modelId,
    ...(req.system ? { system: [{ text: req.system }] } : {}),
    messages: [{ role: "user", content }],
  });

  return (async () => {
    const upstream = await client.send(command, { abortSignal: AbortSignal.timeout(BEDROCK_TIMEOUT_MS) });
    const events = upstream.stream;
    if (!events) throw new Error("Bedrock nevrátil stream.");

    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const writeLine = (obj: unknown) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        };
        try {
          for await (const event of events) {
            const delta = event.contentBlockDelta?.delta;
            const text = delta && "text" in delta ? delta.text : undefined;
            if (text) writeLine({ response: text });
            if (event.messageStop) break;
          }
          writeLine({ done: true });
          controller.close();
        } catch (e) {
          // chybu zabalí volající route (fetch-style try/catch kolem čtení)
          controller.error(e);
        }
      },
      cancel() {
        // iterator se uvolní sám při zrušení čtení
      },
    });
  })();
}
