# VEVIT Same-Origin SSO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans
> to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Zavést bezpečné jednotné přihlášení pro `/account`, `/store`,
`/tools`, `/edu` a `/home` s centrální opaque relací v Supabase.

**Architecture:** Account je jediný issuer. Sdílená serverová PHP vrstva ověřuje
hash tokenu, absolutní expiraci, stav účtu, role a CSRF. Frontendy používají
jediný endpoint `/account/api/me.php`; cookie nikdy nečtou.

**Tech Stack:** PHP 8.2+, vanilla JavaScript, PostgreSQL/Supabase PostgREST,
Nginx/Apache, Node-based statické a browser regression testy.

---

### Task 1: Rollback baseline a rozhodnutí

- [x] Vytvořit externí tar archiv před první změnou.
- [x] Inicializovat Git, ignorovat tajemství/runtime a commitnout baseline.
- [ ] Commitnout tento plán a `DECISIONS.md`.

### Task 2: Společná XSS regression brána

- [ ] Přidat test, který nejdřív selže na známých payloads pro Wikipedia,
  markdown, Store a obě Edu implementace.
- [ ] Přidat statický test zákazu inline scriptů, inline handlerů,
  `new Function`, externích scriptů a kořenového frontend `/api/`.
- [ ] Spouštět testy před a po každém souvisejícím celku.

### Task 3: Edu sanitizace a sandboxy

- [ ] Vendorovat DOMPurify a zavést úzký jednotný allowlist.
- [ ] Přidat `/edu/api/wikipedia.php` s pevným upstreamem, timeoutem, limitem a
  serverovou sanitizací; klient výsledek znovu sanitizuje a renderuje v opaque
  iframe.
- [ ] Nahradit oba playgroundy jedním sandbox protokolem se source, null-origin,
  nonce a schema kontrolou a garantovaným cleanupem.
- [ ] Sanitizovat legacy `lesson.content`; strukturovaný renderer ponechat.

### Task 4: Tools a Store DOM XSS

- [ ] Napsat fail-closed markdown renderer a převést na něj editor i všechny AI
  výstupy.
- [ ] Přepsat produktové karty a stránkování Store na DOM API a posluchače.
- [ ] Rozšířit HTML→PDF test o mutation-XSS payloads.

### Task 5: Strict script CSP prerequisites

- [ ] Pinovat a lokálně obsluhovat Lucide, KaTeX, Prism a fonty.
- [ ] Nahradit Tailwind Play CDN staticky sestaveným CSS.
- [ ] Přesunout inline skripty do externích souborů a handlery na listeners.
- [ ] Ověřit nulový nález zakázaných script konstrukcí.

### Task 6: CSP report-only a jednotné hlavičky

- [ ] Přidat omezený same-origin report endpoint bez ukládání citlivých dat.
- [ ] Přidat report-only politiku se `script-src 'self'` a dočasným inline style
  ústupkem.
- [ ] Opakovat sadu hlaviček ve vnořených Nginx locations, aby se neztratila
  děděním.
- [ ] Zapsat lokálně zjištěné violations; produkční týdenní sběr zůstává bránou
  S-2.

### Task 7: Path routing

- [ ] Nejprve přidat selhávající integrační test pro kořenové frontend `/api/`.
- [ ] Převést Account, Home, Tools a legacy Edu na path-based endpointy.
- [ ] Home přesměrovat přímo na centrální `me.php`, bez paralelního issueru.

### Task 8: Tajemství mimo webroot a S-1

- [ ] Zavést absolutní konfigurační cestu s fail-closed loaderem a testy.
- [ ] Přesunout aktivní konfigurace mimo document root bez zveřejnění hodnot.
- [ ] Přidat explicitní Nginx blokace configů a `shared/`.
- [ ] Přidat CI secret scan celého webrootu a ověřit negativní i pozitivní test.
- [ ] Ověřit Account/Home konzumenty a zastavit před S-1 rotací.

### Task 9: Fáze 1 Supabase

- [ ] Před migrací znovu uložit read-only schema/grants/policies a počet relací.
- [ ] Připravit a aplikovat lockdown, hash backfill, account status,
  `api_refresh_tokens`, cleanup a opravy advisor nálezů.
- [ ] Připravit, ale nespustit `003_drop_plaintext_token`.
- [ ] Ověřit granty, policies, Advisor a zachování všech původních relací.

### Task 10: Sdílená auth vrstva a Account endpointy

- [ ] Test-first implementovat veřejné PHP rozhraní, 401/503 rozlišení,
  absolutní expiraci, soft revoke, Bearer feature flag, CSRF a fresh auth.
- [ ] Převést Account endpointy a citlivé operace na centrální vrstvu.
- [ ] Přidat session UI, rate limiting a bezpečný `return_to`.

### Task 11: Sdílený frontend a migrace

- [ ] Převést aplikace na jediný session modul a fail-closed autorizaci dat.
- [ ] Implementovat legacy Account a Store konverzi bez prodloužení expirace a
  bez odhadu identity.
- [ ] Po stabilizaci zastavit před nevratnou S-3.

### Task 12: Akceptace a provozní brány

- [ ] Udržovat tabulku kritérií 1–15 s automatickým testem nebo manuálním
  postupem.
- [ ] Před S-2 dodat report-only violations a blokery.
- [ ] Před závěrečným shrnutím spustit úplnou testovací sadu, syntax checks,
  secret scan, Git diff audit a Supabase verifikace.
