# VeVit Web App

Jedna Next.js 16 (App Router) aplikace v TypeScriptu a Reactu pro všechny
sekce webu: Home, Account, Edu, Tools, Store a Services. Běží na Vercelu
(Node.js runtime), data a autentizace jsou v Supabase.

```bash
npm ci
npm run dev
```

## Struktura

| Cesta | Obsah |
|---|---|
| `src/app/<sekce>/` | Stránky a Route Handlery (`/home`, `/account`, `/edu`, `/tools`, `/store`, `/services`). Staré `.php` adresy API jsou zachované jako názvy rout. |
| `src/components/<sekce>/` | React komponenty sekcí. |
| `src/lib/` | Serverová logika (session, Supabase, Stripe, kvízy…). |
| `src/styles/` | CSS sekcí importované z layoutů a stránek; `vevit-tailwind.css` generuje `npm run build:tailwind`. |
| `src/content/` | Serverový obsah (kurz AI gramotnosti, privátní kvízové otázky). |
| `src/proxy.ts` | Jazykové prefixy `/<cs\|en\|…>/<sekce>/…` → interní routy, subdoménové redirecty. |
| `public/` | Statické soubory servírované tak, jak jsou: fonty, vendor knihovny, sdílené skripty (`assets/shared`), knihovny nástrojů (`tools/assets`), data kurzů (`edu/data`), obrázky. |
| `supabase/` | Edge Function `stripe-webhook` a historie SQL migrací (`supabase/sql`). |
| `scripts/` | `secret-scan.mjs` (CI). |
| `tests/` | `npm test` (sandbox runner), `npm run test:browser` (Chromium), `npm run test:smoke` (produkce). |
| `docs/` | Rozhodnutí, reporty a postup nasazení ([VERCEL-MIGRATION.md](./docs/VERCEL-MIGRATION.md)). |

## Příkazy

```bash
npm run typecheck
npm run lint
npm test
npm run build   # build:tailwind + next build
```
