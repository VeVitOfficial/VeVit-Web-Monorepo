# AWS Bedrock pro AI nástroje VeVit Tools

AI endpoint `/tools/api/ai/[tool]` obsluhuje všech 30 AI nástrojů (ai-chat,
ai-vision, translate, summarize-text, grammar-check, ai-email-writer, ai-seo,
ai-sql-gen, ai-text-qa, ai-commit-message, ai-regex-generator, ai-code-explainer,
translate-pdf + 17 AI Writing). Server volí providera automaticky podle env
proměnných.

## ⚡ Krok za krokem (pokud AWS ještě nemáš)

### Část A — AWS účet a Bedrock (~10 minut)

1. **Účet**: na https://aws.amazon.com → „Vytvořit účet AWS". Potřebuješ e-mail
   a platební kartu (Bedrock platíš jen za skutečné tokeny — Haiku vychází
   na řádově haléře za dotaz; viz Ceny níže). Bez aktivity nic neplatíš.
2. **Region**: vpravo nahoře v konzoli vyber svůj evropský region —
   **eu-central-1** (Frankfurt, nejbližší Vercelu) nebo
   **eu-north-1** (Stockholm) — oba podporují Claude a rozdíl latence
   je ~20 ms. Důležitá je jen shoda prefixu v model ID: evropské regiony
   používají `eu.` (např. `eu.anthropic.…`).
3. **Use case formulář — jen u Anthropic**: stránka Model access byla
   zrušena — modely se dnes aktivují automaticky při prvním zavolání.
   **Qwen3 a Nova žádný formulář nepotřebují** — fungují hned, můžeš tenhle
   krok přeskočit. Dotazník vyplňuješ jen pokud zvolíš Claude:
   Bedrock → **Playground → Chat** → „Select model" → **Claude Haiku 5.5**
   → vyplň 2-3 věty o použití (překlady, korektury, generování textu pro
   web) → **Submit** → testovací zpráva v playgroundu. (Bez něj první
   volání vrátí AccessDenied s výzvou k odeslání use case.)
4. **IAM uživatel** (nikdy root klíče!):
   https://console.aws.amazon.com/iam/home#/users → **Create user** →
   jméno `vevit-tools-ai` → ✅ „Provide user access to the AWS Management
   Console" NECH NEZAŠKRTNUTÉ (chceme jen API) → Next.
