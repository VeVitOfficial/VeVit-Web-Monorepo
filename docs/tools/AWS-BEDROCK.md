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
2. **Region**: vpravo nahoře v konzoli vyber **EU (Frankfurt) eu-central-1**
   (nejbližší Vercelu, který běží ve fra1).
3. **Model access**: otevři
   https://console.aws.amazon.com/bedrock/home?region=eu-central-1#/modelaccess
   → najdi **Claude 3.5 Haiku** → „Manage" → ponech **User profile type:
   All users in this account** → **Save changes** → stav se do pár minut
   změní na „Access granted".
   (Volitelně stejně povol i Claude 3.5 Sonnet pro kvalitnější odpovědi.)
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
   | `AWS_REGION` | `eu-central-1` |
   | `AWS_BEDROCK_MODEL_ID` | `eu.anthropic.claude-3-5-haiku-20241022-v1:0` |
   | `AWS_ACCESS_KEY_ID` | `AKIA…` (z kroku A6) |
   | `AWS_SECRET_ACCESS_KEY` | secret z kroku A6 |

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

## Ceny (orientačně, Claude 3.5 Haiku)

| | cena za 1M tokenů |
|---|---|
| vstup | ~$0.80 |
| výstup | ~$4.00 |

Typický dotaz nástroje (~500 vstupních + 300 výstupních tokenů) ≈ **$0.0016**
— tisíc dotazů ≈ $1.6. Pro jistotu si v AWS Billing → Budgets nastav
alarm (např. $10/měsíc).

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
