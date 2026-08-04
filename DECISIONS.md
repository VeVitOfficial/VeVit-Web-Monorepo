# VEVIT SSO — rozhodnutí a technický dluh

Tento soubor doplňuje schválený implementační plán. Zaznamenává závazná
rozhodnutí uživatele i bezpečnější výklad rozporů nalezených během realizace.

## Závazná rozhodnutí

- Autoritativní pracovní kopie je tento monorepo adresář. Před změnami vznikl
  externí archiv a baseline commit `28c724f`.
- Mobilní aplikace a CLI budou pouze first-party klienti. Ve verzi browser SSO
  zůstává Bearer větev vypnutá.
- `api_refresh_tokens.user_id` je `text`, protože `public.users.id` je `text`.
- Existující `session_token` se před hashovým čtením backfilluje do
  `token_hash`; migrace nesmí odhlásit žádnou z 15 aktivních relací.
- Zrušení relace je soft revoke přes `revoked_at` a `revoked_reason`. Fyzické
  mazání provádí až cleanup po 30 dnech.
- Browser cookie je `__Host-vvsession`, bez `Domain`, s pevnou expirací 99 dní
  nebo serverovým limitem 24 hodin u session cookie. Aktivita expiraci neposouvá.
- Chyba databáze nebo sítě je 503 a zachovává cookie; neplatná relace je 401.
- Skripty musí splnit `script-src 'self'` bez `unsafe-inline` a `unsafe-eval`.
  Styly mají dočasně `style-src 'self' 'unsafe-inline'`.
- Google Fonts, Lucide, KaTeX a Prism se obsluhují lokálně. Tailwind Play CDN
  nahrazuje staticky sestavené CSS.
- Wikipedia se načítá přes same-origin proxy s pevným upstreamem, timeoutem a
  limitem odpovědi; obsah se sanitizuje na serveru i klientovi.
- Opaque sandbox zprávy musí současně ověřit `origin === "null"`, přesný
  `event.source`, jednorázový nonce a schéma dat; listener se vždy odstraní.
- Účet má stav `active`, `blocked` nebo `deleted`. Jiný než `active` revokuje
  všechny relace a vrací 401.
- Povinné ruční stop-body jsou pouze: S-1 rotace service role, S-2 CSP enforce a
  S-3 odstranění fallbacků s migrací `003_drop_plaintext_token`.

## Bezpečnější výklady rozporů

- Aktivní tajné konfigurace se nepřidávají do Git historie. Baseline rollback
  pro ně zajišťuje externí archiv, ne commit.
- Soubory pojmenované `config.php`, které jsou pouze bezpečný aplikační loader
  (`store/config.php`, `store/lib/config.php`, `tools/includes/config.php`), se
  verzují; aktivní konfigurace s tajemstvími jsou ignorované.
- `shared/auth/` nesmí být dostupné přes HTTP. Veřejný session JavaScript proto
  nebude zpřístupněn pod URL, kterou Nginx blokuje pro celé `/shared/`; veřejná
  URL bude mapována odděleně a serverová auth vrstva zůstane privátní.
- U sandboxu bez `allow-same-origin` je `event.origin` záměrně `"null"` a samo o
  sobě neověřuje odesílatele; autentizaci zprávy zajišťuje kombinace source a
  nonce.
- Izolovaný playground používá statický same-origin iframe s opaque originem a
  uvnitř Blob Web Worker. Pouze `/edu/sandbox-frame.html` proto potřebuje
  `worker-src blob:` a `frame-ancestors 'self'`; ostatní stránky mohou mít
  `frame-ancestors 'none'`.
- Původní vendored DOMPurify 3.1.6 byl nahrazen aktuálním vydáním 3.4.12 z npm
  balíčku `dompurify`; auditovaný soubor má SHA-256
  `c45ba939765574f96cbf35ee9b6d89f73756a17921814425e74b82f7c54603ce`.
- Pokyn odstranit kořenové `/api/` kontrakty neznamená směrovat neautentizační
  služby do Accountu. Auth endpointy používají `/account/api/`, zatímco Tools AI,
  SSL a feedback používají `/tools/api/` a legacy kurzová API
  `/edu/legacy/api/`. Tím nevzniká kolize ani paralelní autentizační vrstva.
- Runtime CDN byly nahrazeny lokálními verzemi: Lucide 1.28.0, KaTeX 0.18.1,
  Prism 1.30.0, mark.js 8.11.1 a statický Tailwind CSS sestavený Tailwindem
  3.4.17. Fonty a Material Symbols jsou lokální WOFF2 assety.
- Přísné `script-src 'self'` v Chromium blokuje nejen JavaScriptový `eval`, ale
  také `WebAssembly.compile`; ffmpeg.wasm by vyžadoval další zdroj
  `'wasm-unsafe-eval'`. Protože uživatel schválil politiku bez výjimek, devět
  FFmpeg nástrojů je dočasně označeno jako omezených a wrapper failuje zavřeně
  ještě před načtením WASM. Starý UMD bundle 0.11.6 s `new Function` byl přesto
  nahrazen ESM verzemi `@ffmpeg/ffmpeg` 0.12.15 a `@ffmpeg/core` 0.12.10. Budoucí
  zapnutí vyžaduje samostatně schválený izolovaný mediální origin nebo CSP.
- Hub testy po přesunu do `/tools` stále skládaly fyzickou cestu jako
  `tools/tools/assets`. Testovací filesystem kontrakty byly opraveny na lokální
  `tools/assets`, zatímco veřejné URL zůstávají `/tools/assets/...`.

## Evidovaný technický dluh

- Odstranit stovky inline `style=` atributů a následně odebrat
  `'unsafe-inline'` ze `style-src`. Tento dluh neblokuje SSO.
- Převést `edu/ai-gramotnost.lessons.content` z `MEDIUMTEXT` HTML na
  strukturované bloky. Do té doby se používá úzký DOMPurify allowlist.
- Provozní CSP report-only sběr musí běžet nejméně týden před S-2.
- Non-browser access/refresh tokeny jsou samostatný release po stabilizaci SSO.