5. **Oprávnění**: → „Attach policies directly" → **Create policy** (přepni
   na JSON) a vlož:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
       "Resource": "arn:aws:bedrock:*:<TVOJE_ACCOUNT_ID>:foundation-model/*"
     }]
   }
   ```

   `<TVOJE_ACCOUNT_ID>` najdeš vpravo nahoře v konzoli (12místné číslo).
   Politiku pojmenuj `BedrockVeVitToolsInvoke` → Next → Create.
   Zpět v průvodci uživatelem vyfiltruj „BedrockVeVitToolsInvoke" → zaškrtni → Next →
   **Create user**.
6. **Access key**: klikni na vytvořeného uživatele → záložka **Security
   credentials** → „Access keys" → **Create access key** → use case
   „Application running outside AWS" → Create → **okamžitě si zkopíruj**
   `Access key ID` (začíná `AKIA…`) a `Secret access key` (secret po
   zavření už neuvidíš).

### Část B — Napojení na Vercel (~3 minuty)

1. https://vercel.com → tvůj projekt → **Settings → Environment Variables**.
2. Přidej 4 proměnné (Environment zaškrtni **Production** i **Preview**):

   | Name | Value |
   |---|---|
   | `AWS_REGION` | `eu-north-1` |
   | `AWS_BEDROCK_MODEL_ID` | `qwen.qwen3-235b-a22b-2507-v1:0` |
   | `AWS_BEDROCK_VISION_MODEL_ID` | `amazon.nova-lite-v1:0` |
   | `AWS_ACCESS_KEY_ID` | `AKIA…` (z kroku A6) |
   | `AWS_SECRET_ACCESS_KEY` | secret z kroku A6 |

   (Levná kombinace: Qwen3 pro text + Nova Lite pro ai-vision, oba in-region
   v Stockholm, žádný use case formulář. Kvalitnější alternativa:
   `eu.anthropic.claude-haiku-5-5` pro oba — vyžaduje krok 3.)

   Pozor: klíče NIKDY nezkoušej přes `NEXT_PUBLIC_*` a nikam je necommituj
   (repo má i `npm run secret-scan`).
3. **Deployments** → nejnovější deploy → tři tečky → **Redeploy**
   (env změny se berou až po redeployi).
4. **Test**: otevři https://www.vevit.cz/cs/tools/ai-chat, napiš cokoliv —
   odpověď by se měla streamovat. Rychlá kontrola z terminálu:

   ```bash
   curl -s -X POST https://www.vevit.cz/tools/api/ai/ai-chat \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Ahoj, napiš jednu větu o sobě.","stream":true}'
   # očekáváš řádky {"response":"…"} … {"done":true}
   ```

### Část C — Lokální test (volitelné)

Do `.env.local` přidej tytéž 4 proměnné a restartuj `npm run dev`.
Bedrock se pak používá i lokálně (platí se tvé tokeny).

## Ceny (orientačně, 2026-11)

| Model | vstup / 1M | výstup / 1M | obrázky | poznámka |
|---|---|---|---|---|
| **Qwen3 235B** (text) | ~$0.15–0.30 | ~$1.1–1.5 | ne | default — in-region Stockholm, žádný formulář |
| **Nova Lite** (vision) | ~$0.06 | ~$0.24 | ano | pro ai-vision, velmi levný |
| Claude Haiku 5.5 | ~$1 | ~$5 | ano | kvalita, dražší, use case formulář |
| DeepSeek V3.2 | ~$0.74 | ~$2 | ne | ověř dostupnost v Model catalog |

Typický dotaz nástroje (~500 vstupních + 300 výstupních tokenů) na Qwen3
≈ **$0.0005** — tisíc dotazů ≈ **$0.5**. Přesné sazby: aws.amazon.com/bedrock/pricing.
Pro jistotu si v AWS Billing → Budgets nastav alarm (např. $10/měsíc).

Ochrana už od začátku: rate limit 30 dotazů/min/IP (fail-closed), prompt
max 20 kB, obrázky jen ai-vision (4×8 MB), systémové prompty server-side.

---

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
   - `AWS_REGION` — např. `eu-north-1`
   - `AWS_BEDROCK_MODEL_ID` — např. `eu.anthropic.claude-haiku-5-5`
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
   První volání Anthropic modelu vyžaduje jednorázové odeslání use case
   (viz Část A krok 3). Bez něj route vrací 502 "nemá povolen přístup k modelu".
4. **maxDuration**: AI route má ve vercel.json 60 s (ostatní route 30 s).
   ConverseStream má vlastní timeout 60 s.

## Lokální vývoj

- Bez AWS env: route padne na Ollamu. Spusťte lokálně Ollamu:
  ```bash
  ollama pull llama3.2
  ollama serve
  ```
- S AWS env v `.env.local`: Bedrock se použije i lokálně (platí se tokeny).

## Modely (stav 2026-11, region eu-north-1 Stockholm)

Starší Claude 3.5 AWS vyřadil. Náš kód používá Converse API — funguje se
VŠEMI Bedrock modely, ne jen Anthropic. Model ID je čistě env volba.

| Model ID | cena tier | obrázky | poznámka |
|---|---|---|---|
| `qwen.qwen3-235b-a22b-2507-v1:0` | € | ne | **default** — 256K kontext, in-region Stockholm, dobrá čeština |
| `amazon.nova-lite-v1:0` | € | ano | vision pro ai-vision (AWS_BEDROCK_VISION_MODEL_ID) |
| `eu.anthropic.claude-haiku-5-5` | €€€ | ano | přes EU geo profil; use case formulář |
| DeepSeek V3.2 | €€ | ne | ověř přesný ID v Model catalog |

Kompletní dostupnost per region: Bedrock docs → „Regional availability by
models" nebo v konzoli Model catalog (filtr podle regionu).

### Vision routing

- `AWS_BEDROCK_MODEL_ID` = model pro všech 30 AI nástrojů (text).
- `AWS_BEDROCK_VISION_MODEL_ID` = volitelný model POUZE pro ai-vision
  (obrázky). Není-li nastaven, jde ai-vision na hlavní model — u text-only
  modelu (Qwen3) by volání selhalo, proto ho u text-only defaultu nastav.
- Llava fallback zůstává pro Ollama (lokální vývoj); Bedrock cesta posílá
  obrázky jako image content blocks automaticky.

## Řešení problémů

| Chyba | Příčina |
|---|---|
| 502 „AI služba není dostupná" | Bedrock není nastaven a Ollama není dosažitelná |
| 502 „nemá povolen přístup k modelu" | chybí Bedrock Model access nebo IAM |
| 429 „AI služba je přetížená" | Bedrock throttling nebo rate limit (30/min/IP) |
| 503 „AI služba je dočasně nedostupná" | rate-limit storage (Supabase) nedostupná — fail-closed |
