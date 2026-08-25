# VeVit Web App

Produkční aplikace je připravená pro Vercel jako Next.js 16 App Router projekt.
Původní HTML/CSS/JS aplikace jsou během buildu bezpečně publikované jako statické
assety, veřejný Store běží v Next.js a serverové operace se předávají existujícím
Supabase Edge Functions.

```bash
npm ci
npm run export:legacy-tools
npm run dev
```

Před prvním nasazením pokračujte podle [VERCEL-MIGRATION.md](./VERCEL-MIGRATION.md).
