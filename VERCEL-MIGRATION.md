# Migrace VeVit z WEDOS na Vercel

## Výsledná architektura

- **Next.js 16 / App Router** obsluhuje routing, Store, Route Handlers a metadata.
- **Vercel CDN** publikuje CSS, JavaScript, fonty, obrázky, WebAssembly a další klientské assety.
- **Vercel Functions v `fra1`** tvoří BFF vrstvu před Supabase; tajné klíče se neposílají do prohlížeče.
- **Supabase Data API** poskytuje veřejný katalog. Výsledky se revalidují po 5 minutách, kategorie po hodině.
- **Supabase Edge Functions** dál obsluhují autentizaci, privátní operace, objednávky a Stripe. Vercel jim předává původní cestu v `x-vevit-original-path`.
- **Vercel Analytics a Speed Insights** jsou zapnuté pro nové Next stránky i pro převzaté HTML dokumenty.

PHP se na Vercelu nespouští. Soubory PHP v repozitáři zůstávají pouze jako referenční implementace pro postupné dočištění; produkční request na ně jde přes Next.js nebo Supabase Edge Function.

## Proměnné prostředí ve Vercelu

V Project Settings → Environment Variables nastavte pro Production i Preview hodnoty z `.env.example`:

| Proměnná | Viditelnost | Účel |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | veřejná | Kanonická URL, v produkci `https://vevit.cz` |
| `SUPABASE_URL` | server | URL projektu |
| `SUPABASE_SECRET_KEY` | server | Komponentní secret key pro katalog; nikdy `NEXT_PUBLIC_` |
| `SUPABASE_AUTH_FUNCTION_URL` | server | Plná URL Edge Function `auth` |
| `SUPABASE_API_FUNCTION_URL` | server | Plná URL Edge Function `api` |
| `SUPABASE_STRIPE_WEBHOOK_URL` | server | Plná URL Edge Function `stripe-webhook` |
| `VEVIT_EDGE_PROXY_SECRET` | server | Volitelný sdílený BFF secret kontrolovaný Edge Functions |

Vercel build při chybějící povinné proměnné skončí chybou. Lokální build bez tajných hodnot funguje, katalog je prázdný a `/api/health` vrací `503 degraded`.

## Nastavení projektu ve Vercelu

1. Importujte Git repozitář a ponechte Root Directory na kořeni tohoto projektu.
2. Framework Preset nastavte na Next.js; ostatní build hodnoty načte `vercel.json`.
3. Zapněte Web Analytics a Speed Insights v dashboardu.
4. Přidejte domény `vevit.cz` a `www.vevit.cz`; `www` přesměrujte na hlavní doménu.
5. Po úspěšném Preview otestujte `/api/health`, přihlášení, košík, Stripe testovací platbu a teprve potom změňte DNS.

Nepřidávejte Vercel Cron pro Stripe synchronizaci. Projekt už používá PostgreSQL cron → `stripe-worker`; druhý plánovač by mohl vytvořit duplicitní běhy. Přílohy a avatary mají zůstat v Supabase Storage, protože filesystem Vercel Functions je dočasný.

## Externí callbacky při cutoveru

- OAuth Google/GitHub/Discord: callbacky nastavte na `https://vevit.cz/account/api/oauth/<provider>/callback.php`. Starý suffix zůstává kompatibilní díky BFF routě.
- Stripe webhook: nastavte `https://vevit.cz/store/api/webhook.php`. Route Handler zachová raw body i `Stripe-Signature` a předá je Edge Function.
- Supabase/CORS allowlist: povolte `https://vevit.cz` a konkrétní Preview originy používané pro testování.
- Cookie doména má být `vevit.cz`, cesta `/`, `Secure`, `HttpOnly` a `SameSite=Lax`; nové session cookie preferujte s prefixem `__Host-` bez atributu Domain.

## Kompatibilní URL

- `/` vybírá jazyk z cookie nebo `Accept-Language` a přesměruje na `/<lang>/home`.
- `/<lang>/home`, `account`, `edu`, `tools` zachovávají současný frontend.
- Všech 107 Tools je předgenerováno pro sedm jazyků; jejich výpočet běží převážně lokálně v prohlížeči.
- `/<lang>/store`, katalog, produkt, košík a checkout jsou Next.js routy.
- Staré Store adresy jako `catalog.php` a `product.php?slug=...` se přesměrují na nové cesty.
- Lokalizované API cesty se interně přepíší na jednu kanonickou Route Handler cestu.

## Příkazy a ověření

```bash
npm run export:legacy-tools  # po změně registry nebo HTML nástroje
npm run lint
npm run typecheck
npm run build
npm start
```

Smoke test po startu:

```bash
curl -I http://localhost:3000/cs/home
curl -I http://localhost:3000/cs/tools/pdf-merge
curl -I http://localhost:3000/cs/edu/dashboard
curl -I http://localhost:3000/cs/account/login
curl -I http://localhost:3000/cs/store/catalog
curl http://localhost:3000/api/health
```

## Bezpečnostní poznámky

- Secret/service-role klíče jsou pouze serverové. Do klienta patří jen skutečně veřejné hodnoty s prefixem `NEXT_PUBLIC_`.
- Nové tabulky nejsou v aktuálním Supabase automaticky vystavené Data API. Při přidání tabulky explicitně nastavte API grants a zapněte RLS.
- Produkční stránky posílají HSTS, `nosniff`, COOP, Referrer Policy a Permissions Policy. CSP je zatím Report-Only, protože převzaté HTML stále obsahuje inline styly; po jejich odstranění lze CSP přepnout do enforce režimu.
- `/api/health` zveřejňuje pouze stav konfigurace, nikdy hodnoty tajných proměnných.
