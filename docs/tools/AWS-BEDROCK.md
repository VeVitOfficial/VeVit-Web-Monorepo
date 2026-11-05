# AWS Bedrock pro AI nástroje VeVit Tools

AI endpoint `/tools/api/ai/[tool]` obsluhuje všech 12 AI nástrojů (ai-chat,
ai-vision, translate, summarize-text, grammar-check, ai-email-writer, ai-seo,
ai-sql-gen, ai-text-qa, ai-commit-message, ai-regex-generator, ai-code-explainer).
Server volí providera automaticky podle env proměnných.

## Jak to funguje

```
klient (AI nástroj) ──POST /tools/api/ai/<tool>──▶ Next.js route (server)
                                                    │
                            ┌───────────────────────┴──────────────────────┐
                            │ AWS_REGION + AWS_BEDROCK_MODEL_ID nastaveny? │
                            └───────┬──────────────────────────┬───────────┘
                                  ANO                          NE
                            BedrockRuntimeClient         fetch na OLLAMA_URL
                            ConverseStream (Claude)      /api/generate
                            └───────────┬──────────────────┘
                        NDJSON {response:"token"}…{done:true}  → klient (stream)
```

- Klient posílá jen `prompt` + `tool` identifikátor. System prompt se dosazuje
  server-side (src/lib/tools-ai-prompts.ts) — klient ho nikdy neposílá.
- Bedrock adaptér (src/lib/tools-ai-bedrock.ts) mapuje ConverseStream na
  tentýž NDJSON formát, který čtou klientské smyčky — přepínání providerů
  se klientského kódu vůbec nedotkne.
- Rate limiting: 30 požadavků / min / IP (fail-closed přes Supabase), prompt
  max 20 000 bajtů, obrázky jen pro ai-vision (max 4 × 8 MB base64).

## Nastavení na Vercelu

1. **Env proměnné** (Project → Settings → Environment Variables):
   - `AWS_REGION` — např. `eu-central-1`
   - `AWS_BEDROCK_MODEL_ID` — např. `eu.anthropic.claude-3-5-haiku-20241022-v1:0`
     (region prefix v ID musí odpovídat regionu, jinak model nenajdete)
   - Credentials — jedna z možností:
     - `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` (+ případně
       `AWS_SESSION_TOKEN`) uživatele s minimální IAM politikou níže, nebo
     - OIDC role pro Vercel (bez dlouhodobých klíčů) — SDK ji převezme přes
       standardní chain.
2. **IAM politika** (minimální oprávnění):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["bedrock:InvokeModelWithResponseStream", "bedrock:InvokeModel"],
       "Resource": "arn:aws:bedrock:*:<account-id>:foundation-model/*"
     }]
   }
   ```
3. **Bedrock Model access** (AWS console → Bedrock → Model access): povolte
   konkrétní model (např. Claude 3.5 Haiku) pro svůj účet v daném regionu.
   Bez tohoto kroku route vrací 502 "nemá povolen přístup k modelu".
4. **maxDuration**: AI route má ve vercel.json 60 s (ostatní route 30 s).
   ConverseStream má vlastní timeout 60 s.

## Lokální vývoj

- Bez AWS env: route padne na Ollamu. Spusťte lokálně Ollamu:
  ```bash
  ollama pull llama3.2
  ollama serve
  ```
- S AWS env v `.env.local`: Bedrock se použije i lokálně (platí se tokeny).

## Modely

| Model ID (eu-central-1) | Poznámka |
|---|---|
| `eu.anthropic.claude-3-5-haiku-20241022-v1:0` | rychlý, levný — doporučený default |
| `eu.anthropic.claude-3-5-sonnet-20241022-v2:0` | kvalitnější, dražší |
| `eu.anthropic.claude-3-haiku-20240307-v1:0` | nejlevnější |

Vision (ai-vision): Claude 3.5 modely umí obrázky.(llava zůstává pro Ollama
fallback — Bedrock cesta pošle obrázky jako image content blocks automaticky.)

## Řešení problémů

| Chyba | Příčina |
|---|---|
| 502 „AI služba není dostupná" | Bedrock není nastaven a Ollama není dosažitelná |
| 502 „nemá povolen přístup k modelu" | chybí Bedrock Model access nebo IAM |
| 429 „AI služba je přetížená" | Bedrock throttling nebo rate limit (30/min/IP) |
| 503 „AI služba je dočasně nedostupná" | rate-limit storage (Supabase) nedostupná — fail-closed |
